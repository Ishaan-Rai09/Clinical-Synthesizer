"""Vector store management for the Clinical Evidence Synthesizer.

Uses Pinecone serverless as the cloud vector database for storing
and searching document chunk embeddings. No local persistence needed.
"""

import os
import re
from typing import List, Optional, Dict

from langchain_core.documents import Document
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec

from src.embeddings import NVIDIAEmbeddings

# ---------------------------------------------------------------------------
# Configuration from environment variables
# ---------------------------------------------------------------------------
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX", "clinical-synthesizer")
PINECONE_CLOUD = os.getenv("PINECONE_CLOUD", "aws")
PINECONE_REGION = os.getenv("PINECONE_REGION", "us-east-1")
# nv-embed-v1 produces 1024-dimensional vectors
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "1024"))

# ---------------------------------------------------------------------------
# Global lazy-init clients
# ---------------------------------------------------------------------------
_pc: Optional[Pinecone] = None
_index = None
_vector_store: Optional[PineconeVectorStore] = None
# In-memory cache of {filename: chunk_count}, rebuilt from Pinecone on demand
_document_cache: Optional[Dict[str, int]] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_pinecone_client() -> Pinecone:
    global _pc
    if _pc is None:
        _pc = Pinecone(api_key=PINECONE_API_KEY)
    return _pc


def _get_or_create_index():
    """Return the Pinecone index, creating a serverless index if it doesn't exist."""
    global _index
    if _index is not None:
        return _index

    pc = _get_pinecone_client()
    existing = [idx.name for idx in pc.list_indexes()]

    if PINECONE_INDEX_NAME not in existing:
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=EMBEDDING_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(cloud=PINECONE_CLOUD, region=PINECONE_REGION),
        )

    _index = pc.Index(PINECONE_INDEX_NAME)
    return _index


def _get_embeddings() -> NVIDIAEmbeddings:
    return NVIDIAEmbeddings()


def _get_vector_store() -> PineconeVectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = PineconeVectorStore(
            index_name=PINECONE_INDEX_NAME,
            embedding=_get_embeddings(),
            pinecone_api_key=PINECONE_API_KEY,
        )
    return _vector_store


def _make_vector_id(filename: str, page: int, chunk_index: int) -> str:
    """Create a unique, parseable vector ID.

    Format: <safe-filename>::p<page>::c<chunk>
    """
    safe = re.sub(r"[^\w.-]", "_", filename)
    return f"{safe}::p{page}::c{chunk_index}"


def _rebuild_document_cache() -> Dict[str, int]:
    """Scan all vector IDs in Pinecone to rebuild the document filename cache."""
    global _document_cache
    _document_cache = {}
    index = _get_or_create_index()

    try:
        # Paginate through vector IDs and extract unique source filenames
        seen: Dict[str, int] = {}
        for ids_batch in index.list():
            for vid in ids_batch:
                # video format: filename::pN::cM  → extract filename
                parts = vid.split("::")
                if parts:
                    fname = parts[0]
                    seen[fname] = seen.get(fname, 0) + 1
        _document_cache = seen
    except Exception:
        pass  # Return empty cache on any error

    return _document_cache


# ---------------------------------------------------------------------------
# Public API — matches the interface expected by main.py / tools.py
# ---------------------------------------------------------------------------

def search(query: str, k: int = 5) -> List[Document]:
    """Search Pinecone for the top-k most relevant chunks."""
    vs = _get_vector_store()
    return vs.similarity_search(query, k=k)


def add_documents(chunks: List[Document]) -> None:
    """Upsert document chunks into Pinecone.

    Each chunk gets a custom vector ID (derived from its filename / page /
    chunk index) so we can later list or delete by source document.
    """
    if not chunks:
        return

    vs = _get_vector_store()
    ids = [
        _make_vector_id(
            chunk.metadata.get("source", "unknown"),
            chunk.metadata.get("page", 0),
            i,
        )
        for i, chunk in enumerate(chunks)
    ]

    # Store text inside metadata so Pinecone has a full record
    for chunk in chunks:
        chunk.metadata.setdefault("text", chunk.page_content)

    vs.add_documents(documents=chunks, ids=ids)

    # Update in-memory cache
    source = chunks[0].metadata.get("source", "unknown")
    if _document_cache is not None:
        _document_cache[source] = len(chunks)


def delete_document(filename: str) -> None:
    """Delete all chunks associated with a source document from Pinecone.

    The delete is performed via a metadata filter on ``source``.
    """
    index = _get_or_create_index()
    index.delete(filter={"source": filename})

    # Update in-memory cache
    if _document_cache is not None and filename in _document_cache:
        del _document_cache[filename]


def list_documents() -> List[dict]:
    """Return a list of ``{"filename": …, "chunks": …}`` dicts."""
    global _document_cache
    if _document_cache is None:
        _rebuild_document_cache()
    return [
        {"filename": fname, "chunks": count}
        for fname, count in (_document_cache or {}).items()
    ]

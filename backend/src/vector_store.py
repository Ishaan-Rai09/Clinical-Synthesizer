"""Vector store management for the Clinical Evidence Synthesizer.

Uses Pinecone serverless SDK directly (no langchain-pinecone adapter).
"""

import os
import re
import traceback
from typing import List, Optional, Dict

from langchain_core.documents import Document
from pinecone import Pinecone, ServerlessSpec

from src.embeddings import NVIDIAEmbeddings

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX", "clinical-synthesizer")
PINECONE_CLOUD = os.getenv("PINECONE_CLOUD", "aws")
PINECONE_REGION = os.getenv("PINECONE_REGION", "us-east-1")
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "4096"))

# Namespace for isolation
NAMESPACE = ""

# ---------------------------------------------------------------------------
# Lazy globals
# ---------------------------------------------------------------------------
_pc: Optional[Pinecone] = None
_index = None
_embeddings: Optional[NVIDIAEmbeddings] = None
_document_cache: Optional[Dict[str, int]] = None


# ---------------------------------------------------------------------------
# Internals
# ---------------------------------------------------------------------------

def _get_client() -> Pinecone:
    global _pc
    if _pc is None:
        _pc = Pinecone(api_key=PINECONE_API_KEY)
    return _pc


def _get_index():
    global _index
    if _index is not None:
        return _index

    pc = _get_client()
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
    global _embeddings
    if _embeddings is None:
        _embeddings = NVIDIAEmbeddings()
    return _embeddings


def _make_vid(filename: str, page: int, idx: int) -> str:
    safe = re.sub(r"[^\w.-]", "_", filename)
    return f"{safe}::p{page}::c{idx}"


def _rebuild_cache() -> Dict[str, int]:
    global _document_cache
    _document_cache = {}
    try:
        index = _get_index()
        seen: Dict[str, int] = {}
        for batch in index.list():
            for vid in batch:
                parts = vid.split("::")
                if parts:
                    fname = parts[0]
                    seen[fname] = seen.get(fname, 0) + 1
        _document_cache = seen
    except Exception:
        pass
    return _document_cache or {}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def search(query: str, k: int = 5) -> List[Document]:
    """Search Pinecone for the top-k most relevant chunks."""
    emb = _get_embeddings()
    q_vec = emb.embed_query(query)
    index = _get_index()
    results = index.query(
        vector=q_vec,
        top_k=k,
        include_metadata=True,
        namespace=NAMESPACE,
    )
    docs = []
    for match in results.get("matches", []):
        meta = match.get("metadata", {}) or {}
        docs.append(Document(
            page_content=meta.get("text", ""),
            metadata={k: v for k, v in meta.items() if k != "text"},
        ))
    return docs


def add_documents(chunks: List[Document]) -> None:
    """Upsert document chunks into Pinecone using the SDK directly."""
    if not chunks:
        return

    emb = _get_embeddings()
    index = _get_index()

    # Generate embeddings for all chunks
    texts = [chunk.page_content for chunk in chunks]
    try:
        vectors = emb.embed_documents(texts)
    except Exception as e:
        raise RuntimeError(f"Embedding failed: {type(e).__name__}: {e}\n{traceback.format_exc()}")

    # Build Pinecone records
    records = []
    for i, (chunk, vec) in enumerate(zip(chunks, vectors)):
        vid = _make_vid(
            chunk.metadata.get("source", "unknown"),
            chunk.metadata.get("page", 0),
            i,
        )
        records.append({
            "id": vid,
            "values": vec,
            "metadata": {
                "text": chunk.page_content,
                "source": chunk.metadata.get("source", "unknown"),
                "page": chunk.metadata.get("page", 0),
            },
        })

    # Upsert to Pinecone
    try:
        index.upsert(vectors=records, namespace=NAMESPACE)
    except Exception as e:
        raise RuntimeError(f"Pinecone upsert failed: {type(e).__name__}: {e}\n{traceback.format_exc()}")

    # Update cache
    source = chunks[0].metadata.get("source", "unknown")
    if _document_cache is not None:
        _document_cache[source] = len(chunks)


def delete_document(filename: str) -> None:
    """Delete all chunks associated with a source document."""
    index = _get_index()
    index.delete(filter={"source": filename}, namespace=NAMESPACE)
    if _document_cache is not None and filename in _document_cache:
        del _document_cache[filename]


def list_documents() -> List[dict]:
    """Return a list of {filename, chunks} dicts."""
    global _document_cache
    if _document_cache is None:
        _rebuild_cache()
    return [
        {"filename": fname, "chunks": count}
        for fname, count in (_document_cache or {}).items()
    ]

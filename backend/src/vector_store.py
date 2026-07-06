"""Vector store management for the Clinical Evidence Synthesizer.

Uses FAISS (Facebook AI Similarity Search) with OpenAI embeddings
to index and search document chunks.
"""

import os
import pickle
from typing import List, Optional

from langchain_core.documents import Document
from src.embeddings import NVIDIAEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.vectorstores.utils import DistanceStrategy

# Import document processor at module level (no circular dependency)
from src.document_processor import load_and_chunk_pdf

# Paths
# In production (Fly.io), use STORAGE_DIR env var for persistent volume
# In local dev, use relative paths from project root
BASE_DIR = os.getenv("STORAGE_DIR") or os.path.dirname(os.path.dirname(__file__))
VECTOR_STORE_DIR = os.path.join(BASE_DIR, "vector_store")
DATA_DIR = os.path.join(BASE_DIR, "data")
METADATA_PATH = os.path.join(VECTOR_STORE_DIR, "metadata.pkl")


def _get_embeddings() -> NVIDIAEmbeddings:
    """Get the NVIDIA embeddings instance.

    Uses a custom NVIDIAEmbeddings class that sends raw text strings
    (not token IDs) to NVIDIA's OpenAI-compatible API endpoint.
    """
    model = os.getenv("OPENAI_EMBEDDING_MODEL", "nvidia/nv-embed-v1")
    return NVIDIAEmbeddings(model=model)


def _build_from_scratch(chunks: List[Document]) -> FAISS:
    """Build a new FAISS index from scratch and save to disk.

    Args:
        chunks: List of Document objects to index.

    Returns:
        The new FAISS vector store instance.
    """
    os.makedirs(VECTOR_STORE_DIR, exist_ok=True)
    embeddings = _get_embeddings()

    vector_store = FAISS.from_documents(
        documents=chunks,
        embedding=embeddings,
        distance_strategy=DistanceStrategy.COSINE,
    )

    vector_store.save_local(VECTOR_STORE_DIR, "faiss_index")
    return vector_store


def create_index(chunks: List[Document]) -> FAISS:
    """Create a FAISS vector store from document chunks, merging with any existing index.

    Args:
        chunks: List of Document objects to index.

    Returns:
        The FAISS vector store instance.
    """
    vector_store = _build_from_scratch(chunks)

    # Save metadata
    _rebuild_metadata()

    return vector_store


def load_index() -> Optional[FAISS]:
    """Load the existing FAISS index from disk.

    Returns:
        The FAISS vector store if it exists, None otherwise.
    """
    index_file = os.path.join(VECTOR_STORE_DIR, "faiss_index.faiss")
    if not os.path.exists(index_file):
        return None

    embeddings = _get_embeddings()
    vector_store = FAISS.load_local(
        VECTOR_STORE_DIR,
        embeddings,
        "faiss_index",
        allow_dangerous_deserialization=True,
    )
    return vector_store


def search(query: str, k: int = 5) -> List[Document]:
    """Search the FAISS index for the top-k most relevant chunks.

    Args:
        query: The search query string.
        k: Number of results to return.

    Returns:
        List of Document objects sorted by relevance.
    """
    vector_store = load_index()
    if vector_store is None:
        return []

    return vector_store.similarity_search(query, k=k)


def add_documents(chunks: List[Document]) -> FAISS:
    """Add new document chunks to an existing index, or create a new one.

    Args:
        chunks: List of Document objects to add.

    Returns:
        The updated FAISS vector store.
    """
    existing = load_index()
    if existing is None:
        return create_index(chunks)

    embeddings = _get_embeddings()

    # Add documents to existing index
    existing.add_documents(chunks)

    # Save updated index
    existing.save_local(VECTOR_STORE_DIR, "faiss_index")

    # Update metadata
    _rebuild_metadata()

    return existing


def delete_document(filename: str) -> None:
    """Remove all chunks associated with a document and rebuild the index.

    This works by:
    1. Removing the filename's metadata entry
    2. Re-processing all remaining PDFs in the data/ directory
    3. Rebuilding the FAISS index from scratch

    Args:
        filename: The source filename to remove.
    """
    metadata = _load_metadata()
    if filename not in metadata:
        return

    # Remove from metadata
    del metadata[filename]
    _save_metadata(metadata)

    # Remove the old FAISS index files
    index_faiss = os.path.join(VECTOR_STORE_DIR, "faiss_index.faiss")
    index_pkl = os.path.join(VECTOR_STORE_DIR, "faiss_index.pkl")
    for path in [index_faiss, index_pkl]:
        if os.path.exists(path):
            os.remove(path)

    # Rebuild the index from remaining PDFs in the data directory
    _rebuild_index_from_data()


def _rebuild_index_from_data() -> None:
    """Rebuild the FAISS index by re-processing all PDFs in the data directory."""
    if not os.path.exists(DATA_DIR):
        return

    all_chunks = []
    pdf_files = [f for f in os.listdir(DATA_DIR) if f.lower().endswith(".pdf")]

    for filename in pdf_files:
        file_path = os.path.join(DATA_DIR, filename)
        try:
            chunks = load_and_chunk_pdf(file_path, filename)
            all_chunks.extend(chunks)
        except Exception:
            # Skip corrupted files during rebuild
            continue

    if all_chunks:
        _build_from_scratch(all_chunks)

        # Rebuild metadata to match the new index
        _rebuild_metadata()


def _rebuild_metadata() -> dict:
    """Rebuild metadata from scratch by scanning data/ directory.

    Returns:
        The updated metadata dict.
    """
    metadata = {}

    if os.path.exists(DATA_DIR):
        pdf_files = [f for f in os.listdir(DATA_DIR) if f.lower().endswith(".pdf")]
        for filename in pdf_files:
            file_path = os.path.join(DATA_DIR, filename)
            try:
                chunks = load_and_chunk_pdf(file_path, filename)
                metadata[filename] = [
                    {
                        "page": chunk.metadata.get("page", 0),
                        "content_preview": chunk.page_content[:100],
                    }
                    for chunk in chunks
                ]
            except Exception:
                metadata[filename] = []

    _save_metadata(metadata)
    return metadata


def list_documents() -> List[dict]:
    """List all indexed documents with their chunk counts.

    Returns:
        List of dicts with "filename" and "chunks" keys.
    """
    metadata = _load_metadata()
    return [
        {"filename": filename, "chunks": len(chunks)}
        for filename, chunks in metadata.items()
    ]


def _load_metadata() -> dict:
    """Load metadata from disk."""
    if os.path.exists(METADATA_PATH):
        with open(METADATA_PATH, "rb") as f:
            return pickle.load(f)
    return {}


def _save_metadata(metadata: dict) -> None:
    """Save metadata to disk."""
    os.makedirs(VECTOR_STORE_DIR, exist_ok=True)
    with open(METADATA_PATH, "wb") as f:
        pickle.dump(metadata, f)

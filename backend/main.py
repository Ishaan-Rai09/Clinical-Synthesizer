"""Binary-search debug: imports modules one at a time to find the crash."""

import os
import sys
from fastapi import FastAPI

app = FastAPI()

IMPORT_RESULTS = {}

# Test import chain level by level
tests = [
    ("os", "import os"),
    ("fastapi", "from fastapi import FastAPI"),
    ("dotenv", "from dotenv import load_dotenv"),
    ("pypdf", "from langchain_community.document_loaders import PyPDFLoader"),
    ("langchain_core", "from langchain_core.documents import Document"),
    ("langchain_text_splitters", "from langchain_text_splitters import RecursiveCharacterTextSplitter"),
    ("openai", "import openai"),
    ("langchain_openai", "from langchain_openai import ChatOpenAI"),
    ("pinecone", "from pinecone import Pinecone, ServerlessSpec"),
    ("simsimd", "import simsimd"),
    ("langchain_pinecone", "from langchain_pinecone import PineconeVectorStore"),
    ("langchain_agent", "from langchain.agents import create_agent"),
    ("nvidia_emb", "from src.embeddings import NVIDIAEmbeddings"),
    ("src_models", "from src.models import CompareRequest, CompareResponse, DocumentInfo, QueryRequest, QueryResponse, SourceCitation, UploadResponse"),
    ("src_vector", "from src.vector_store import add_documents, delete_document, list_documents, search"),
    ("src_docproc", "from src.document_processor import load_and_chunk_pdf"),
    ("src_tools", "from src.tools import search_evidence, compare_drug_outcomes, list_available_evidence"),
    ("src_agent", "from src.agent import run_agent"),
]

for name, imp in tests:
    try:
        exec(imp)
        IMPORT_RESULTS[name] = "ok"
    except Exception as e:
        IMPORT_RESULTS[name] = f"FAIL: {type(e).__name__}: {e}"

    # If this import failed, stop here so the health endpoint reflects it
    if IMPORT_RESULTS[name].startswith("FAIL"):
        break


@app.get("/api/health")
async def health_check():
    return {
        "status": "degraded" if any(v.startswith("FAIL") for v in IMPORT_RESULTS.values()) else "healthy",
        "imports": IMPORT_RESULTS,
        "cwd": os.getcwd(),
        "files_root": os.listdir("."),
        "files_src": os.listdir("src") if os.path.isdir("src") else "src/ not found",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

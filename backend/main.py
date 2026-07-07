"""FastAPI application entry point for the Clinical Evidence Synthesizer."""

import os
import sys
import traceback
import shutil
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

# ---------------------------------------------------------------------------
# Try to import all modules and log any errors
# ---------------------------------------------------------------------------
import_errors = {}

try:
    from src.agent import run_agent
except Exception as e:
    import_errors["agent"] = f"{type(e).__name__}: {str(e)}"

try:
    from src.document_processor import load_and_chunk_pdf
except Exception as e:
    import_errors["document_processor"] = f"{type(e).__name__}: {str(e)}"

try:
    from src.models import (
        CompareRequest, CompareResponse, DocumentInfo,
        QueryRequest, QueryResponse, SourceCitation, UploadResponse,
    )
except Exception as e:
    import_errors["models"] = f"{type(e).__name__}: {str(e)}"

try:
    from src.vector_store import (
        add_documents, delete_document, list_documents, search,
    )
except Exception as e:
    import_errors["vector_store"] = f"{type(e).__name__}: {str(e)}"

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="Clinical Evidence Synthesizer API", version="1.0.0")

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temp storage
STORAGE_BASE = os.getenv("STORAGE_DIR", "/tmp")
DATA_DIR = os.path.join(STORAGE_BASE, "clinical-data")
os.makedirs(DATA_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Global exception handler — catches everything
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": f"{type(exc).__name__}: {str(exc)}",
            "traceback": traceback.format_exc(),
            "import_errors": import_errors,
        },
    )


# ---------------------------------------------------------------------------
# Startup event — checks Pinecone connectivity
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    import_errors["overall"] = "app started"
    # Check Pinecone connectivity if vector_store loaded
    if "vector_store" not in import_errors:
        try:
            from src.vector_store import _get_or_create_index
            idx = _get_or_create_index()
            stats = idx.describe_index_stats()
            import_errors["pinecone"] = f"connected, vectors={stats['total_vector_count']}"
        except Exception as e:
            import_errors["pinecone"] = f"connection failed: {type(e).__name__}: {str(e)}"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health_check():
    """Health check — also reports import status."""
    return {
        "status": "healthy" if not import_errors else "degraded",
        "import_errors": import_errors,
    }


@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if "vector_store" in import_errors:
        raise HTTPException(503, detail=f"Vector store unavailable: {import_errors['vector_store']}")
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, detail="Only PDF files are accepted.")
    file_path = os.path.join(DATA_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(500, detail=f"Failed to save file: {str(e)}")
    try:
        chunks = load_and_chunk_pdf(file_path, file.filename)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(500, detail=f"Failed to process PDF: {str(e)}")
    try:
        add_documents(chunks)
    except Exception as e:
        raise HTTPException(500, detail=f"Failed to index document: {str(e)}")
    return {"status": "success", "filename": file.filename, "chunks": len(chunks)}


@app.post("/api/query")
async def query_evidence(request: Request):
    body = await request.json()
    query = body.get("query", "")
    if "agent" in import_errors:
        raise HTTPException(503, detail=f"Agent unavailable: {import_errors['agent']}")
    try:
        answer = await run_agent(query)
        sources = []
        evidence_chunks = search(query, k=5)
        for chunk in evidence_chunks:
            source = chunk.metadata.get("source", "Unknown")
            page = chunk.metadata.get("page", 0)
            content = chunk.page_content.strip()
            if not any(s.document == source and s.page == page for s in sources):
                from src.models import SourceCitation as SC
                sources.append(SC(document=source, page=page or 0, content=content[:300]))
        return {"answer": answer, "sources": [s.model_dump() for s in sources]}
    except Exception as e:
        raise HTTPException(500, detail=f"Query failed: {type(e).__name__}: {str(e)}")


@app.get("/api/documents")
async def get_documents():
    docs = list_documents()
    return docs


@app.delete("/api/documents/{filename}")
async def remove_document(filename: str):
    delete_document(filename)
    file_path = os.path.join(DATA_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    return {"status": "deleted", "filename": filename}


@app.post("/api/query/compare")
async def compare_drugs(request: Request):
    body = await request.json()
    drug_a, drug_b = body.get("drug_a", ""), body.get("drug_b", "")
    try:
        query = f"Compare the clinical outcomes of {drug_a} vs {drug_b}."
        answer = await run_agent(query)
        sources = []
        for drug in [drug_a, drug_b]:
            evidence_chunks = search(f"{drug} efficacy outcomes safety", k=3)
            for chunk in evidence_chunks:
                source = chunk.metadata.get("source", "Unknown")
                page = chunk.metadata.get("page", 0)
                content = chunk.page_content.strip()
                if not any(s.document == source and s.page == page for s in sources):
                    from src.models import SourceCitation as SC
                    sources.append(SC(document=source, page=page or 0, content=content[:300]))
        return {
            "drug_a": drug_a,
            "drug_b": drug_b,
            "comparison": answer,
            "sources": [s.model_dump() for s in sources],
        }
    except Exception as e:
        raise HTTPException(500, detail=f"Comparison failed: {type(e).__name__}: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

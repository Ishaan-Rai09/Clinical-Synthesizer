"""FastAPI application entry point for the Clinical Evidence Synthesizer.

Provides REST endpoints for uploading PDFs, querying evidence,
comparing drugs, listing documents, and deleting documents.
"""

import os
import re
import shutil
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.agent import run_agent
from src.document_processor import load_and_chunk_pdf
from src.models import (
    CompareRequest,
    CompareResponse,
    DocumentInfo,
    QueryRequest,
    QueryResponse,
    SourceCitation,
    UploadResponse,
)
from src.vector_store import (
    add_documents,
    delete_document,
    list_documents,
    search,
)

load_dotenv()

app = FastAPI(
    title="Clinical Evidence Synthesizer API",
    description="REST API for uploading clinical trial PDFs and answering comparative clinical questions using RAG.",
    version="1.0.0",
)

# ─── Security: CORS ───
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Security: File upload limits ───
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", "50")) * 1024 * 1024  # default 50MB

# ─── Security: Safe filename pattern (case-insensitive extension) ───
SAFE_FILENAME_RE = re.compile(r"^[a-zA-Z0-9_\-.\(\) ]+\.pdf$", re.IGNORECASE)

# ─── Security: Global exception handler to prevent stack trace leaks ───
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )


# Ensure tiktoken has a writable cache dir (required on Vercel serverless)
os.environ.setdefault("TIKTOKEN_CACHE_DIR", "/tmp")

# Temporary directory for uploaded PDFs
# On Vercel serverless, only /tmp is writable
STORAGE_BASE = os.getenv("STORAGE_DIR", "/tmp").strip()
DATA_DIR = os.path.join(STORAGE_BASE, "clinical-data")
os.makedirs(DATA_DIR, exist_ok=True)


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    # ─── Check filename exists ───
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")

    # ─── Security: Validate filename (prevent path traversal) ───
    if not SAFE_FILENAME_RE.match(file.filename):
        raise HTTPException(
            status_code=400,
            detail="Invalid filename. Only PDF files with alphanumeric names are accepted.",
        )

    # ─── Security: Validate file size ───
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum size of {MAX_UPLOAD_SIZE // (1024*1024)}MB.",
        )

    # ─── Security: Validate PDF magic bytes ───
    if not contents.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="File is not a valid PDF.")

    file_path = os.path.join(DATA_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save file.")

    try:
        chunks = load_and_chunk_pdf(file_path, file.filename)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail="Failed to process PDF.")

    try:
        add_documents(chunks)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail="Failed to index document.")

    return UploadResponse(status="success", filename=file.filename, chunks=len(chunks))


@app.post("/api/query", response_model=QueryResponse)
async def query_evidence(request: QueryRequest):
    try:
        answer = await run_agent(request.query)
        sources = []
        evidence_chunks = search(request.query, k=5)
        for chunk in evidence_chunks:
            source = chunk.metadata.get("source", "Unknown")
            page = chunk.metadata.get("page", 0)
            content = chunk.page_content.strip()
            if not any(s.document == source and s.page == page for s in sources):
                sources.append(
                    SourceCitation(document=source, page=page or 0, content=content[:300])
                )
        return QueryResponse(answer=answer, sources=sources)
    except Exception:
        raise HTTPException(status_code=500, detail="Query processing failed.")


@app.get("/api/documents", response_model=List[DocumentInfo])
async def get_documents():
    docs = list_documents()
    return [DocumentInfo(**doc) for doc in docs]


@app.delete("/api/documents/{filename}")
async def remove_document(filename: str):
    # ─── Security: Validate filename (prevent path traversal) ───
    if not SAFE_FILENAME_RE.match(filename):
        raise HTTPException(status_code=400, detail="Invalid filename.")

    delete_document(filename)
    file_path = os.path.join(DATA_DIR, filename)
    # ─── Security: Ensure file is within DATA_DIR ───
    if os.path.realpath(file_path).startswith(os.path.realpath(DATA_DIR)):
        if os.path.exists(file_path):
            os.remove(file_path)
    return {"status": "deleted", "filename": filename}


@app.post("/api/query/compare", response_model=CompareResponse)
async def compare_drugs(request: CompareRequest):
    try:
        query = f"Compare the clinical outcomes of {request.drug_a} vs {request.drug_b}."
        answer = await run_agent(query)
        sources = []
        for drug in [request.drug_a, request.drug_b]:
            evidence_chunks = search(f"{drug} efficacy outcomes safety", k=3)
            for chunk in evidence_chunks:
                source = chunk.metadata.get("source", "Unknown")
                page = chunk.metadata.get("page", 0)
                content = chunk.page_content.strip()
                if not any(s.document == source and s.page == page for s in sources):
                    sources.append(
                        SourceCitation(document=source, page=page or 0, content=content[:300])
                    )
        return CompareResponse(
            drug_a=request.drug_a,
            drug_b=request.drug_b,
            comparison=answer,
            sources=sources,
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Comparison failed.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

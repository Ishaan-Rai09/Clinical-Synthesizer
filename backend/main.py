"""FastAPI application entry point for the Clinical Evidence Synthesizer.

Provides REST endpoints for uploading PDFs, querying evidence,
comparing drugs, listing documents, and deleting documents.
"""

import os
import shutil
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

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

# CORS configuration for Next.js frontend
# In production, set CORS_ORIGINS env var to comma-separated list of allowed origins
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary directory for uploaded PDFs
# On Vercel serverless, only /tmp is writable — set STORAGE_DIR=/tmp in env
# Local dev: defaults to /tmp/clinical-data/
STORAGE_BASE = os.getenv("STORAGE_DIR", "/tmp")
DATA_DIR = os.path.join(STORAGE_BASE, "clinical-data")
os.makedirs(DATA_DIR, exist_ok=True)

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/api/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """Upload a PDF file, process it, and index it in the vector store.

    Args:
        file: The PDF file to upload (multipart form data).

    Returns:
        UploadResponse with status, filename, and chunk count.
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted.",
        )

    # Save the uploaded file
    file_path = os.path.join(DATA_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}",
        )

    # Process the PDF into chunks
    try:
        chunks = load_and_chunk_pdf(file_path, file.filename)
    except Exception as e:
        # Clean up the saved file on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process PDF: {str(e)}",
        )

    # Index the chunks in the vector store
    try:
        add_documents(chunks)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to index document: {str(e)}",
        )

    return UploadResponse(
        status="success",
        filename=file.filename,
        chunks=len(chunks),
    )


@app.post("/api/query", response_model=QueryResponse)
async def query_evidence(request: QueryRequest):
    """Ask a clinical question and get an evidence-based answer.

    The query is processed by the LangChain agent, which uses the
    available tools to search the vector database and synthesize an answer.

    Args:
        request: QueryRequest with the clinical question.

    Returns:
        QueryResponse with the answer and source citations.
    """
    try:
        # Run the agent via the async convenience wrapper
        answer = await run_agent(request.query)

        # Extract source citations from the vector store for the response
        sources = []
        evidence_chunks = search(request.query, k=5)
        for chunk in evidence_chunks:
            source = chunk.metadata.get("source", "Unknown")
            page = chunk.metadata.get("page", 0)
            content = chunk.page_content.strip()
            if not any(
                s.document == source and s.page == page for s in sources
            ):
                sources.append(
                    SourceCitation(
                        document=source,
                        page=page or 0,
                        content=content[:300],
                    )
                )

        return QueryResponse(answer=answer, sources=sources)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Query processing failed: {str(e)}",
        )


@app.get("/api/documents", response_model=List[DocumentInfo])
async def get_documents():
    """List all indexed documents with their chunk counts.

    Returns:
        List of DocumentInfo with filename and chunk count.
    """
    docs = list_documents()
    return [DocumentInfo(**doc) for doc in docs]


@app.delete("/api/documents/{filename}")
async def remove_document(filename: str):
    """Remove a document and its chunks from the index.

    Args:
        filename: The filename of the document to remove.

    Returns:
        Status message confirming deletion.
    """
    # Remove from vector store (rebuilds FAISS index from remaining PDFs)
    delete_document(filename)

    # Remove the physical file
    file_path = os.path.join(DATA_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    return {"status": "deleted", "filename": filename}


@app.post("/api/query/compare", response_model=CompareResponse)
async def compare_drugs(request: CompareRequest):
    """Compare clinical outcomes between two drugs.

    Uses the compare_drug_outcomes tool specifically to retrieve
    evidence for both drugs and return a structured comparison.

    Args:
        request: CompareRequest with drug_a and drug_b names.

    Returns:
        CompareResponse with the comparison text and sources.
    """
    try:
        query = f"Compare the clinical outcomes of {request.drug_a} vs {request.drug_b}."
        answer = await run_agent(query)

        # Gather sources for both drugs
        sources = []
        for drug in [request.drug_a, request.drug_b]:
            evidence_chunks = search(f"{drug} efficacy outcomes safety", k=3)
            for chunk in evidence_chunks:
                source = chunk.metadata.get("source", "Unknown")
                page = chunk.metadata.get("page", 0)
                content = chunk.page_content.strip()
                if not any(
                    s.document == source and s.page == page for s in sources
                ):
                    sources.append(
                        SourceCitation(
                            document=source,
                            page=page or 0,
                            content=content[:300],
                        )
                    )

        return CompareResponse(
            drug_a=request.drug_a,
            drug_b=request.drug_b,
            comparison=answer,
            sources=sources,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Comparison failed: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

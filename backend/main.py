"""Minimal FastAPI app for debugging Vercel deployment."""

import os
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(title="Clinical Evidence Synthesizer API", version="1.0.0")


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "env": {
            "STORAGE_DIR": os.getenv("STORAGE_DIR"),
            "PINECONE_API_KEY": "set" if os.getenv("PINECONE_API_KEY") else "missing",
            "CORS_ORIGINS": os.getenv("CORS_ORIGINS"),
        },
    }


@app.get("/api/debug")
async def debug():
    import sys
    python_path = sys.path
    return {"python_path": python_path, "cwd": os.getcwd(), "files": os.listdir(".")}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

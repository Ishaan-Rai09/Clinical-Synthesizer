# Clinical Evidence Synthesizer

An AI-powered tool for HEOR (Health Economics and Outcomes Research) researchers to upload clinical trial PDFs, automatically chunk and embed them, then ask complex comparative clinical questions answered by an AI Agent using RAG (Retrieval-Augmented Generation) with citations.

## Architecture

```
clinical-synthesizer/
├── backend/               # Python FastAPI server (port 8000)
│   ├── main.py           # FastAPI app entry point with REST endpoints
│   ├── requirements.txt  # Python dependencies
│   ├── .env              # OpenAI API key
│   ├── data/             # Uploaded PDFs stored here
│   ├── vector_store/     # FAISS index saved here
│   └── src/
│       ├── __init__.py
│       ├── document_processor.py  # PDF loading + chunking (PyMuPDF)
│       ├── vector_store.py        # FAISS create/load/search
│       ├── tools.py               # Custom LangChain tools
│       ├── agent.py               # LangChain Agent setup + prompts
│       └── models.py              # Pydantic request/response models
├── frontend/              # Next.js 14+ App Router (port 3000)
│   ├── app/              # Pages and layout
│   ├── components/       # React components
│   └── lib/             # API service layer
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python FastAPI (port 8000) |
| Frontend | Next.js 14+, TypeScript, Tailwind CSS |
| Vector DB | FAISS (local, saved to disk) |
| LLM Framework | LangChain |
| Embeddings | OpenAIEmbeddings (text-embedding-ada-002) |
| LLM | OpenAI GPT-4o-mini |
| PDF Parsing | PyMuPDF (fitz) via LangChain PyMuPDFLoader |

## Prerequisites

- Python 3.10+
- Node.js 18+
- An OpenAI API key with access to GPT-4o-mini and text-embedding-ada-002

## Setup & Installation

### 1. Backend Setup

```bash
cd clinical-synthesizer/backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set your OpenAI API key
# Edit .env and replace "your_key_here" with your actual API key
```

### 2. Frontend Setup

```bash
cd clinical-synthesizer/frontend
npm install
```

### 3. Start the Application

**Terminal 1 — Backend:**
```bash
cd clinical-synthesizer/backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd clinical-synthesizer/frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/upload` | Upload a PDF (multipart form) |
| `POST` | `/api/query` | Ask a clinical question (JSON) |
| `GET` | `/api/documents` | List all indexed documents |
| `DELETE` | `/api/documents/{filename}` | Delete a document and re-index |
| `POST` | `/api/query/compare` | Compare two drugs (JSON) |

### Example API Usage

```bash
# Upload a PDF
curl -X POST http://localhost:8000/api/upload \
  -F "file=@clinical_trial.pdf"

# Ask a question
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the primary efficacy outcomes?"}'

# Compare two drugs
curl -X POST http://localhost:8000/api/query/compare \
  -H "Content-Type: application/json" \
  -d '{"drug_a": "Drug X", "drug_b": "Drug Y"}'
```

## Key Features

- **Drag-and-drop PDF upload** with progress indicator
- **Automatic PDF chunking** (1000 chars with 200 char overlap)
- **FAISS vector indexing** with OpenAI embeddings
- **AI agent answers** using only uploaded evidence (no hallucination)
- **Source citations** with document name and page number for every claim
- **Drug comparison** — asks "Compare Drug A vs Drug B"
- **Document management** — view and delete indexed documents
- **Professional medical theme** with dark mode support
- **Mobile responsive** layout

## Agent Behavior

The LangChain agent follows these strict rules:
1. Answers **only** using information from uploaded documents
2. Cites source document name and page number for every factual claim
3. Says "Evidence not found" if the answer isn't in the documents
4. Never hallucinates drug names, dosages, or outcomes
5. Uses the `compare_drug_outcomes` tool for comparison queries
6. Formats answers with clear sections and bullet points

## Data Flow

1. **Upload**: PDF → PyMuPDFLoader → RecursiveCharacterTextSplitter → OpenAI Embeddings → FAISS index
2. **Query**: User question → LangChain Agent → Tool calls (vector search) → GPT-4o-mini synthesis → Answer + Citations

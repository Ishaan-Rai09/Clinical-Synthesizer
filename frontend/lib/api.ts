/**
 * API service layer for the Clinical Evidence Synthesizer.
 * Handles all communication with the FastAPI backend.
 */

// Use NEXT_PUBLIC_API_URL env var in production (Vercel), fallback to localhost for dev
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/+$/, "");

export interface SourceCitation {
  document: string;
  page: number;
  content: string;
}

export interface QueryResponse {
  answer: string;
  sources: SourceCitation[];
}

export interface CompareResponse {
  drug_a: string;
  drug_b: string;
  comparison: string;
  sources: SourceCitation[];
}

export interface DocumentInfo {
  filename: string;
  chunks: number;
}

export interface UploadResponse {
  status: string;
  filename: string;
  chunks: number;
}

/**
 * Upload a PDF file to the backend for processing and indexing.
 */
export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(error.detail || "Upload failed");
  }

  return response.json();
}

/**
 * Send a clinical question to the AI agent and get an evidence-based answer.
 */
export async function queryEvidence(query: string): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Query failed" }));
    throw new Error(error.detail || "Query failed");
  }

  return response.json();
}

/**
 * Compare clinical outcomes between two drugs.
 */
export async function compareDrugs(
  drugA: string,
  drugB: string
): Promise<CompareResponse> {
  const response = await fetch(`${API_BASE}/query/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drug_a: drugA, drug_b: drugB }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Comparison failed" }));
    throw new Error(error.detail || "Comparison failed");
  }

  return response.json();
}

/**
 * Get the list of all indexed documents.
 */
export async function getDocuments(): Promise<DocumentInfo[]> {
  const response = await fetch(`${API_BASE}/documents`);

  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }

  return response.json();
}

/**
 * Delete a document and remove it from the index.
 */
export async function deleteDocument(filename: string): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete document");
  }
}

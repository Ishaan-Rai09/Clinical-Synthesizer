"""Custom LangChain tools for the Clinical Evidence Synthesizer agent.

These tools enable the agent to search the vector database for evidence,
compare drug outcomes, and list available documents.
"""

from typing import Optional
from langchain_core.tools import tool

from src.vector_store import search, list_documents


@tool
def search_evidence(query: str) -> str:
    """Search the clinical evidence database for relevant information.

    Use this tool when you need to find evidence about a specific drug,
    treatment, outcome, or clinical question from the uploaded PDF documents.

    Args:
        query: The clinical question or search term to look up in the evidence database.

    Returns:
        Formatted text with document name, page number, and content excerpt
        for each relevant evidence chunk found.
    """
    results = search(query, k=5)
    if not results:
        return "No evidence found matching your query in the uploaded documents."

    formatted = []
    for i, doc in enumerate(results, 1):
        source = doc.metadata.get("source", "Unknown document")
        page = doc.metadata.get("page", 0)
        content = doc.page_content.strip()
        formatted.append(
            f"[{i}] Source: {source} (Page {page})\n"
            f"Content: {content}\n"
        )
    return "\n---\n".join(formatted)


@tool
def compare_drug_outcomes(drug_a: str, drug_b: str) -> str:
    """Compare clinical outcomes between two drugs using available evidence.

    Use this tool when the query asks to compare two drugs, treatments,
    or interventions. It searches the evidence database for information
    on both drugs and returns a structured comparison.

    Args:
        drug_a: Name of the first drug or treatment.
        drug_b: Name of the second drug or treatment.

    Returns:
        Structured comparison with evidence for each drug, highlighting
        differences in efficacy, safety, and outcomes where available.
    """
    # Search for evidence on both drugs
    results_a = search(f"{drug_a} efficacy outcomes safety", k=3)
    results_b = search(f"{drug_b} efficacy outcomes safety", k=3)

    comparison_parts = [f"=== COMPARISON: {drug_a} vs {drug_b} ===\n"]

    comparison_parts.append(f"\n--- {drug_a} ---")
    if results_a:
        for i, doc in enumerate(results_a, 1):
            source = doc.metadata.get("source", "Unknown")
            page = doc.metadata.get("page", 0)
            comparison_parts.append(
                f"\n[{i}] Source: {source} (Page {page})\n"
                f"{doc.page_content.strip()}"
            )
    else:
        comparison_parts.append(f"\nNo evidence found for {drug_a}.")

    comparison_parts.append(f"\n\n--- {drug_b} ---")
    if results_b:
        for i, doc in enumerate(results_b, 1):
            source = doc.metadata.get("source", "Unknown")
            page = doc.metadata.get("page", 0)
            comparison_parts.append(
                f"\n[{i}] Source: {source} (Page {page})\n"
                f"{doc.page_content.strip()}"
            )
    else:
        comparison_parts.append(f"\nNo evidence found for {drug_b}.")

    return "\n".join(comparison_parts)


@tool
def list_available_evidence() -> str:
    """List all indexed documents with their chunk counts.

    Use this tool when you need to know what documents are available
    in the evidence database, or to verify that specific PDFs have
    been uploaded and indexed.

    Returns:
        A formatted list of all indexed PDF filenames and their
        respective chunk counts.
    """
    docs = list_documents()
    if not docs:
        return "No documents have been uploaded yet."

    lines = ["=== Available Evidence Documents ==="]
    for doc in docs:
        lines.append(f"- {doc['filename']}: {doc['chunks']} chunks")
    lines.append(f"\nTotal documents: {len(docs)}")
    return "\n".join(lines)

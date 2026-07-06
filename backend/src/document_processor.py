"""Document processor for loading PDFs and splitting them into chunks.

Uses PyMuPDFLoader from LangChain for robust PDF parsing and
RecursiveCharacterTextSplitter for intelligent text chunking.
"""

import os
from typing import List

from langchain_community.document_loaders import PyMuPDFLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


def load_and_chunk_pdf(file_path: str, filename: str) -> List[Document]:
    """Load a PDF file and split it into overlapping chunks.

    Args:
        file_path: Absolute path to the PDF file on disk.
        filename: Original filename to store in document metadata.

    Returns:
        List of Document objects, each containing:
            - page_content: The chunked text
            - metadata: {"source": filename, "page": page_number}
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found at: {file_path}")

    # Load the PDF using PyMuPDFLoader
    loader = PyMuPDFLoader(file_path)
    documents = loader.load()

    # Attach the original filename to metadata (loader sets source to path by default)
    for doc in documents:
        doc.metadata["source"] = filename

    # Split documents into overlapping chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        is_separator_regex=False,
    )
    chunks = text_splitter.split_documents(documents)

    return chunks

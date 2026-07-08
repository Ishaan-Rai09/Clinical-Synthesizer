"""Document processor for loading PDFs and splitting them into chunks.

Uses PyPDFLoader from LangChain for pure-Python PDF parsing (avoids
native C extension issues on serverless platforms like Vercel).

RecursiveCharacterTextSplitter handles intelligent text chunking.
"""

import os
from typing import List

from langchain_community.document_loaders import PyPDFLoader
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

    # Load the PDF using pure-Python PyPDFLoader
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    # Attach the original filename to metadata (loader sets source to path by default)
    for doc in documents:
        doc.metadata["source"] = filename

    # Split documents into overlapping chunks
    # chunk_size=2000 reduces number of API calls (fewer chunks to embed)
    # which helps avoid Vercel's 10s serverless timeout
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=300,
        length_function=len,
        is_separator_regex=False,
    )
    chunks = text_splitter.split_documents(documents)

    return chunks

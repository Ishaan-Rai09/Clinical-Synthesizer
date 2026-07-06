"""Custom embeddings for NVIDIA's OpenAI-compatible API.

LangChain's OpenAIEmbeddings tokenizes text into token IDs before sending
to the API, which works with OpenAI's API (which accepts token IDs) but
fails with NVIDIA's API (which requires raw strings). This custom
embeddings class sends raw text strings directly.
"""

import os
from typing import List

from langchain_core.embeddings import Embeddings
from openai import OpenAI


class NVIDIAEmbeddings(Embeddings):
    """Custom embeddings class for NVIDIA's OpenAI-compatible API endpoint.

    Uses the openai Python client under the hood but sends raw text strings
    instead of token IDs.
    """

    def __init__(
        self,
        model: str = "nvidia/nv-embed-v1",
        api_key: str | None = None,
        base_url: str | None = None,
    ):
        self.model = model
        api_key = api_key or os.getenv("OPENAI_API_KEY")
        base_url = base_url or os.getenv("OPENAI_API_BASE", "https://integrate.api.nvidia.com/v1")

        self.client = OpenAI(api_key=api_key, base_url=base_url)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of document texts.

        Args:
            texts: List of text strings to embed.

        Returns:
            List of embedding vectors, one per input text.
        """
        # NVIDIA's nv-embed-v1 expects input_type parameter for optimal results
        response = self.client.embeddings.create(
            model=self.model,
            input=texts,
            extra_body={"input_type": "passage"},
        )
        return [item.embedding for item in response.data]

    def embed_query(self, text: str) -> List[float]:
        """Embed a single query text.

        Args:
            text: The query text to embed.

        Returns:
            A single embedding vector.
        """
        response = self.client.embeddings.create(
            model=self.model,
            input=text,
            extra_body={"input_type": "query"},
        )
        return response.data[0].embedding

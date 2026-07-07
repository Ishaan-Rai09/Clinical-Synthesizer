"""LangChain Agent setup for the Clinical Evidence Synthesizer.

Configures a tool-calling agent with GPT-4o-mini that answers clinical
questions strictly from uploaded evidence documents.

Uses the LangChain 1.3.x graph-based agent API (create_agent).
"""

import functools
import os

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI

from src.tools import search_evidence, compare_drug_outcomes, list_available_evidence

# Define the tools available to the agent
TOOLS = [search_evidence, compare_drug_outcomes, list_available_evidence]

# System prompt with strict rules for evidence-based answers
SYSTEM_PROMPT = """You are a clinical evidence research assistant helping with systematic literature review and evidence synthesis.

## STRICT RULES:
1. ONLY answer using information retrieved from the uploaded documents via your tools.
2. You MUST cite the source document name and page number for every factual claim.
3. If the user asks a vague question like "tell me more", "give me info", or "i don't know what to ask", search the documents broadly and return a comprehensive summary of ALL available evidence.
4. Never hallucinate drug names, dosages, or outcomes.
5. For comparison queries, use the compare_drug_outcomes tool.
6. Format answers with clear sections and bullet points.
7. Always start by searching for relevant evidence — do NOT ask the user for clarification unless there are truly no documents uploaded.
8. When citing sources, format them as: [Source: DocumentName.pdf, Page X]
9. Provide balanced answers — if there are conflicting findings in the evidence, present both sides.
10. Use professional medical/scientific language appropriate for HEOR researchers."""


@functools.lru_cache(maxsize=1)
def _get_llm() -> ChatOpenAI:
    """Get a cached ChatOpenAI instance.

    Reads OPENAI_API_BASE and OPENAI_MODEL from environment lazily
    so they are picked up after load_dotenv() has been called.
    """
    base_url = os.getenv("OPENAI_API_BASE")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    kwargs = {
        "model": model,
        "temperature": 0,
    }
    if base_url:
        kwargs["base_url"] = base_url
    return ChatOpenAI(**kwargs)


@functools.lru_cache(maxsize=1)
def _get_graph():
    """Build and cache the agent graph.

    Returns a CompiledStateGraph that can be invoked with:
        {"messages": [{"role": "user", "content": query}]}
    """
    return create_agent(
        model=_get_llm(),
        tools=TOOLS,
        system_prompt=SYSTEM_PROMPT,
    )


def get_agent():
    """Return a cached LangChain agent graph ready to accept queries.

    Returns:
        A CompiledStateGraph that accepts:
            {"messages": [{"role": "user", "content": "..."}]}
        and returns results.
    """
    return _get_graph()


async def run_agent(query: str) -> str:
    """Run the agent with a user query and return the final answer text.

    This is a convenience wrapper that handles the graph invocation
    and extracts the final response from the assistant.

    Args:
        query: The user's clinical question.

    Returns:
        The agent's final answer as a string.
    """
    graph = get_agent()
    result = await graph.ainvoke(
        {"messages": [{"role": "user", "content": query}]},
    )

    # The result contains a "messages" list; the last message is the assistant's response
    messages = result.get("messages", [])
    if messages:
        final = messages[-1]
        if hasattr(final, "content"):
            return final.content
    return "No answer generated."

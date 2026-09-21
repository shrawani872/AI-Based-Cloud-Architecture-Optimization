"""
recommendation_engine.py — calls the Gemini API, forces its reply into the
strict Recommendation schema via Gemini's native structured-output support
(response_mime_type="application/json" + response_schema), validates it a
second time with pydantic, and falls back to the rule-based recommender on
ANY failure (missing key, network error, timeout, malformed output).

Docs: https://ai.google.dev/gemini-api/docs/structured-output
"""

import os
import json
import time
import logging

from dotenv import load_dotenv
load_dotenv()  # reads a .env file in the current directory, if present

from schemas import RecommendationInput, Recommendation, LLMRecommendation
from prompts import SYSTEM_PROMPT, build_user_message
from rule_based_fallback import rule_based_recommendation

logger = logging.getLogger("recommendation_engine")

# "gemini-flash-latest" auto-tracks Google's current flash model, so you don't
# need to update this every time a new version ships. Override with the
# GEMINI_MODEL env var if you want to pin a specific version instead.
MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")


def _generate_with_retry(client, contents, config, max_retries: int = 3):
    """Calls generate_content, retrying transient errors with backoff.
    Either returns a response, or raises the exception from the final
    attempt — never returns/raises None, so callers get a clean type."""
    for attempt in range(max_retries):
        try:
            return client.models.generate_content(
                model=MODEL, contents=contents, config=config
            )
        except Exception as e:
            is_last = attempt == max_retries - 1
            transient = any(
                code in str(e) for code in ("503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED")
            )
            if is_last or not transient:
                raise
            wait = 2 ** (attempt + 1)  # 2s, 4s, 8s
            logger.warning("Gemini call failed (%s), retrying in %ds (attempt %d/%d)",
                            e, wait, attempt + 1, max_retries)
            time.sleep(wait)
    # unreachable: the loop above always either returns or raises
    raise RuntimeError("generate_content retry loop exited unexpectedly")


def _call_llm(inp: RecommendationInput) -> Recommendation:
    """Raises on any failure — callers must catch and fall back."""
    from google import genai
    from google.genai import types

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    client = genai.Client(api_key=api_key)

    response = _generate_with_retry(
        client,
        contents=build_user_message(inp),
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            # passing the Pydantic class (not a hand-written schema dict)
            # lets the SDK build Google's Schema format correctly
            response_schema=LLMRecommendation,
            temperature=0.2,
        ),
    )

    # response.parsed is the SDK's own validated LLMRecommendation instance;
    # fall back to manually parsing response.text if a given SDK version
    # doesn't populate .parsed
    parsed = getattr(response, "parsed", None)
    if parsed is not None:
        data = parsed.model_dump()
    else:
        if not response.text:
            raise ValueError("Empty response from Gemini")
        data = json.loads(response.text)

    data["source"] = "llm"
    # second layer of validation: pydantic re-checks the data even though
    # response_schema already constrained it at generation time
    return Recommendation(**data)


def get_recommendation(inp: RecommendationInput, use_llm: bool = True) -> Recommendation:
    """
    Main entry point. Always returns a valid Recommendation — never raises —
    so callers (FastAPI endpoint, batch script) don't need their own
    try/except around this.
    """
    if use_llm:
        try:
            return _call_llm(inp)
        except Exception as e:
            logger.warning("LLM recommendation failed (%s) — using rule-based fallback", e)

    return rule_based_recommendation(inp)


if __name__ == "__main__":
    # quick manual check — run: python recommendation_engine.py
    from schemas import ForecastSignal, AnomalySignal

    demo_input = RecommendationInput(
        resource_id="ec2-demo-1",
        forecast=[ForecastSignal(metric="cpu_utilization", current_value=74.0,
                                  predicted_value=93.0, horizon_minutes=20)],
        anomaly=[AnomalySignal(metric="cpu_utilization", is_anomaly=True,
                                severity="HIGH", score=0.81,
                                reason="usage far outside recent normal range")],
    )
    result = get_recommendation(demo_input, use_llm=True)
    print(result.model_dump_json(indent=2))
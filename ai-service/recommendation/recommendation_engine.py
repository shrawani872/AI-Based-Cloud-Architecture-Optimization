"""
recommendation_engine.py — calls the Gemini API, forces its reply into the
strict Recommendation schema via structured output, validates it with pydantic,
enriches it with AWS cost analysis, and falls back to rule-based logic on any failure.
"""

import os
import json
import time
import logging

from dotenv import load_dotenv

load_dotenv()
_env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(_env_file):
    load_dotenv(_env_file)

from schemas import RecommendationInput, Recommendation, LLMRecommendation, CostSignal
from prompts import SYSTEM_PROMPT, build_user_message
from rule_based_fallback import rule_based_recommendation
from cost_engine import estimate_cost_metrics, compute_scale_action_cost_impact

logger = logging.getLogger("recommendation_engine")

MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")


def _generate_with_retry(client, contents, config, max_retries: int = 3):
    """Calls generate_content, retrying transient errors with backoff."""
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
            wait = 2 ** (attempt + 1)
            logger.warning("Gemini call failed (%s), retrying in %ds (attempt %d/%d)",
                            e, wait, attempt + 1, max_retries)
            time.sleep(wait)
    raise RuntimeError("generate_content retry loop exited unexpectedly")


def _call_llm(inp: RecommendationInput) -> Recommendation:
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
            response_schema=LLMRecommendation,
            temperature=0.2,
        ),
    )

    parsed = getattr(response, "parsed", None)
    if parsed is not None:
        data = parsed.model_dump()
    else:
        if not response.text:
            raise ValueError("Empty response from Gemini")
        data = json.loads(response.text)

    data["source"] = "llm"

    # Attach cost signal if present or compute it
    current_cpu = 50.0
    pred_cpu = 50.0
    for f in inp.forecast:
        if "cpu" in f.metric.lower() or f.metric == "value":
            current_cpu = f.current_value
            pred_cpu = f.predicted_value
            break

    if inp.cost:
        data["cost_estimate"] = inp.cost.model_dump()
    else:
        raw_cost = estimate_cost_metrics(
            resource_id=inp.resource_id,
            current_utilization=current_cpu,
            predicted_utilization=pred_cpu,
            instance_type=inp.instance_type,
        )
        data["cost_estimate"] = CostSignal(
            instance_type=raw_cost.instance_type,
            hourly_rate_usd=raw_cost.hourly_rate_usd,
            current_daily_cost_usd=raw_cost.current_daily_cost_usd,
            idle_waste_daily_cost_usd=raw_cost.idle_waste_daily_cost_usd,
            projected_monthly_cost_usd=raw_cost.projected_monthly_cost_usd,
            estimated_daily_savings_usd=raw_cost.estimated_daily_savings_usd,
            estimated_monthly_savings_usd=raw_cost.estimated_monthly_savings_usd,
            recommended_instance_type=raw_cost.recommended_instance_type,
            cost_status=raw_cost.cost_status,
        ).model_dump()

    # If LLM omitted impact strings, populate from cost engine
    if not data.get("expected_cost_impact") or not data.get("expected_reliability_impact"):
        impacts = compute_scale_action_cost_impact(
            resource_id=inp.resource_id,
            recommendation_type=data.get("recommendation_type", "NO_ACTION"),
            current_utilization=current_cpu,
            predicted_utilization=pred_cpu,
            instance_type=inp.instance_type,
        )
        if not data.get("expected_cost_impact"):
            data["expected_cost_impact"] = impacts.get("expected_cost_impact")
        if not data.get("expected_reliability_impact"):
            data["expected_reliability_impact"] = impacts.get("expected_reliability_impact")

    return Recommendation(**data)


def get_recommendation(inp: RecommendationInput, use_llm: bool = True) -> Recommendation:
    """
    Main recommendation engine entry point. Always returns a valid, schema-compliant
    Recommendation with cost estimations and reliability impacts.
    """
    if use_llm:
        try:
            return _call_llm(inp)
        except Exception as e:
            logger.warning("LLM recommendation failed (%s) — using rule-based fallback", e)

    return rule_based_recommendation(inp)


if __name__ == "__main__":
    from schemas import ForecastSignal, AnomalySignal

    demo_input = RecommendationInput(
        resource_id="ec2-demo-1",
        instance_type="m5.2xlarge",
        forecast=[ForecastSignal(metric="cpu_utilization", current_value=12.0,
                                  predicted_value=15.0, horizon_minutes=20)],
        anomaly=[AnomalySignal(metric="cpu_utilization", is_anomaly=False,
                                severity="INFO", score=0.15,
                                reason="well within learned baseline")],
    )
    result = get_recommendation(demo_input, use_llm=False)
    print(result.model_dump_json(indent=2))
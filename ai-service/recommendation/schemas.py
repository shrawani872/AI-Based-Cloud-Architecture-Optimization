"""
schemas.py — data contracts for the recommendation engine.

These are the same models the FastAPI service will use later, so
building them now means Step 6 (FastAPI) becomes almost free.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field

RecommendationType = Literal[
    "SCALE_OUT", "SCALE_IN", "INVESTIGATE", "MONITOR", "NO_ACTION"
]
Severity = Literal["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]


class ForecastSignal(BaseModel):
    metric: str
    current_value: float
    predicted_value: float
    horizon_minutes: int = 5


class AnomalySignal(BaseModel):
    metric: str
    is_anomaly: bool
    severity: Severity
    score: float
    reason: str


class RecommendationInput(BaseModel):
    """What the forecasting + anomaly modules hand to the recommendation engine."""
    resource_id: str
    forecast: List[ForecastSignal] = Field(default_factory=list)
    anomaly: List[AnomalySignal] = Field(default_factory=list)


class Recommendation(BaseModel):
    """The engine's output — this is the strict schema the LLM is forced into."""
    recommendation_type: RecommendationType
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str
    evidence: List[str] = Field(default_factory=list)
    expected_reliability_impact: Optional[str] = None
    expected_cost_impact: Optional[str] = None
    source: Literal["llm", "rule_based_fallback"] = "llm"

    class Config:
        extra = "forbid"


class LLMRecommendation(BaseModel):
    """
    Same shape as Recommendation, MINUS the internal "source" field — this
    is what we actually hand to Gemini as response_schema. Passing a
    Pydantic class (instead of a hand-written JSON schema dict) lets the
    google-genai SDK derive Google's OpenAPI-style Schema correctly,
    including how it represents "this field may be null" — which is what
    a raw {"type": ["string", "null"]} dict gets wrong (Gemini's Schema
    only accepts one type per field, not a JSON-Schema-style type list).
    """
    recommendation_type: RecommendationType
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str
    evidence: List[str] = Field(default_factory=list)
    expected_reliability_impact: Optional[str] = None
    expected_cost_impact: Optional[str] = None
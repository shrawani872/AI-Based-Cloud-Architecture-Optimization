"""
schemas.py — data contracts for the recommendation engine, cost layer, and API.

These models define the contracts for the ML pipelines, cost engine, LLM structured
output, rule-based fallback, and the FastAPI service.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

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


class CostSignal(BaseModel):
    instance_type: str
    hourly_rate_usd: float
    current_daily_cost_usd: float
    idle_waste_daily_cost_usd: float
    projected_monthly_cost_usd: float
    estimated_daily_savings_usd: Optional[float] = None
    estimated_monthly_savings_usd: Optional[float] = None
    recommended_instance_type: Optional[str] = None
    cost_status: Optional[str] = None


class RecommendationInput(BaseModel):
    """What the forecasting, anomaly, and cost modules hand to the recommendation engine."""
    resource_id: str
    instance_type: Optional[str] = None
    forecast: List[ForecastSignal] = Field(default_factory=list)
    anomaly: List[AnomalySignal] = Field(default_factory=list)
    cost: Optional[CostSignal] = None


class Recommendation(BaseModel):
    """The engine's output — strict schema for LLM structured output and fallback."""
    model_config = ConfigDict(extra="ignore")

    recommendation_type: RecommendationType
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str
    evidence: List[str] = Field(default_factory=list)
    expected_reliability_impact: Optional[str] = None
    expected_cost_impact: Optional[str] = None
    cost_estimate: Optional[CostSignal] = None
    source: Literal["llm", "rule_based_fallback"] = "llm"


class LLMRecommendation(BaseModel):
    """
    Schema handed to Gemini structured output as response_schema.
    """
    model_config = ConfigDict(extra="ignore")

    recommendation_type: RecommendationType
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str
    evidence: List[str] = Field(default_factory=list)
    expected_reliability_impact: Optional[str] = None
    expected_cost_impact: Optional[str] = None
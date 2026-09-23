"""
main.py — FastAPI HTTP Service for AI-Based Cloud Architecture Optimization.

Exposes REST endpoints for:
- /health: Service readiness and loaded model resources
- /forecast: Time-series predictive forecasting
- /anomaly: Unsupervised Isolation Forest anomaly detection
- /cost: Real-world AWS EC2/RDS pricing, waste, and rightsizing analysis
- /recommend: Decision engine generating SCALE_OUT, SCALE_IN, INVESTIGATE, MONITOR, NO_ACTION
- /analyze: All-in-one unified telemetry analysis pipeline

Run with:
    uvicorn main:app --reload --port 8000
"""

import os
from typing import List, Literal, Optional, Dict, Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from feature_utils import InsufficientHistoryError
from model_registry import ModelNotFoundError
from cost_engine import CostEstimate
import inference

app = FastAPI(
    title="Cloud Architecture Optimization — AI Service",
    description="Forecasting, anomaly detection, AWS cost optimization, and recommendation "
                "endpoints for the AI-Based Cloud Architecture Optimization project.",
    version="1.2.0",
)


def _resolve_modeldir() -> str:
    if "AI_SERVICE_MODELDIR" in os.environ:
        return os.environ["AI_SERVICE_MODELDIR"]
    candidates = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "models"),
        "models",
        os.path.join("..", "models"),
    ]
    for c in candidates:
        if os.path.isdir(c) and len(os.listdir(c)) > 0:
            return os.path.abspath(c)
    return os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models"))


MODELDIR = _resolve_modeldir()


# ---------------------------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------------------------

class SeriesRequest(BaseModel):
    resource_id: str = Field(..., description="Must match a trained series e.g. 'ec2_cpu_utilization_24ae8d' or 'bitbrains_vm_01'.")
    timestamps: List[str] = Field(..., description="ISO-8601 timestamps, at least 13 points.")
    values: List[float] = Field(..., description="Metric values, matching timestamp count.")
    instance_type: Optional[str] = Field(None, description="Optional AWS instance type override (e.g. 'm5.large').")


class CostRequest(BaseModel):
    resource_id: str = Field(..., description="Resource ID")
    current_utilization: float = Field(..., ge=0.0, le=100.0, description="Current CPU or memory utilization %")
    predicted_utilization: float = Field(..., ge=0.0, le=100.0, description="Predicted peak or horizon utilization %")
    instance_type: Optional[str] = Field(None, description="AWS instance type, e.g. 'm5.2xlarge', 't3.medium'")


class ForecastResponse(BaseModel):
    resource_id: str
    metric: str
    current_value: float
    predicted_value: float
    horizon_minutes: int
    model_id: str


class AnomalyResponse(BaseModel):
    resource_id: str
    metric: str
    is_anomaly: bool
    severity: Literal["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]
    score: float
    reason: str
    model_id: str


class RecommendRequest(BaseModel):
    resource_id: str
    instance_type: Optional[str] = None
    forecast: List[dict] = Field(default_factory=list, description="List of {metric, current_value, predicted_value, horizon_minutes}.")
    anomaly: List[dict] = Field(default_factory=list, description="List of {metric, is_anomaly, severity, score, reason}.")
    cost: Optional[dict] = Field(None, description="Optional precomputed cost breakdown")
    use_llm: bool = True


class AnalyzeRequest(SeriesRequest):
    use_llm: bool = True


class HealthResponse(BaseModel):
    status: str
    available_resource_ids: List[str]
    gemini_api_key_configured: bool
    cost_engine_ready: bool


# ---------------------------------------------------------------------------
# Error Handling Helper
# ---------------------------------------------------------------------------

def _run_or_translate_errors(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except InsufficientHistoryError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ModelNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse)
def health():
    return inference.health_status(MODELDIR, use_llm_configured=bool(os.environ.get("GEMINI_API_KEY")))


@app.post("/forecast", response_model=ForecastResponse)
def forecast(req: SeriesRequest):
    return _run_or_translate_errors(
        inference.run_forecast, req.resource_id, req.timestamps, req.values, MODELDIR
    )


@app.post("/anomaly", response_model=AnomalyResponse)
def anomaly(req: SeriesRequest):
    return _run_or_translate_errors(
        inference.run_anomaly, req.resource_id, req.timestamps, req.values, MODELDIR
    )


@app.post("/cost", response_model=CostEstimate)
def cost(req: CostRequest):
    return inference.run_cost(
        resource_id=req.resource_id,
        current_utilization=req.current_utilization,
        predicted_utilization=req.predicted_utilization,
        instance_type=req.instance_type,
    )


@app.post("/recommend")
def recommend(req: RecommendRequest):
    from schemas import RecommendationInput, ForecastSignal, AnomalySignal, CostSignal

    try:
        cost_sig = CostSignal(**req.cost) if req.cost else None
        rec_input = RecommendationInput(
            resource_id=req.resource_id,
            instance_type=req.instance_type,
            forecast=[ForecastSignal(**f) for f in req.forecast],
            anomaly=[AnomalySignal(**a) for a in req.anomaly],
            cost=cost_sig,
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid recommendation payload: {e}")

    result = inference.run_recommend(rec_input, use_llm=req.use_llm)
    return result.model_dump()


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    result = _run_or_translate_errors(
        inference.run_analyze,
        req.resource_id,
        req.timestamps,
        req.values,
        MODELDIR,
        req.use_llm,
        req.instance_type,
    )
    return result
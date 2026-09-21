"""
main.py — the AI Service's HTTP API. This file is intentionally thin:
all the real logic lives in inference.py (and, beneath that, in
feature_utils.py, model_registry.py, and recommendation/), so this file
is just request/response wiring and HTTP status codes.

Run from inside ai-service/app/:
    uvicorn main:app --reload --port 8000

Then open http://localhost:8000/docs for interactive API docs — that URL
is what you share with your backend teammate as the live API contract.
"""

import os
from typing import List, Literal, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from feature_utils import InsufficientHistoryError
from model_registry import ModelNotFoundError
import inference

app = FastAPI(
    title="Cloud Architecture Optimization — AI Service",
    description="Forecasting, anomaly detection, and recommendation endpoints "
                "for the AI-Based Cloud Architecture Optimization project.",
    version="1.0.0",
)

MODELDIR = os.environ.get("AI_SERVICE_MODELDIR", os.path.join("..", "models"))


# ---------------------------------------------------------------------------
# Request / response schemas for THIS API layer. (RecommendationInput /
# Recommendation for /recommend come from recommendation/schemas.py, via
# inference.py, since that contract already exists and is tested.)
# ---------------------------------------------------------------------------

class SeriesRequest(BaseModel):
    resource_id: str = Field(..., description="Must match a series a model was trained for, e.g. 'ec2_cpu_utilization_24ae8d'.")
    timestamps: List[str] = Field(..., description="ISO-8601 timestamps, any order, at least 13 points.")
    values: List[float] = Field(..., description="Metric values, same length and order as timestamps.")


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
    forecast: List[dict] = Field(default_factory=list, description="List of {metric, current_value, predicted_value, horizon_minutes}.")
    anomaly: List[dict] = Field(default_factory=list, description="List of {metric, is_anomaly, severity, score, reason}.")
    use_llm: bool = True


class AnalyzeRequest(SeriesRequest):
    use_llm: bool = True


class HealthResponse(BaseModel):
    status: str
    available_resource_ids: List[str]
    gemini_api_key_configured: bool


# ---------------------------------------------------------------------------
# Error handling helper — every endpoint below funnels its known error
# types through this so the HTTP status codes stay consistent.
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
# Endpoints
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


@app.post("/recommend")
def recommend(req: RecommendRequest):
    # imported here (not at module top) so a missing recommendation/
    # package only breaks this endpoint, not the whole app, at import time
    from schemas import RecommendationInput, ForecastSignal, AnomalySignal

    try:
        rec_input = RecommendationInput(
            resource_id=req.resource_id,
            forecast=[ForecastSignal(**f) for f in req.forecast],
            anomaly=[AnomalySignal(**a) for a in req.anomaly],
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid forecast/anomaly payload: {e}")

    result = inference.run_recommend(rec_input, use_llm=req.use_llm)
    return result.model_dump()


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    result = _run_or_translate_errors(
        inference.run_analyze, req.resource_id, req.timestamps, req.values, MODELDIR, req.use_llm
    )
    return result
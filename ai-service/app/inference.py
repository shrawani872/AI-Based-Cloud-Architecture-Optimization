"""
inference.py — the actual business logic behind every endpoint, kept
separate from FastAPI itself so it can be tested (and was tested) without
needing the web framework installed. main.py is a thin wrapper around
these functions.
"""

import os
import sys
from typing import List, Optional

from feature_utils import build_feature_row, inferred_horizon_minutes, ANOMALY_FEATURES, FORECAST_FEATURES
from model_registry import get_anomaly_model, get_forecast_model, available_resource_ids

# recommendation/ is a sibling folder of app/, and its files use bare
# imports ("from schemas import ..."), so we add it to sys.path rather
# than requiring it to be restructured as a package.
_RECS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "recommendation")
if _RECS_DIR not in sys.path:
    sys.path.insert(0, _RECS_DIR)

from schemas import RecommendationInput, ForecastSignal, AnomalySignal, Recommendation  # noqa: E402
# pyrefly: ignore [missing-import]
from recommendation_engine import get_recommendation  # noqa: E402


def _metric_name_for(resource_id: str) -> str:
    if "cpu" in resource_id:
        return "cpu_utilization"
    if "network" in resource_id:
        return "network_in"
    if "disk" in resource_id:
        return "disk_write_bytes"
    return "value"


def _severity_from_score(score: float, low_q: float, high_q: float) -> str:
    """Maps an Isolation Forest decision_function score to a severity band.
    Lower score = more anomalous. low_q/high_q come from the TRAIN
    distribution for this specific series."""
    if score > low_q:
        return "INFO"
    elif score > high_q:
        return "LOW"
    elif score > 2 * high_q - low_q:
        return "MEDIUM"
    else:
        return "HIGH"


def run_forecast(resource_id: str, timestamps: List[str], values: List[float], modeldir: str) -> dict:
    row = build_feature_row(timestamps, values)
    model = get_forecast_model(resource_id, modeldir)
    current = float(row["value"].iloc[0])
    predicted_delta = float(model.predict(row[FORECAST_FEATURES])[0])
    predicted = current + predicted_delta
    metric = _metric_name_for(resource_id)
    if "cpu" in metric:
        predicted = max(0.0, min(100.0, predicted))
    else:
        predicted = max(0.0, predicted)
    horizon = inferred_horizon_minutes(timestamps)
    return {
        "resource_id": resource_id,
        "metric": metric,
        "current_value": current,
        "predicted_value": predicted,
        "horizon_minutes": horizon,
        "model_id": f"forecast_{resource_id}",
    }


def run_anomaly(resource_id: str, timestamps: List[str], values: List[float], modeldir: str) -> dict:
    row = build_feature_row(timestamps, values)
    model = get_anomaly_model(resource_id, modeldir)

    is_anom = bool(model.predict(row[ANOMALY_FEATURES])[0] == -1)
    score = float(model.decision_function(row[ANOMALY_FEATURES])[0])

    # NOTE: ideally low_q/high_q would be computed once from the TRAIN
    # split and cached (see run_recommendation.py), not re-derived here.
    # As a self-contained endpoint we approximate with fixed score bands
    # instead of requiring the full training set at request time — this
    # is coarser than the batch script's per-series thresholds and is a
    # reasonable improvement to make later if severity accuracy matters
    # more than endpoint simplicity.
    if not is_anom:
        severity = "INFO"
    elif score > -0.05:
        severity = "LOW"
    elif score > -0.15:
        severity = "MEDIUM"
    else:
        severity = "HIGH"

    return {
        "resource_id": resource_id,
        "metric": _metric_name_for(resource_id),
        "is_anomaly": is_anom,
        "severity": severity,
        "score": score,
        "reason": "isolation forest flagged this point" if is_anom else "within learned normal range",
        "model_id": f"iforest_{resource_id}",
    }


def run_recommend(inp: RecommendationInput, use_llm: bool = True) -> Recommendation:
    return get_recommendation(inp, use_llm=use_llm)


def run_analyze(resource_id: str, timestamps: List[str], values: List[float],
                 modeldir: str, use_llm: bool = True) -> dict:
    forecast = run_forecast(resource_id, timestamps, values, modeldir)
    anomaly = run_anomaly(resource_id, timestamps, values, modeldir)

    rec_input = RecommendationInput(
        resource_id=resource_id,
        forecast=[ForecastSignal(
            metric=forecast["metric"],
            current_value=forecast["current_value"],
            predicted_value=forecast["predicted_value"],
            horizon_minutes=forecast["horizon_minutes"],
        )],
        anomaly=[AnomalySignal(
            metric=anomaly["metric"],
            is_anomaly=anomaly["is_anomaly"],
            severity=anomaly["severity"],
            score=anomaly["score"],
            reason=anomaly["reason"],
        )],
    )
    recommendation = run_recommend(rec_input, use_llm=use_llm)

    return {
        "resource_id": resource_id,
        "forecast": forecast,
        "anomaly": anomaly,
        "recommendation": recommendation.model_dump(),
    }


def health_status(modeldir: str, use_llm_configured: bool) -> dict:
    return {
        "status": "ok",
        "available_resource_ids": available_resource_ids(modeldir),
        "gemini_api_key_configured": use_llm_configured,
    }
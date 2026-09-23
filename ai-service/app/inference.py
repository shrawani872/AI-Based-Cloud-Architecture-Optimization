"""
inference.py — business logic for all AI Service endpoints (forecasting,
anomaly detection, cost estimation, and recommendation generation).
"""

import os
import sys
from typing import List, Optional, Dict, Any

from feature_utils import build_feature_row, inferred_horizon_minutes, ANOMALY_FEATURES, FORECAST_FEATURES
from model_registry import get_anomaly_model, get_forecast_model, available_resource_ids
from cost_engine import estimate_cost_metrics, CostEstimate

# Add recommendation module to sys.path
_RECS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "recommendation")
if _RECS_DIR not in sys.path:
    sys.path.insert(0, _RECS_DIR)

from schemas import RecommendationInput, ForecastSignal, AnomalySignal, Recommendation, CostSignal
from recommendation_engine import get_recommendation


def _metric_name_for(resource_id: str) -> str:
    res_lower = resource_id.lower()
    if "cpu" in res_lower:
        return "cpu_utilization"
    if "network" in res_lower:
        return "network_in"
    if "disk" in res_lower:
        return "disk_write_bytes"
    if "mem" in res_lower:
        return "memory_utilization"
    return "value"


def run_forecast(resource_id: str, timestamps: List[str], values: List[float], modeldir: str) -> dict:
    row = build_feature_row(timestamps, values)
    model = get_forecast_model(resource_id, modeldir)
    current = float(row["value"].iloc[0])
    predicted_delta = float(model.predict(row[FORECAST_FEATURES])[0])
    predicted = current + predicted_delta
    metric = _metric_name_for(resource_id)
    if "cpu" in metric or "mem" in metric:
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
        "reason": "isolation forest flagged abnormal pattern" if is_anom else "within learned normal distribution",
        "model_id": f"iforest_{resource_id}",
    }


def run_cost(resource_id: str, current_utilization: float, predicted_utilization: float,
             instance_type: Optional[str] = None) -> CostEstimate:
    return estimate_cost_metrics(
        resource_id=resource_id,
        current_utilization=current_utilization,
        predicted_utilization=predicted_utilization,
        instance_type=instance_type,
    )


def run_recommend(inp: RecommendationInput, use_llm: bool = True) -> Recommendation:
    return get_recommendation(inp, use_llm=use_llm)


def run_analyze(resource_id: str, timestamps: List[str], values: List[float],
                modeldir: str, use_llm: bool = True, instance_type: Optional[str] = None) -> dict:
    forecast = run_forecast(resource_id, timestamps, values, modeldir)
    anomaly = run_anomaly(resource_id, timestamps, values, modeldir)
    
    # Cost analysis
    cost_obj = run_cost(
        resource_id=resource_id,
        current_utilization=forecast["current_value"],
        predicted_utilization=forecast["predicted_value"],
        instance_type=instance_type,
    )
    
    cost_signal = CostSignal(
        instance_type=cost_obj.instance_type,
        hourly_rate_usd=cost_obj.hourly_rate_usd,
        current_daily_cost_usd=cost_obj.current_daily_cost_usd,
        idle_waste_daily_cost_usd=cost_obj.idle_waste_daily_cost_usd,
        projected_monthly_cost_usd=cost_obj.projected_monthly_cost_usd,
        estimated_daily_savings_usd=cost_obj.estimated_daily_savings_usd,
        estimated_monthly_savings_usd=cost_obj.estimated_monthly_savings_usd,
        recommended_instance_type=cost_obj.recommended_instance_type,
        cost_status=cost_obj.cost_status,
    )

    rec_input = RecommendationInput(
        resource_id=resource_id,
        instance_type=cost_obj.instance_type,
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
        cost=cost_signal,
    )
    recommendation = run_recommend(rec_input, use_llm=use_llm)

    return {
        "resource_id": resource_id,
        "forecast": forecast,
        "anomaly": anomaly,
        "cost": cost_obj.model_dump(),
        "recommendation": recommendation.model_dump(),
    }


def health_status(modeldir: str, use_llm_configured: bool) -> dict:
    return {
        "status": "ok",
        "available_resource_ids": available_resource_ids(modeldir),
        "gemini_api_key_configured": use_llm_configured,
        "cost_engine_ready": True,
    }
"""
rule_based_fallback.py — deterministic recommendation engine with AWS cost awareness.

Executed when the LLM API is unavailable, times out, or when running in local/rule-based
mode. Computes exact dollar savings, reliability impacts, and rightsizing actions based on
AWS pricing models and ML signals.
"""

from typing import Optional
from schemas import RecommendationInput, Recommendation, CostSignal
from cost_engine import estimate_cost_metrics, compute_scale_action_cost_impact

HIGH_SEVERITY = {"HIGH", "CRITICAL"}
LOW_UTIL_THRESHOLD = 25.0
HIGH_UTIL_THRESHOLD = 80.0


def rule_based_recommendation(inp: RecommendationInput) -> Recommendation:
    evidence = []

    # Extract dominant metric values
    current_cpu = 50.0
    predicted_cpu = 50.0
    for f in inp.forecast:
        if "cpu" in f.metric.lower() or f.metric == "value":
            current_cpu = f.current_value
            predicted_cpu = f.predicted_value
            break

    # Derive cost estimate if not already attached
    cost_estimate = inp.cost
    if cost_estimate is None:
        raw_cost = estimate_cost_metrics(
            resource_id=inp.resource_id,
            current_utilization=current_cpu,
            predicted_utilization=predicted_cpu,
            instance_type=inp.instance_type,
        )
        cost_estimate = CostSignal(
            instance_type=raw_cost.instance_type,
            hourly_rate_usd=raw_cost.hourly_rate_usd,
            current_daily_cost_usd=raw_cost.current_daily_cost_usd,
            idle_waste_daily_cost_usd=raw_cost.idle_waste_daily_cost_usd,
            projected_monthly_cost_usd=raw_cost.projected_monthly_cost_usd,
            estimated_daily_savings_usd=raw_cost.estimated_daily_savings_usd,
            estimated_monthly_savings_usd=raw_cost.estimated_monthly_savings_usd,
            recommended_instance_type=raw_cost.recommended_instance_type,
            cost_status=raw_cost.cost_status,
        )

    any_high_anomaly = any(a.severity in HIGH_SEVERITY and a.is_anomaly for a in inp.anomaly)
    any_anomaly = any(a.is_anomaly for a in inp.anomaly)
    rising_toward_saturation = any(
        f.predicted_value >= HIGH_UTIL_THRESHOLD and f.predicted_value > f.current_value
        for f in inp.forecast
    )
    sustained_low = inp.forecast and all(
        f.predicted_value <= LOW_UTIL_THRESHOLD for f in inp.forecast
    )

    for a in inp.anomaly:
        if a.is_anomaly:
            evidence.append(f"{a.metric} anomaly severity={a.severity} (score={a.score:.2f})")
    for f in inp.forecast:
        evidence.append(f"{f.metric} forecast {f.current_value:.1f} -> {f.predicted_value:.1f}")

    if cost_estimate:
        evidence.append(f"Instance {cost_estimate.instance_type} (${cost_estimate.current_daily_cost_usd:.2f}/day, waste: ${cost_estimate.idle_waste_daily_cost_usd:.2f}/day)")

    if any_high_anomaly and rising_toward_saturation:
        rec_type = "SCALE_OUT"
        confidence = 0.85
        reason = "High-severity anomaly coincides with forecast reaching capacity saturation (>80%). Urgent scale-out required to protect reliability."
    elif any_high_anomaly:
        rec_type = "INVESTIGATE"
        confidence = 0.70
        reason = "High-severity anomaly detected without linear saturation trend; diagnostic investigation required."
    elif rising_toward_saturation:
        rec_type = "SCALE_OUT"
        confidence = 0.75
        reason = "Forecast predicts load trending into saturation threshold; proactive capacity expansion recommended."
    elif sustained_low and not any_anomaly:
        rec_type = "SCALE_IN"
        confidence = 0.80
        if cost_estimate.recommended_instance_type and cost_estimate.estimated_daily_savings_usd:
            reason = (
                f"Sustained low utilization (<{LOW_UTIL_THRESHOLD}%) detected with no anomaly. "
                f"Rightsizing to {cost_estimate.recommended_instance_type} reduces waste and saves "
                f"${cost_estimate.estimated_daily_savings_usd:.2f}/day."
            )
        else:
            reason = f"Sustained low utilization (<{LOW_UTIL_THRESHOLD}%) with zero anomalies; scale-in recommended to eliminate idle waste."
    elif any_anomaly:
        rec_type = "MONITOR"
        confidence = 0.55
        reason = "Lower-severity anomaly observed; load is within acceptable operating bounds. Continued monitoring advised."
    else:
        rec_type = "NO_ACTION"
        confidence = 0.65
        reason = "Metrics and cost are well-balanced within normal operating boundaries; no structural action required."

    impacts = compute_scale_action_cost_impact(
        resource_id=inp.resource_id,
        recommendation_type=rec_type,
        current_utilization=current_cpu,
        predicted_utilization=predicted_cpu,
        instance_type=cost_estimate.instance_type if cost_estimate else None,
    )

    return Recommendation(
        recommendation_type=rec_type,
        confidence=confidence,
        reason=reason,
        evidence=evidence or ["no forecast/anomaly signals provided"],
        expected_reliability_impact=impacts.get("expected_reliability_impact"),
        expected_cost_impact=impacts.get("expected_cost_impact"),
        cost_estimate=cost_estimate,
        source="rule_based_fallback",
    )
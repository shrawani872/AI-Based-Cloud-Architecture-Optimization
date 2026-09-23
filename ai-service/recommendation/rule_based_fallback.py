"""
rule_based_fallback.py — a deterministic recommendation used when the LLM
API is unavailable, times out, or returns something that fails validation.

Keeping this as real, sensible logic (not just "return NO_ACTION") matters:
it's what keeps the pipeline useful during an LLM outage, and it's also
what you compare the LLM's recommendations against in your report to show
the LLM adds value beyond simple thresholds.
"""

from schemas import RecommendationInput, Recommendation

HIGH_SEVERITY = {"HIGH", "CRITICAL"}
LOW_UTIL_THRESHOLD = 20.0
HIGH_UTIL_THRESHOLD = 80.0


def rule_based_recommendation(inp: RecommendationInput) -> Recommendation:
    evidence = []

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

    if any_high_anomaly and rising_toward_saturation:
        rec_type, confidence, reason = (
            "SCALE_OUT", 0.8,
            "High-severity anomaly coincides with a forecast approaching saturation.",
        )
    elif any_high_anomaly:
        rec_type, confidence, reason = (
            "INVESTIGATE", 0.65,
            "High-severity anomaly detected without a clear capacity-driven forecast trend.",
        )
    elif rising_toward_saturation:
        rec_type, confidence, reason = (
            "SCALE_OUT", 0.6,
            "Forecast trending toward saturation on at least one metric.",
        )
    elif sustained_low and not any_anomaly:
        rec_type, confidence, reason = (
            "SCALE_IN", 0.55,
            "All forecast metrics remain well below typical utilization with no anomaly.",
        )
    elif any_anomaly:
        rec_type, confidence, reason = (
            "MONITOR", 0.4,
            "A lower-severity anomaly is present; not yet clearly actionable.",
        )
    else:
        rec_type, confidence, reason = (
            "NO_ACTION", 0.5,
            "No anomaly and forecast within normal range.",
        )

    return Recommendation(
        recommendation_type=rec_type,
        confidence=confidence,
        reason=reason,
        evidence=evidence or ["no forecast/anomaly signals provided"],
        expected_reliability_impact=None,
        expected_cost_impact=None,
        source="rule_based_fallback",
    )
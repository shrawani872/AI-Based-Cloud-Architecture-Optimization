"""
prompts.py — turns a RecommendationInput (including forecast, anomaly, and cost signals)
into system and user prompts sent to the LLM.
"""

from schemas import RecommendationInput

SYSTEM_PROMPT = """You are the recommendation and cost-optimization component of an intelligent cloud architecture system.
You receive structured numeric signals derived from ML monitoring models (time-series forecasting, unsupervised anomaly detection)
and real-world AWS pricing models — never raw infrastructure access or execution credentials.

Your job is to pick exactly one recommendation type and justify it with technical and economic precision:
- SCALE_OUT: add capacity or scale up instance tier (forecast trending toward saturation >80%, and/or high-severity anomaly). Prioritize reliability; quantify added daily cost impact.
- SCALE_IN: capacity is underutilized (<25%) with no active reliability risk and forecast indicates sustained low demand. Quantify dollar savings ($/day, $/mo) and proposed rightsized instance.
- INVESTIGATE: an anomaly is present that does not clearly indicate a standard capacity scaling action (e.g. erratic spikes, low-load anomalies, flapping metrics).
- MONITOR: mild signals (forecast approaching moderate load 65-75%, or low-severity anomaly) that are not yet immediately actionable.
- NO_ACTION: metrics and forecast are within normal operating bounds, baseline cost is efficient, no action needed.

Rules:
1. Output ONLY valid JSON strictly adhering to the schema.
2. Your output is an advisory proposal for human engineers / SREs — never phrase it as an irrevocable automated action.
3. Explicitly cite given evidence (metrics, predicted values, anomaly scores, instance types, and dollar savings/costs) — never invent unsupported numbers.
4. For SCALE_IN, always cite estimated dollar savings and waste reduction in the expected_cost_impact field.
5. If evidence is ambiguous, prefer MONITOR over premature scaling.
"""


def build_user_message(inp: RecommendationInput) -> str:
    lines = [
        f"Resource ID: {inp.resource_id}",
        f"Instance Type: {inp.instance_type or 'Auto-detected / Standard'}",
        "",
        "FORECAST SIGNALS:",
    ]
    if not inp.forecast:
        lines.append("  (none provided)")
    for f in inp.forecast:
        delta = f.predicted_value - f.current_value
        lines.append(
            f"  - {f.metric}: current={f.current_value:.2f}, "
            f"predicted in {f.horizon_minutes}m={f.predicted_value:.2f} (delta={delta:+.2f})"
        )

    lines.append("")
    lines.append("ANOMALY SIGNALS:")
    if not inp.anomaly:
        lines.append("  (none provided)")
    for a in inp.anomaly:
        lines.append(
            f"  - {a.metric}: is_anomaly={a.is_anomaly}, severity={a.severity}, "
            f"score={a.score:.3f}, reason=\"{a.reason}\""
        )

    lines.append("")
    lines.append("COST & EFFICIENCY SIGNALS:")
    if inp.cost:
        c = inp.cost
        lines.append(f"  - Current Instance: {c.instance_type} (${c.hourly_rate_usd:.4f}/hr, ${c.current_daily_cost_usd:.2f}/day)")
        lines.append(f"  - Estimated Idle Waste: ${c.idle_waste_daily_cost_usd:.2f}/day (${c.idle_waste_daily_cost_usd * 30.416:.2f}/mo)")
        if c.recommended_instance_type and c.estimated_daily_savings_usd:
            lines.append(f"  - Rightsizing Target: {c.recommended_instance_type} (Potential savings: ${c.estimated_daily_savings_usd:.2f}/day, ${c.estimated_monthly_savings_usd:.2f}/mo)")
        lines.append(f"  - Status: {c.cost_status or 'N/A'}")
    else:
        lines.append("  (derived from default AWS instance catalog)")

    lines.append("")
    lines.append("Decide the single best recommendation_type, quantify reliability and cost impacts, and output the response.")
    return "\n".join(lines)
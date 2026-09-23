"""
prompts.py — turns a RecommendationInput into the system + user prompt
sent to the LLM.
"""

from schemas import RecommendationInput

SYSTEM_PROMPT = """You are the recommendation component of a cloud resource
optimization system. You receive ONLY structured numeric signals derived from
monitoring models (a forecasting model and an anomaly-detection model) — never
raw infrastructure access, credentials, or the ability to execute anything.

Your job is to pick exactly one recommendation type and justify it:
- SCALE_OUT: add capacity now or very soon (forecast trending toward saturation,
  and/or an active reliability-impacting anomaly on a saturation-related metric).
- SCALE_IN: capacity appears underutilized with no reliability risk, and forecast
  shows sustained low usage — an opportunity to reduce cost.
- INVESTIGATE: an anomaly is present but doesn't clearly indicate a capacity
  action (e.g. contradictory signals, or a metric anomaly not explained by load).
- MONITOR: a mild signal exists (e.g. forecast approaching a threshold, or a
  low-severity anomaly) that isn't yet actionable but is worth watching.
- NO_ACTION: metrics and forecast are normal, no anomaly, nothing to do.

Rules:
1. Output ONLY through the emit_recommendation tool. Never output free text
   recommending an action outside that schema.
2. Your output is a proposal for a HUMAN to review — never phrase it as
   something that will happen automatically, and never include shell
   commands, API calls, or executable instructions of any kind.
3. Cite the specific evidence (metric names, values, severities) you were
   given — do not invent numbers you weren't given.
4. If evidence is weak or absent, prefer MONITOR or NO_ACTION over a
   stronger action — false alarms have a cost too.
5. Confidence should reflect how directly the evidence supports the chosen
   action, not how important the situation feels."""


def build_user_message(inp: RecommendationInput) -> str:
    lines = [f"resource_id: {inp.resource_id}", "", "FORECAST SIGNALS:"]
    if not inp.forecast:
        lines.append("  (none provided)")
    for f in inp.forecast:
        delta = f.predicted_value - f.current_value
        lines.append(
            f"  - {f.metric}: current={f.current_value:.2f}, "
            f"predicted in {f.horizon_minutes}min={f.predicted_value:.2f} "
            f"(delta={delta:+.2f})"
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
    lines.append("Decide the single best recommendation_type per the system rules "
                  "and call emit_recommendation.")
    return "\n".join(lines)
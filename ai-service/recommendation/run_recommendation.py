"""
run_recommendation.py — ties your trained forecast + anomaly models (from
train_forecast.py / train_anomaly.py) into the recommendation engine, and
runs a scenario suite so you can report "recommendation coverage".

Usage:
    # rule-based only (no API key needed — use this first)
    python run_recommendation.py --data ../data/nab_prepared.csv --no-llm

    # with the LLM (needs ANTHROPIC_API_KEY set in your environment)
    python run_recommendation.py --data ../data/nab_prepared.csv
"""

import argparse
import os
import time

import joblib
import pandas as pd

from schemas import RecommendationInput, ForecastSignal, AnomalySignal
from recommendation_engine import get_recommendation

# must match the FEATURES lists in train_anomaly.py / train_forecast.py exactly
ANOMALY_FEATURES = [
    "value",
    "roll_mean_1h", "roll_std_1h", "roll_mean_1d", "roll_std_1d",
    "zscore_1h", "zscore_1d",
    "diff_1", "diff_12",
    "lag_1", "lag_2", "lag_3", "lag_6", "lag_12",
    "hour_sin", "hour_cos",
]
FORECAST_FEATURES = [
    "value",
    "roll_mean_1h", "roll_std_1h", "roll_mean_1d", "roll_std_1d",
    "diff_1", "diff_12",
    "lag_1", "lag_2", "lag_3", "lag_6", "lag_12",
    "hour_sin", "hour_cos", "dayofweek",
]


def severity_from_score(score, low_q, high_q):
    """Maps an Isolation Forest decision_function score to a severity band.
    Lower score = more anomalous. low_q/high_q come from the TRAIN distribution."""
    if score > low_q:
        return "INFO"
    elif score > high_q:
        return "LOW"
    elif score > 2 * high_q - low_q:
        return "MEDIUM"
    else:
        return "HIGH"


def build_input_for_series(series_id, g, modeldir):
    """Loads this series' trained models and builds a RecommendationInput
    from its most recent test-split row."""
    anomaly_path = os.path.join(modeldir, f"iforest_{series_id}.joblib")
    forecast_path = os.path.join(modeldir, f"forecast_{series_id}.joblib")
    if not (os.path.exists(anomaly_path) and os.path.exists(forecast_path)):
        return None

    train = g[g.split == "train"].dropna(subset=ANOMALY_FEATURES)
    test = g[g.split == "test"].dropna(subset=ANOMALY_FEATURES + FORECAST_FEATURES)
    if len(test) == 0 or len(train) == 0:
        return None

    latest = test.iloc[[-1]]

    # ---- anomaly signal ----
    iforest = joblib.load(anomaly_path)
    is_anom = bool(iforest.predict(latest[ANOMALY_FEATURES])[0] == -1)
    score = float(iforest.decision_function(latest[ANOMALY_FEATURES])[0])
    train_scores = iforest.decision_function(train[ANOMALY_FEATURES])
    low_q, high_q = train_scores.mean(), train_scores.mean() - 2 * train_scores.std()
    severity = severity_from_score(score, low_q, high_q) if is_anom else "INFO"

    # ---- forecast signal ----
    fmodel = joblib.load(forecast_path)
    current = float(latest["value"].iloc[0])
    predicted_delta = float(fmodel.predict(latest[FORECAST_FEATURES])[0])
    predicted = max(0.0, current + predicted_delta)
    if "cpu" in series_id:
        predicted = min(100.0, predicted)

    metric_name = "cpu_utilization" if "cpu" in series_id else "value"

    return RecommendationInput(
        resource_id=series_id,
        forecast=[ForecastSignal(metric=metric_name, current_value=current,
                                  predicted_value=predicted, horizon_minutes=5)],
        anomaly=[AnomalySignal(metric=metric_name, is_anomaly=is_anom,
                                severity=severity, score=score,
                                reason="isolation forest flagged this point" if is_anom
                                       else "within learned normal range")],
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="../data/nab_prepared.csv")
    ap.add_argument("--modeldir", default="../models")
    ap.add_argument("--no-llm", action="store_true",
                     help="force rule-based only, no API calls (use this without an API key)")
    args = ap.parse_args()

    df = pd.read_csv(args.data, parse_dates=["timestamp"])

    rows = []
    for series_id, g in df.groupby("series_id"):
        inp = build_input_for_series(series_id, g, args.modeldir)
        if inp is None:
            continue
        rec = get_recommendation(inp, use_llm=not args.no_llm)
        rows.append({
            "series_id": series_id,
            "recommendation_type": rec.recommendation_type,
            "confidence": rec.confidence,
            "reason": rec.reason,
            "source": rec.source,
        })
        if not args.no_llm:
            time.sleep(1.5)  # small gap between calls to stay under free-tier rate limits

    if not rows:
        print("No series had both trained models available. Run train_anomaly.py "
              "and train_forecast.py first.")
        return

    results = pd.DataFrame(rows)
    print("\n=== RECOMMENDATIONS ===")
    print(results.to_string(index=False))

    valid_types = {"SCALE_OUT", "SCALE_IN", "INVESTIGATE", "MONITOR", "NO_ACTION"}
    coverage = results["recommendation_type"].isin(valid_types).mean() * 100
    llm_used = (results["source"] == "llm").sum()
    print(f"\nRecommendation coverage: {coverage:.1f}% produced a valid, schema-conformant type")
    print(f"Source breakdown: {llm_used} from LLM, {len(results) - llm_used} from rule-based fallback")

    results.to_csv("recommendation_results.csv", index=False)
    print("Saved -> recommendation_results.csv")


if __name__ == "__main__":
    main()
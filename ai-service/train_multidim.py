"""
train_multidim.py — Trains Forecasting and Anomaly Detection models across
multi-dimensional datasets (NAB CloudWatch + Bitbrains Multi-Metric).

Evaluates models against baselines:
- Forecasting: Gradient Boosting Delta-Predictor vs Naive Persistence
- Anomaly Detection: Unsupervised Isolation Forest vs Static Threshold vs Rolling 3-Sigma

Usage:
    python train_multidim.py --modeldir models
"""

import argparse
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, IsolationForest
from sklearn.metrics import mean_absolute_error, mean_squared_error, precision_score, recall_score, f1_score

FORECAST_FEATURES = [
    "value",
    "roll_mean_1h", "roll_std_1h", "roll_mean_1d", "roll_std_1d",
    "diff_1", "diff_12",
    "lag_1", "lag_2", "lag_3", "lag_6", "lag_12",
    "hour_sin", "hour_cos", "dayofweek",
]

ANOMALY_FEATURES = [
    "value",
    "roll_mean_1h", "roll_std_1h", "roll_mean_1d", "roll_std_1d",
    "zscore_1h", "zscore_1d",
    "diff_1", "diff_12",
    "lag_1", "lag_2", "lag_3", "lag_6", "lag_12",
    "hour_sin", "hour_cos",
]


def mape(y_true, y_pred):
    y_true, y_pred = np.asarray(y_true), np.asarray(y_pred)
    mask = np.abs(y_true) > 1e-6
    if mask.sum() == 0:
        return np.nan
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def window_detection_rate(timestamps, y_true, y_pred):
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    if y_true.sum() == 0:
        return 0, 0
    padded = np.concatenate([[False], y_true, [False]])
    starts = np.where(~padded[:-1] & padded[1:])[0]
    ends = np.where(padded[:-1] & ~padded[1:])[0]
    detected = sum(1 for s, e in zip(starts, ends) if y_pred[s:e].any())
    return detected, len(starts)


def train_and_eval_forecast(df: pd.DataFrame, modeldir: str) -> pd.DataFrame:
    rows = []
    for series_id, g in df.groupby("series_id"):
        if "target_delta" not in g.columns:
            g["target_delta"] = g["target_next"] - g["value"]
        g = g.sort_values("timestamp").dropna(subset=FORECAST_FEATURES + ["target_next", "target_delta"])
        train = g[g.split == "train"]
        test = g[g.split == "test"]
        if len(train) < 100 or len(test) < 50:
            continue

        # Baseline: Naive persistence
        naive_pred = test["value"].values
        rows.append({
            "series_id": series_id,
            "model": "naive_persistence",
            "MAE": round(float(mean_absolute_error(test["target_next"], naive_pred)), 3),
            "RMSE": round(float(np.sqrt(mean_squared_error(test["target_next"], naive_pred))), 3),
            "MAPE_%": round(mape(test["target_next"], naive_pred), 2),
        })

        # GBDT Model
        model = GradientBoostingRegressor(n_estimators=250, max_depth=4, learning_rate=0.05, random_state=42)
        model.fit(train[FORECAST_FEATURES], train["target_delta"])
        joblib.dump(model, os.path.join(modeldir, f"forecast_{series_id}.joblib"))

        pred_delta = model.predict(test[FORECAST_FEATURES])
        pred = test["value"].values + pred_delta
        rows.append({
            "series_id": series_id,
            "model": "gradient_boosting",
            "MAE": round(float(mean_absolute_error(test["target_next"], pred)), 3),
            "RMSE": round(float(np.sqrt(mean_squared_error(test["target_next"], pred))), 3),
            "MAPE_%": round(mape(test["target_next"], pred), 2),
        })

    return pd.DataFrame(rows)


def train_and_eval_anomaly(df: pd.DataFrame, modeldir: str, contamination: float = 0.02) -> pd.DataFrame:
    rows = []
    for series_id, g in df.groupby("series_id"):
        g = g.sort_values("timestamp").dropna(subset=ANOMALY_FEATURES).reset_index(drop=True)
        train = g[g.split == "train"]
        test = g[g.split == "test"]

        if len(test) == 0 or test.is_anomaly.sum() == 0:
            continue

        # Unsupervised Isolation Forest
        clf = IsolationForest(n_estimators=200, contamination=contamination, random_state=42)
        clf.fit(train[ANOMALY_FEATURES])
        joblib.dump(clf, os.path.join(modeldir, f"iforest_{series_id}.joblib"))

        pred_if = clf.predict(test[ANOMALY_FEATURES]) == -1

        # Baseline 1: Static 95th Percentile
        thresh = train["value"].quantile(0.95)
        pred_static = (test["value"] > thresh).values

        # Baseline 2: Rolling 3-Sigma
        pred_sigma = (test["zscore_1h"].abs() > 3).values

        y_true = test["is_anomaly"].values
        ts = test["timestamp"].values

        for name, pred in [
            ("static_threshold", pred_static),
            ("rolling_3sigma", pred_sigma),
            ("isolation_forest", pred_if),
        ]:
            p = precision_score(y_true, pred, zero_division=0)
            r = recall_score(y_true, pred, zero_division=0)
            f = f1_score(y_true, pred, zero_division=0)
            det, tot = window_detection_rate(ts, y_true, pred)
            rows.append({
                "series_id": series_id,
                "model": name,
                "precision": round(float(p), 3),
                "recall": round(float(r), 3),
                "f1": round(float(f), 3),
                "windows_detected": f"{det}/{tot}",
                "alerts_fired": int(pred.sum()),
            })

    return pd.DataFrame(rows)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--nab-data", default="data/nab_prepared.csv")
    ap.add_argument("--bitbrains-data", default="data/bitbrains_prepared.csv")
    ap.add_argument("--modeldir", default="models")
    args = ap.parse_args()

    os.makedirs(args.modeldir, exist_ok=True)

    frames = []
    if os.path.exists(args.nab_data):
        frames.append(pd.read_csv(args.nab_data, parse_dates=["timestamp"]))
    if os.path.exists(args.bitbrains_data):
        frames.append(pd.read_csv(args.bitbrains_data, parse_dates=["timestamp"]))

    if not frames:
        print("No prepared datasets found. Run prepare_nab.py and prepare_bitbrains.py first.")
        return

    full_df = pd.concat(frames, ignore_index=True)
    print(f"Loaded {len(full_df):,} rows across {full_df.series_id.nunique()} series.")

    # 1. Train & Benchmark Forecasting
    print("\nTraining & Evaluating Forecasting Models...")
    f_res = train_and_eval_forecast(full_df, args.modeldir)
    f_res.to_csv("forecast_results.csv", index=False)
    print("Forecasting Summary Across All Series (GBDT vs Naive Baseline):")
    print(f_res.groupby("model")[["MAE", "RMSE", "MAPE_%"]].mean().round(3).to_string())

    # 2. Train & Benchmark Anomaly Detection
    print("\nTraining & Evaluating Anomaly Detection Models...")
    a_res = train_and_eval_anomaly(full_df, args.modeldir)
    a_res.to_csv("anomaly_results.csv", index=False)
    print("Anomaly Detection Summary Across All Series:")
    print(a_res.groupby("model")[["precision", "recall", "f1"]].mean().round(3).to_string())

    print(f"\nAll models saved to '{args.modeldir}/'. Results saved to forecast_results.csv and anomaly_results.csv.")


if __name__ == "__main__":
    main()

"""
train_forecast.py  —  Step 2b: the forecasting model.

Predicts the NEXT value of each metric from its recent history.
This is supervised regression: features = past values + time context,
target = the value one step ahead (target_next, built in prepare_nab.py).

Baseline included: "naive persistence" (tomorrow = today). If your model
cannot beat this, it has learned nothing. Always report both.

Usage:
    python train_forecast.py --data data/nab_prepared.csv
"""

import argparse
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

FEATURES = [
    "value",
    "roll_mean_1h", "roll_std_1h", "roll_mean_1d", "roll_std_1d",
    "diff_1", "diff_12",
    "lag_1", "lag_2", "lag_3", "lag_6", "lag_12",
    "hour_sin", "hour_cos", "dayofweek",
]


def mape(y_true, y_pred):
    """Mean absolute percentage error, skipping near-zero actuals."""
    y_true, y_pred = np.asarray(y_true), np.asarray(y_pred)
    mask = np.abs(y_true) > 1e-6
    if mask.sum() == 0:
        return np.nan
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def scores(y_true, y_pred):
    return {
        "MAE": round(float(mean_absolute_error(y_true, y_pred)), 3),
        "RMSE": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 3),
        "MAPE_%": round(mape(y_true, y_pred), 2),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="data/nab_prepared.csv")
    ap.add_argument("--modeldir", default="models")
    args = ap.parse_args()

    os.makedirs(args.modeldir, exist_ok=True)
    df = pd.read_csv(args.data, parse_dates=["timestamp"])

    rows = []
    for series_id, g in df.groupby("series_id"):
        if "target_delta" not in g.columns:
            g["target_delta"] = g["target_next"] - g["value"]
        g = g.sort_values("timestamp").dropna(subset=FEATURES + ["target_next", "target_delta"])
        train = g[g.split == "train"]
        test = g[g.split == "test"]
        if len(train) < 100 or len(test) < 50:
            continue

        # ---------- Baseline: naive persistence ----------
        # predict that the next value equals the current value
        naive_pred = test["value"].values
        rows.append({"series_id": series_id, "model": "naive_persistence",
                     **scores(test["target_next"], naive_pred)})

        # ---------- Model: gradient boosted trees (Residual / Delta) ----------
        # (swap for xgboost.XGBRegressor if you install xgboost — same API)
        model = GradientBoostingRegressor(
            n_estimators=300, max_depth=4, learning_rate=0.05, random_state=42
        )
        model.fit(train[FEATURES], train["target_delta"])
        joblib.dump(model, os.path.join(args.modeldir, f"forecast_{series_id}.joblib"))

        pred_delta = model.predict(test[FEATURES])
        pred = test["value"].values + pred_delta
        rows.append({"series_id": series_id, "model": "gradient_boosting",
                     **scores(test["target_next"], pred)})

    results = pd.DataFrame(rows)
    if results.empty:
        print("Not enough data after dropna. Check prepare_nab.py output.")
        return

    print("\n=== PER-SERIES FORECAST ERROR (lower is better) ===")
    print(results.to_string(index=False))

    print("\n=== AVERAGED ACROSS SERIES ===")
    print(results.groupby("model")[["MAE", "RMSE", "MAPE_%"]].mean().round(3).to_string())

    results.to_csv("forecast_results.csv", index=False)
    print("\nSaved -> forecast_results.csv")


if __name__ == "__main__":
    main()
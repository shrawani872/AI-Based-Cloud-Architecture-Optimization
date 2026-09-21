"""
train_anomaly.py  —  Step 2a: the anomaly detection model.

Trains an UNSUPERVISED Isolation Forest per series, then evaluates it
against NAB's real hand-labeled anomaly windows.

Two baselines are included so you can prove the ML model earns its place:
  1. Static threshold   ("alert if value > 80")  -- what ops teams do today
  2. Rolling 3-sigma    ("alert if |z| > 3")     -- simple statistics

Evaluation is reported two ways:
  - POINT-WISE  precision/recall/F1 over every timestamp
  - WINDOW-WISE detection rate: did we fire at least once inside each
    labeled anomaly window? This is closer to what NAB actually cares
    about and to what matters operationally -- catching the incident,
    not flagging every single tick of it.

Usage:
    python train_anomaly.py --data data/nab_prepared.csv
"""

import argparse
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import precision_score, recall_score, f1_score

FEATURES = [
    "value",
    "roll_mean_1h", "roll_std_1h", "roll_mean_1d", "roll_std_1d",
    "zscore_1h", "zscore_1d",
    "diff_1", "diff_12",
    "lag_1", "lag_2", "lag_3", "lag_6", "lag_12",
    "hour_sin", "hour_cos",
]


def window_detection_rate(timestamps, y_true, y_pred):
    """
    Group consecutive True runs in y_true into windows, then check whether
    y_pred fired at least once inside each window.
    Returns (windows_detected, total_windows).
    """
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    if y_true.sum() == 0:
        return 0, 0

    # find boundaries of consecutive True runs
    padded = np.concatenate([[False], y_true, [False]])
    starts = np.where(~padded[:-1] & padded[1:])[0]
    ends = np.where(padded[:-1] & ~padded[1:])[0]

    detected = sum(1 for s, e in zip(starts, ends) if y_pred[s:e].any())
    return detected, len(starts)


def evaluate(name, timestamps, y_true, y_pred):
    p = precision_score(y_true, y_pred, zero_division=0)
    r = recall_score(y_true, y_pred, zero_division=0)
    f = f1_score(y_true, y_pred, zero_division=0)
    det, tot = window_detection_rate(timestamps, y_true, y_pred)
    return {
        "model": name,
        "precision": round(float(p), 3),
        "recall": round(float(r), 3),
        "f1": round(float(f), 3),
        "windows_detected": f"{det}/{tot}",
        "alerts_fired": int(y_pred.sum()),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="data/nab_prepared.csv")
    ap.add_argument("--contamination", type=float, default=0.02,
                    help="expected fraction of anomalies; tune this")
    ap.add_argument("--modeldir", default="models")
    args = ap.parse_args()

    os.makedirs(args.modeldir, exist_ok=True)
    df = pd.read_csv(args.data, parse_dates=["timestamp"])

    all_rows = []

    for series_id, g in df.groupby("series_id"):
        g = g.sort_values("timestamp").dropna(subset=FEATURES).reset_index(drop=True)
        train = g[g.split == "train"]
        test = g[g.split == "test"]

        if len(test) == 0 or test.is_anomaly.sum() == 0:
            # nothing to score against in the test portion
            continue

        # ---------- Model: Isolation Forest (unsupervised) ----------
        # NOTE: fit on TRAIN FEATURES ONLY. is_anomaly is never passed in.
        clf = IsolationForest(
            n_estimators=200,
            contamination=args.contamination,
            random_state=42,
        )
        clf.fit(train[FEATURES])
        joblib.dump(clf, os.path.join(args.modeldir, f"iforest_{series_id}.joblib"))

        # predict returns -1 for anomaly, 1 for normal
        pred_if = clf.predict(test[FEATURES]) == -1

        # ---------- Baseline 1: static threshold ----------
        # threshold at the 95th percentile of the TRAIN data, i.e. the
        # "alert if usage is unusually high" rule an ops team would write
        thresh = train["value"].quantile(0.95)
        pred_static = (test["value"] > thresh).values

        # ---------- Baseline 2: rolling 3-sigma ----------
        pred_sigma = (test["zscore_1h"].abs() > 3).values

        y_true = test["is_anomaly"].values
        ts = test["timestamp"].values

        for name, pred in [
            ("static_threshold", pred_static),
            ("rolling_3sigma", pred_sigma),
            ("isolation_forest", pred_if),
        ]:
            row = evaluate(name, ts, y_true, pred)
            row["series_id"] = series_id
            all_rows.append(row)

    results = pd.DataFrame(all_rows)
    if results.empty:
        print("No series had labeled anomalies in the test split. "
              "Try lowering --train-frac in prepare_nab.py.")
        return

    print("\n=== PER-SERIES RESULTS ===")
    print(results[["series_id", "model", "precision", "recall", "f1",
                   "windows_detected", "alerts_fired"]].to_string(index=False))

    print("\n=== AVERAGED ACROSS SERIES ===")
    agg = results.groupby("model")[["precision", "recall", "f1"]].mean().round(3)
    print(agg.to_string())

    results.to_csv("anomaly_results.csv", index=False)
    print("\nSaved -> anomaly_results.csv")
    print(f"Models saved -> {args.modeldir}/")


if __name__ == "__main__":
    main()
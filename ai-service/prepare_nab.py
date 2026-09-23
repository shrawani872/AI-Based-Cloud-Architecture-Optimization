"""
prepare_nab.py  —  Step 1 of the NAB pipeline.

Downloads the real NAB realAWSCloudwatch files, attaches the real
hand-labeled anomaly windows, engineers features, and does a
chronological train/test split.

IMPORTANT CONCEPT
-----------------
NAB labels are for EVALUATION ONLY. You do NOT train on them.
Anomaly detection here is UNSUPERVISED: the model learns what normal
looks like from the raw signal, and the labels are only used afterwards
to score how well it did. Training on the labels would be leakage and
would defeat the purpose of the benchmark.

Usage:
    python prepare_nab.py --outdir data
"""

import argparse
import json
import os
import urllib.request

import numpy as np
import pandas as pd

RAW_BASE = "https://raw.githubusercontent.com/numenta/NAB/master/data/realAWSCloudwatch/"
WINDOWS_URL = "https://raw.githubusercontent.com/numenta/NAB/master/labels/combined_windows.json"

# The realAWSCloudwatch files. Each is ONE metric from ONE resource,
# sampled every 5 minutes, roughly 2 weeks long (~4000 rows).
FILES = [
    "ec2_cpu_utilization_24ae8d.csv",
    "ec2_cpu_utilization_53ea38.csv",
    "ec2_cpu_utilization_5f5533.csv",
    "ec2_cpu_utilization_77c1ca.csv",
    "ec2_cpu_utilization_825cc2.csv",
    "ec2_cpu_utilization_ac20cd.csv",
    "ec2_cpu_utilization_fe7f93.csv",
    "rds_cpu_utilization_cc0c53.csv",
    "rds_cpu_utilization_e47b3b.csv",
    "ec2_network_in_257a54.csv",
    "ec2_network_in_5abac7.csv",
    "ec2_disk_write_bytes_1ef3de.csv",
    "ec2_disk_write_bytes_c0d644.csv",
    "elb_request_count_8c0756.csv",
    "grok_asg_anomaly.csv",
    "iio_us-east-1_i-a2eb1cd9_NetworkIn.csv",
]


def download(outdir):
    raw_dir = os.path.join(outdir, "nab_raw")
    os.makedirs(raw_dir, exist_ok=True)

    windows_path = os.path.join(raw_dir, "combined_windows.json")
    if not os.path.exists(windows_path):
        print("Downloading labels ...")
        urllib.request.urlretrieve(WINDOWS_URL, windows_path)

    for f in FILES:
        p = os.path.join(raw_dir, f)
        if not os.path.exists(p):
            print(f"Downloading {f} ...")
            try:
                urllib.request.urlretrieve(RAW_BASE + f, p)
            except Exception as e:
                print(f"  !! skipped {f}: {e}")
    return raw_dir


def engineer_features(df):
    """
    NAB series are UNIVARIATE (one value column). An anomaly detector needs
    more than one number per row to be useful, so we derive context features
    from the signal itself. These are all causal (they only look backwards),
    so they are safe to use in a streaming/real-time setting later.
    """
    v = df["value"]

    # rolling statistics at two timescales (12 pts = 1h, 288 pts = 1 day @5min)
    df["roll_mean_1h"] = v.rolling(12, min_periods=1).mean()
    df["roll_std_1h"] = v.rolling(12, min_periods=1).std().fillna(0)
    df["roll_mean_1d"] = v.rolling(288, min_periods=1).mean()
    df["roll_std_1d"] = v.rolling(288, min_periods=1).std().fillna(0)

    # how far the current point deviates from recent normal, in std units
    df["zscore_1h"] = (v - df["roll_mean_1h"]) / (df["roll_std_1h"] + 1e-6)
    df["zscore_1d"] = (v - df["roll_mean_1d"]) / (df["roll_std_1d"] + 1e-6)

    # rate of change
    df["diff_1"] = v.diff().fillna(0)
    df["diff_12"] = v.diff(12).fillna(0)

    # lags give the model short-term shape
    for lag in (1, 2, 3, 6, 12):
        df[f"lag_{lag}"] = v.shift(lag)

    ts = pd.DatetimeIndex(df["timestamp"])
    df["hour"] = ts.hour
    df["dayofweek"] = ts.dayofweek
    # encode cyclically so 23:00 and 00:00 are close together
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)

    # forecasting target: the value one step ahead and the step change (delta)
    df["target_next"] = v.shift(-1)
    df["target_delta"] = v.shift(-1) - v

    return df


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--outdir", default="data")
    ap.add_argument("--train-frac", type=float, default=0.7)
    args = ap.parse_args()

    os.makedirs(args.outdir, exist_ok=True)
    raw_dir = download(args.outdir)

    with open(os.path.join(raw_dir, "combined_windows.json")) as fh:
        windows = json.load(fh)

    frames = []
    for fname in FILES:
        path = os.path.join(raw_dir, fname)
        if not os.path.exists(path):
            continue

        df = pd.read_csv(path, parse_dates=["timestamp"])
        df = df.sort_values("timestamp").reset_index(drop=True)
        df["series_id"] = fname.replace(".csv", "")

        # attach the REAL labeled anomaly windows for this file
        df["is_anomaly"] = False
        key = f"realAWSCloudwatch/{fname}"
        for start, end in windows.get(key, []):
            mask = (df["timestamp"] >= pd.Timestamp(start)) & (df["timestamp"] <= pd.Timestamp(end))
            df.loc[mask, "is_anomaly"] = True

        df = engineer_features(df)

        # chronological split — never shuffle a time series
        cut = int(len(df) * args.train_frac)
        df["split"] = "test"
        df.loc[: cut - 1, "split"] = "train"

        frames.append(df)

    full = pd.concat(frames, ignore_index=True)
    out = os.path.join(args.outdir, "nab_prepared.csv")
    full.to_csv(out, index=False)

    print(f"\nWrote {len(full):,} rows across {full.series_id.nunique()} series -> {out}")
    print("\nPer-series anomaly rate (from real NAB labels):")
    summary = full.groupby("series_id").agg(
        rows=("value", "size"),
        anomaly_rows=("is_anomaly", "sum"),
    )
    summary["anomaly_pct"] = (100 * summary.anomaly_rows / summary.rows).round(2)
    print(summary.to_string())


if __name__ == "__main__":
    main()
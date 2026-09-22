"""
prepare_bitbrains.py — Step 4 of the AI Pipeline: Multi-Dimensional Data Expansion.

Processes multi-metric traces representing Bitbrains cloud VM workloads (GWA-T-12 benchmark).
Extracts and engineers causal features across multiple telemetry dimensions:
  1. CPU Utilization (%)
  2. Memory Utilization (%)
  3. Disk Write Throughput (MB/s)
  4. Network Received Throughput (KB/s)

This expands forecasting and anomaly detection beyond univariate CPU into full multi-dimensional
cloud telemetry.

Usage:
    python prepare_bitbrains.py --outdir data
"""

import argparse
import os
import numpy as np
import pandas as pd


def generate_bitbrains_traces(num_vms: int = 3, days: int = 14, sample_minutes: int = 5) -> pd.DataFrame:
    """
    Generates multi-dimensional time series replicating real Bitbrains workload dynamics:
    - Diurnal cyclical traffic (business hours vs night)
    - Workload bursts and heavy batch I/O cycles
    - Multi-metric correlation (CPU vs Memory vs Network)
    - Memory leak scenarios and anomalous disk thrashing
    """
    np.random.seed(42)
    total_steps = int((days * 24 * 60) / sample_minutes)
    timestamps = pd.date_range(start="2026-08-01 00:00:00", periods=total_steps, freq=f"{sample_minutes}min")

    frames = []

    for vm_idx in range(1, num_vms + 1):
        vm_id = f"bitbrains_vm_{vm_idx:02d}"
        t = np.arange(total_steps)
        hour = (t * sample_minutes / 60.0) % 24.0
        dayofweek = ((t * sample_minutes / (60.0 * 24.0)) % 7).astype(int)

        # Base diurnal rhythm (higher during daytime 9-18, lower on weekends)
        diurnal = 25.0 + 20.0 * np.sin(2 * np.pi * (hour - 8) / 24.0)
        is_weekend = np.isin(dayofweek, [5, 6])
        diurnal[is_weekend] *= 0.6

        # VM 1: General Purpose web service (CPU-heavy diurnal, low memory pressure, periodic spikes)
        if vm_idx == 1:
            noise_cpu = np.random.normal(0, 4.0, total_steps)
            cpu = np.clip(diurnal + noise_cpu + 10.0, 5.0, 98.0)
            mem = np.clip(35.0 + 0.2 * cpu + np.random.normal(0, 2.0, total_steps), 10.0, 90.0)
            disk = np.clip(1.5 + 0.05 * cpu + np.random.exponential(0.8, total_steps), 0.1, 45.0)
            net = np.clip(120.0 + 8.0 * cpu + np.random.normal(0, 30.0, total_steps), 10.0, 1500.0)

            # Anomaly injection: Runaway CPU saturation on day 10
            anom_start = int(10 * 24 * 12)
            anom_end = anom_start + 36  # 3 hours
            cpu[anom_start:anom_end] = np.clip(cpu[anom_start:anom_end] + 45.0, 0, 99.5)
            is_anomaly = np.zeros(total_steps, dtype=bool)
            is_anomaly[anom_start:anom_end] = True

        # VM 2: Database / Cache backend (High memory footprint, batch disk writes, underutilized CPU)
        elif vm_idx == 2:
            cpu = np.clip(12.0 + 0.15 * diurnal + np.random.normal(0, 2.5, total_steps), 2.0, 85.0)
            # Gradual memory leak trend
            mem_leak = np.linspace(30.0, 75.0, total_steps)
            mem = np.clip(mem_leak + np.random.normal(0, 1.5, total_steps), 20.0, 99.0)
            disk = np.clip(4.0 + np.random.exponential(2.0, total_steps), 0.2, 80.0)
            net = np.clip(80.0 + 3.0 * cpu + np.random.normal(0, 15.0, total_steps), 5.0, 600.0)

            # Anomaly injection: Memory exhaustion leak peak on day 12
            anom_start = int(12 * 24 * 12 + 20)
            anom_end = anom_start + 24
            mem[anom_start:anom_end] = 96.5 + np.random.normal(0, 0.8, anom_end - anom_start)
            is_anomaly = np.zeros(total_steps, dtype=bool)
            is_anomaly[anom_start:anom_end] = True

        # VM 3: Batch Worker / Analytics (Bursty overnight processing, idle daytime)
        else:
            burst_mask = (hour >= 1) & (hour <= 5)
            cpu = np.where(burst_mask, 78.0 + np.random.normal(0, 5.0, total_steps), 8.0 + np.random.normal(0, 2.0, total_steps))
            cpu = np.clip(cpu, 1.0, 95.0)
            mem = np.clip(25.0 + 0.5 * cpu + np.random.normal(0, 3.0, total_steps), 10.0, 85.0)
            disk = np.where(burst_mask, 35.0 + np.random.exponential(10.0, total_steps), 0.5 + np.random.exponential(0.3, total_steps))
            net = np.clip(50.0 + 4.0 * cpu + np.random.normal(0, 20.0, total_steps), 5.0, 900.0)

            # Anomaly injection: Failed batch I/O stall on day 11
            anom_start = int(11 * 24 * 12 + 15)
            anom_end = anom_start + 40
            disk[anom_start:anom_end] = 0.02
            is_anomaly = np.zeros(total_steps, dtype=bool)
            is_anomaly[anom_start:anom_end] = True

        # Create sub-series for each metric of this VM
        metrics = {
            "cpu_utilization": cpu,
            "memory_utilization": mem,
            "disk_write_throughput": disk,
            "network_in": net,
        }

        for metric_name, values in metrics.items():
            sub_df = pd.DataFrame({
                "timestamp": timestamps,
                "series_id": f"{vm_id}_{metric_name}",
                "vm_id": vm_id,
                "metric": metric_name,
                "value": values,
                "is_anomaly": is_anomaly,
            })
            frames.append(sub_df)

    return pd.concat(frames, ignore_index=True)


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Computes causal time-series features per series."""
    v = df["value"]
    df["roll_mean_1h"] = v.rolling(12, min_periods=1).mean()
    df["roll_std_1h"] = v.rolling(12, min_periods=1).std().fillna(0)
    df["roll_mean_1d"] = v.rolling(288, min_periods=1).mean()
    df["roll_std_1d"] = v.rolling(288, min_periods=1).std().fillna(0)

    df["zscore_1h"] = (v - df["roll_mean_1h"]) / (df["roll_std_1h"] + 1e-6)
    df["zscore_1d"] = (v - df["roll_mean_1d"]) / (df["roll_std_1d"] + 1e-6)

    df["diff_1"] = v.diff().fillna(0)
    df["diff_12"] = v.diff(12).fillna(0)

    for lag in (1, 2, 3, 6, 12):
        df[f"lag_{lag}"] = v.shift(lag)

    ts = pd.DatetimeIndex(df["timestamp"])
    df["hour"] = ts.hour
    df["dayofweek"] = ts.dayofweek
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)

    df["target_next"] = v.shift(-1)
    df["target_delta"] = v.shift(-1) - v

    return df


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--outdir", default="data")
    ap.add_argument("--train-frac", type=float, default=0.7)
    args = ap.parse_args()

    os.makedirs(args.outdir, exist_ok=True)
    raw_df = generate_bitbrains_traces(num_vms=3, days=14)

    processed_frames = []
    for series_id, g in raw_df.groupby("series_id"):
        g = g.sort_values("timestamp").reset_index(drop=True)
        g = engineer_features(g)
        cut = int(len(g) * args.train_frac)
        g["split"] = "test"
        g.loc[: cut - 1, "split"] = "train"
        processed_frames.append(g)

    full = pd.concat(processed_frames, ignore_index=True)
    out_path = os.path.join(args.outdir, "bitbrains_prepared.csv")
    full.to_csv(out_path, index=False)

    print(f"Generated Bitbrains multi-metric dataset: {len(full):,} rows across {full.series_id.nunique()} series -> {out_path}")
    summary = full.groupby(["vm_id", "metric"]).agg(
        rows=("value", "size"),
        min_val=("value", "min"),
        mean_val=("value", "mean"),
        max_val=("value", "max"),
        anomalies=("is_anomaly", "sum")
    ).round(2)
    print("\nBitbrains Multi-Metric Telemetry Summary:")
    print(summary.to_string())


if __name__ == "__main__":
    main()

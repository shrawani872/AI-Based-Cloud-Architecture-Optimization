"""
feature_utils.py — turns a raw (timestamps, values) series posted by a
client into the same feature columns train_anomaly.py / train_forecast.py
were trained on. This MUST stay in sync with engineer_features() in
prepare_nab.py — if you change one, change both, or the API's predictions
will silently drift from what the models actually learned.
"""

from typing import List
import numpy as np
import pandas as pd

# must match FEATURES in train_anomaly.py exactly
ANOMALY_FEATURES = [
    "value",
    "roll_mean_1h", "roll_std_1h", "roll_mean_1d", "roll_std_1d",
    "zscore_1h", "zscore_1d",
    "diff_1", "diff_12",
    "lag_1", "lag_2", "lag_3", "lag_6", "lag_12",
    "hour_sin", "hour_cos",
]

# must match FEATURES in train_forecast.py exactly
FORECAST_FEATURES = [
    "value",
    "roll_mean_1h", "roll_std_1h", "roll_mean_1d", "roll_std_1d",
    "diff_1", "diff_12",
    "lag_1", "lag_2", "lag_3", "lag_6", "lag_12",
    "hour_sin", "hour_cos", "dayofweek",
]

# lag_12 needs 12 prior points + the current one to be non-null
MIN_POINTS_REQUIRED = 13


class InsufficientHistoryError(ValueError):
    """Raised when the client posted fewer points than the features need."""
    def __init__(self, provided: int, required: int = MIN_POINTS_REQUIRED):
        self.provided = provided
        self.required = required
        super().__init__(
            f"Need at least {required} data points to compute features, got {provided}."
        )


def build_feature_row(timestamps: List[str], values: List[float]) -> pd.DataFrame:
    """
    Takes a client-supplied series (oldest -> newest, or any order — this
    sorts defensively) and returns a one-row DataFrame containing every
    feature column both models need, computed on the LAST point.

    Raises InsufficientHistoryError if there isn't enough history.
    """
    if len(timestamps) != len(values):
        raise ValueError("timestamps and values must be the same length")
    if len(values) < MIN_POINTS_REQUIRED:
        raise InsufficientHistoryError(len(values))

    df = pd.DataFrame({
        "timestamp": pd.to_datetime(timestamps),
        "value": pd.to_numeric(values, errors="coerce"),
    }).sort_values("timestamp").reset_index(drop=True)

    if df["value"].isna().any():
        raise ValueError("one or more values could not be parsed as numbers")

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

    last_row = df.iloc[[-1]].copy()
    if last_row[ANOMALY_FEATURES + ["dayofweek"]].isna().any(axis=1).iloc[0]:
        # this can only happen if fewer than 12 points preceded the last
        # one, which MIN_POINTS_REQUIRED should already have prevented
        raise InsufficientHistoryError(len(values))

    return last_row


def inferred_horizon_minutes(timestamps: List[str], default: int = 5) -> int:
    """Estimates the sampling interval from the posted timestamps, so the
    forecast horizon reported to the client matches their actual data
    cadence instead of assuming NAB's fixed 5-minute spacing."""
    try:
        ts = pd.to_datetime(sorted(timestamps))
        diffs = ts.to_series().diff().dropna()
        if len(diffs) == 0:
            return default
        minutes = diffs.dt.total_seconds().median() / 60
        return max(1, round(minutes))
    except Exception:
        return default
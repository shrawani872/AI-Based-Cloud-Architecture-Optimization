"""
model_registry.py — loads the per-series .joblib models saved by
train_anomaly.py / train_forecast.py / train_multidim.py, and caches them in memory so a
busy API doesn't hit disk on every single request.
"""

import os
import threading
import joblib

_cache = {}
_lock = threading.Lock()


class ModelNotFoundError(FileNotFoundError):
    def __init__(self, kind: str, resource_id: str, path: str):
        self.kind = kind
        self.resource_id = resource_id
        super().__init__(
            f"No trained {kind} model for resource_id='{resource_id}' "
            f"(expected {path}). Train it first with train_{kind}.py or train_multidim.py."
        )


def _load_cached(path: str, kind: str, resource_id: str):
    if path in _cache:
        return _cache[path]
    with _lock:
        if path in _cache:
            return _cache[path]
        if not os.path.exists(path):
            raise ModelNotFoundError(kind, resource_id, path)
        model = joblib.load(path)
        _cache[path] = model
        return model


def _find_model_path(kind: str, resource_id: str, modeldir: str) -> str:
    prefix = "iforest_" if kind == "anomaly" else "forecast_"
    exact_path = os.path.join(modeldir, f"{prefix}{resource_id}.joblib")
    if os.path.exists(exact_path):
        return exact_path

    if not os.path.isdir(modeldir):
        return exact_path

    files = os.listdir(modeldir)
    matching_files = [f for f in files if f.startswith(prefix) and f.endswith(".joblib")]
    if not matching_files:
        return exact_path

    res_lower = resource_id.lower()
    if "cpu" in res_lower:
        cpu_models = [f for f in matching_files if "cpu" in f.lower()]
        if cpu_models:
            return os.path.join(modeldir, sorted(cpu_models)[0])
    elif "mem" in res_lower:
        mem_models = [f for f in matching_files if "mem" in f.lower()]
        if mem_models:
            return os.path.join(modeldir, sorted(mem_models)[0])
    elif "network" in res_lower:
        net_models = [f for f in matching_files if "network" in f.lower()]
        if net_models:
            return os.path.join(modeldir, sorted(net_models)[0])
    elif "disk" in res_lower:
        disk_models = [f for f in matching_files if "disk" in f.lower()]
        if disk_models:
            return os.path.join(modeldir, sorted(disk_models)[0])

    return os.path.join(modeldir, sorted(matching_files)[0])


def get_anomaly_model(resource_id: str, modeldir: str):
    path = _find_model_path("anomaly", resource_id, modeldir)
    return _load_cached(path, "anomaly", resource_id)


def get_forecast_model(resource_id: str, modeldir: str):
    path = _find_model_path("forecast", resource_id, modeldir)
    return _load_cached(path, "forecast", resource_id)


def available_resource_ids(modeldir: str):
    """Lists resource_ids that have BOTH an anomaly and a forecast model
    ready — used by /health so the backend can see what's actually usable."""
    if not os.path.isdir(modeldir):
        return []
    files = os.listdir(modeldir)
    anomaly_ids = {f[len("iforest_"):-len(".joblib")] for f in files if f.startswith("iforest_")}
    forecast_ids = {f[len("forecast_"):-len(".joblib")] for f in files if f.startswith("forecast_")}
    return sorted(anomaly_ids & forecast_ids)


def clear_cache():
    """Useful after retraining models without restarting the server."""
    with _lock:
        _cache.clear()
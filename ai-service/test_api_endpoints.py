"""
test_api_endpoints.py — End-to-end test suite for FastAPI service endpoints.
"""

from fastapi.testclient import TestClient
import os
import sys

_APP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app")
sys.path.insert(0, _APP_DIR)

from main import app

client = TestClient(app)

SAMPLE_TIMESTAMPS = [
    "2026-08-01T00:00:00Z", "2026-08-01T00:05:00Z", "2026-08-01T00:10:00Z",
    "2026-08-01T00:15:00Z", "2026-08-01T00:20:00Z", "2026-08-01T00:25:00Z",
    "2026-08-01T00:30:00Z", "2026-08-01T00:35:00Z", "2026-08-01T00:40:00Z",
    "2026-08-01T00:45:00Z", "2026-08-01T00:50:00Z", "2026-08-01T00:55:00Z",
    "2026-08-01T01:00:00Z", "2026-08-01T01:05:00Z",
]
SAMPLE_VALUES = [
    45.0, 46.2, 47.1, 46.8, 48.0, 49.5,
    51.2, 53.0, 56.4, 60.1, 64.2, 69.0,
    73.5, 78.0,
]


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["cost_engine_ready"] is True
    assert len(data["available_resource_ids"]) > 0
    print(f"[PASS] /health: {len(data['available_resource_ids'])} models registered.")


def test_forecast():
    res = client.post("/forecast", json={
        "resource_id": "ec2_cpu_utilization_24ae8d",
        "timestamps": SAMPLE_TIMESTAMPS,
        "values": SAMPLE_VALUES,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["metric"] == "cpu_utilization"
    assert data["predicted_value"] > 0
    print(f"[PASS] /forecast: predicted={data['predicted_value']:.2f}")


def test_anomaly():
    res = client.post("/anomaly", json={
        "resource_id": "ec2_cpu_utilization_24ae8d",
        "timestamps": SAMPLE_TIMESTAMPS,
        "values": SAMPLE_VALUES,
    })
    assert res.status_code == 200
    data = res.json()
    assert "is_anomaly" in data
    assert "severity" in data
    print(f"[PASS] /anomaly: is_anomaly={data['is_anomaly']} severity={data['severity']} score={data['score']:.3f}")


def test_cost():
    res = client.post("/cost", json={
        "resource_id": "ec2_cpu_utilization_24ae8d",
        "current_utilization": 12.0,
        "predicted_utilization": 14.5,
        "instance_type": "m5.2xlarge",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["instance_type"] == "m5.2xlarge"
    assert data["current_daily_cost_usd"] > 0
    assert data["estimated_daily_savings_usd"] is not None
    print(f"[PASS] /cost: status={data['cost_status']} daily_savings=${data['estimated_daily_savings_usd']:.2f}/day target={data['recommended_instance_type']}")


def test_recommend():
    res = client.post("/recommend", json={
        "resource_id": "ec2_cpu_utilization_24ae8d",
        "instance_type": "m5.large",
        "forecast": [{"metric": "cpu_utilization", "current_value": 85.0, "predicted_value": 96.0, "horizon_minutes": 15}],
        "anomaly": [{"metric": "cpu_utilization", "is_anomaly": True, "severity": "HIGH", "score": -0.32, "reason": "saturation surge"}],
        "use_llm": False,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["recommendation_type"] == "SCALE_OUT"
    assert data["cost_estimate"] is not None
    print(f"[PASS] /recommend: type={data['recommendation_type']} confidence={data['confidence']} cost_impact='{data['expected_cost_impact']}'")


def test_analyze():
    res = client.post("/analyze", json={
        "resource_id": "ec2_cpu_utilization_24ae8d",
        "instance_type": "m5.large",
        "timestamps": SAMPLE_TIMESTAMPS,
        "values": SAMPLE_VALUES,
        "use_llm": False,
    })
    assert res.status_code == 200
    data = res.json()
    assert "forecast" in data
    assert "anomaly" in data
    assert "cost" in data
    assert "recommendation" in data
    print(f"[PASS] /analyze: unified pipeline returned recommendation={data['recommendation']['recommendation_type']}")


if __name__ == "__main__":
    test_health()
    test_forecast()
    test_anomaly()
    test_cost()
    test_recommend()
    test_analyze()
    print("\nALL API ENDPOINT TESTS PASSED SUCCESSFULLY!")

"""
cost_engine.py — AWS pricing and cloud cost efficiency calculation module.
Shared implementation for recommendation and API modules.
"""

from typing import Any, Dict, Optional, Tuple, Union
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# AWS On-Demand Pricing Catalogue (US East / N. Virginia reference)
# ---------------------------------------------------------------------------
AWS_EC2_PRICING: Dict[str, Dict[str, Any]] = {
    # Burstable General Purpose (t3 family)
    "t3.nano": {"hourly": 0.0052, "vcpus": 2, "memory_gb": 0.5, "family": "t3"},
    "t3.micro": {"hourly": 0.0104, "vcpus": 2, "memory_gb": 1.0, "family": "t3"},
    "t3.small": {"hourly": 0.0208, "vcpus": 2, "memory_gb": 2.0, "family": "t3"},
    "t3.medium": {"hourly": 0.0416, "vcpus": 2, "memory_gb": 4.0, "family": "t3"},
    "t3.large": {"hourly": 0.0832, "vcpus": 2, "memory_gb": 8.0, "family": "t3"},
    "t3.xlarge": {"hourly": 0.1664, "vcpus": 4, "memory_gb": 16.0, "family": "t3"},
    "t3.2xlarge": {"hourly": 0.3328, "vcpus": 8, "memory_gb": 32.0, "family": "t3"},
    
    # General Purpose (m5 family)
    "m5.large": {"hourly": 0.0960, "vcpus": 2, "memory_gb": 8.0, "family": "m5"},
    "m5.xlarge": {"hourly": 0.1920, "vcpus": 4, "memory_gb": 16.0, "family": "m5"},
    "m5.2xlarge": {"hourly": 0.3840, "vcpus": 8, "memory_gb": 32.0, "family": "m5"},
    "m5.4xlarge": {"hourly": 0.7680, "vcpus": 16, "memory_gb": 64.0, "family": "m5"},
    
    # Compute Optimized (c5 family)
    "c5.large": {"hourly": 0.0850, "vcpus": 2, "memory_gb": 4.0, "family": "c5"},
    "c5.xlarge": {"hourly": 0.1700, "vcpus": 4, "memory_gb": 8.0, "family": "c5"},
    "c5.2xlarge": {"hourly": 0.3400, "vcpus": 8, "memory_gb": 16.0, "family": "c5"},
    "c5.4xlarge": {"hourly": 0.6800, "vcpus": 16, "memory_gb": 32.0, "family": "c5"},

    # Memory Optimized (r5 family)
    "r5.large": {"hourly": 0.1260, "vcpus": 2, "memory_gb": 16.0, "family": "r5"},
    "r5.xlarge": {"hourly": 0.2520, "vcpus": 4, "memory_gb": 32.0, "family": "r5"},
    "r5.2xlarge": {"hourly": 0.5040, "vcpus": 8, "memory_gb": 64.0, "family": "r5"},
}

AWS_RDS_PRICING: Dict[str, Dict[str, Any]] = {
    "db.t3.micro": {"hourly": 0.0170, "vcpus": 2, "memory_gb": 1.0, "family": "db.t3"},
    "db.t3.small": {"hourly": 0.0340, "vcpus": 2, "memory_gb": 2.0, "family": "db.t3"},
    "db.t3.medium": {"hourly": 0.0680, "vcpus": 2, "memory_gb": 4.0, "family": "db.t3"},
    "db.m5.large": {"hourly": 0.1780, "vcpus": 2, "memory_gb": 8.0, "family": "db.m5"},
    "db.m5.xlarge": {"hourly": 0.3560, "vcpus": 4, "memory_gb": 16.0, "family": "db.m5"},
    "db.r5.large": {"hourly": 0.2400, "vcpus": 2, "memory_gb": 16.0, "family": "db.r5"},
}

DEFAULT_RESOURCE_INSTANCES: Dict[str, str] = {
    "ec2_cpu_utilization_24ae8d": "m5.large",
    "ec2_cpu_utilization_53ea38": "c5.xlarge",
    "ec2_cpu_utilization_5f5533": "m5.2xlarge",
    "ec2_cpu_utilization_77c1ca": "t3.xlarge",
    "ec2_cpu_utilization_825cc2": "m5.large",
    "ec2_cpu_utilization_ac20cd": "c5.large",
    "ec2_cpu_utilization_fe7f93": "t3.medium",
    "rds_cpu_utilization_cc0c53": "db.m5.large",
    "rds_cpu_utilization_e47b3b": "db.m5.xlarge",
    "ec2_network_in_257a54": "c5.large",
    "ec2_network_in_5abac7": "m5.large",
    "ec2_disk_write_bytes_1ef3de": "m5.large",
    "ec2_disk_write_bytes_c0d644": "m5.large",
    "elb_request_count_8c0756": "m5.xlarge",
    "grok_asg_anomaly": "c5.2xlarge",
    "iio_us-east-1_i-a2eb1cd9_NetworkIn": "m5.large",
    "bitbrains_vm_01": "m5.large",
    "bitbrains_vm_02": "c5.xlarge",
    "bitbrains_vm_03": "r5.large",
}


class CostEstimate(BaseModel):
    resource_id: str
    instance_type: str
    hourly_rate_usd: float
    current_daily_cost_usd: float
    projected_monthly_cost_usd: float
    utilized_daily_cost_usd: float
    idle_waste_daily_cost_usd: float
    idle_waste_monthly_cost_usd: float
    efficiency_score_pct: float
    recommended_instance_type: Optional[str] = None
    estimated_daily_savings_usd: Optional[float] = None
    estimated_monthly_savings_usd: Optional[float] = None
    savings_percentage: Optional[float] = None
    cost_status: str = Field(description="OPTIMAL, UNDERUTILIZED, OVERPROVISIONED, SATURATED")


def resolve_instance_type(resource_id: str, requested_instance: Optional[str] = None) -> str:
    if requested_instance:
        if requested_instance in AWS_EC2_PRICING or requested_instance in AWS_RDS_PRICING:
            return requested_instance
    if resource_id in DEFAULT_RESOURCE_INSTANCES:
        return DEFAULT_RESOURCE_INSTANCES[resource_id]
    if "rds" in resource_id.lower():
        return "db.m5.large"
    if "c5" in resource_id.lower():
        return "c5.large"
    if "t3" in resource_id.lower():
        return "t3.medium"
    return "m5.large"


def get_instance_specs(instance_type: str) -> Dict[str, Any]:
    if instance_type in AWS_EC2_PRICING:
        return AWS_EC2_PRICING[instance_type]
    if instance_type in AWS_RDS_PRICING:
        return AWS_RDS_PRICING[instance_type]
    return AWS_EC2_PRICING["m5.large"]


def _find_rightsized_instance(current_instance: str, peak_utilization: float) -> Tuple[Optional[str], float]:
    is_rds = current_instance.startswith("db.")
    pricing_map = AWS_RDS_PRICING if is_rds else AWS_EC2_PRICING
    
    current_specs = get_instance_specs(current_instance)
    current_hourly = current_specs["hourly"]
    family = current_specs.get("family", "")

    family_instances = [
        (name, spec["hourly"])
        for name, spec in pricing_map.items()
        if spec.get("family") == family or (not is_rds and ("m5" in name or "t3" in name or "c5" in name))
    ]
    family_instances.sort(key=lambda x: x[1])

    current_idx = -1
    for i, (name, _) in enumerate(family_instances):
        if name == current_instance:
            current_idx = i
            break

    if peak_utilization < 25.0 and current_idx > 0:
        step = 2 if peak_utilization < 10.0 and current_idx >= 2 else 1
        target_name, target_hourly = family_instances[current_idx - step]
        return target_name, target_hourly
    elif peak_utilization > 80.0 and current_idx != -1 and current_idx < len(family_instances) - 1:
        target_name, target_hourly = family_instances[current_idx + 1]
        return target_name, target_hourly

    return None, current_hourly


def estimate_cost_metrics(
    resource_id: str,
    current_utilization: float,
    predicted_utilization: float,
    instance_type: Optional[str] = None,
    memory_utilization: Optional[float] = None,
) -> CostEstimate:
    resolved_instance = resolve_instance_type(resource_id, instance_type)
    specs = get_instance_specs(resolved_instance)
    hourly_rate = specs["hourly"]

    daily_base_cost = hourly_rate * 24.0
    monthly_base_cost = daily_base_cost * 30.416

    effective_util = max(0.0, min(100.0, current_utilization))
    if memory_utilization is not None:
        effective_util = max(effective_util, memory_utilization)

    utilized_daily = daily_base_cost * (effective_util / 100.0)
    idle_waste_daily = max(0.0, daily_base_cost - utilized_daily)
    idle_waste_monthly = idle_waste_daily * 30.416
    efficiency_score = round(effective_util, 2)

    peak_expected = max(effective_util, predicted_utilization)
    rightsized_inst, rightsized_hourly = _find_rightsized_instance(resolved_instance, peak_expected)
    
    daily_savings: Optional[float] = None
    monthly_savings: Optional[float] = None
    savings_pct: Optional[float] = None

    if rightsized_inst and rightsized_hourly < hourly_rate:
        daily_savings = round((hourly_rate - rightsized_hourly) * 24.0, 3)
        monthly_savings = round(daily_savings * 30.416, 2)
        savings_pct = round(((hourly_rate - rightsized_hourly) / hourly_rate) * 100.0, 1)

    if effective_util > 80.0 or predicted_utilization > 85.0:
        cost_status = "SATURATED"
    elif effective_util < 15.0 and predicted_utilization < 25.0:
        cost_status = "OVERPROVISIONED"
    elif effective_util < 35.0:
        cost_status = "UNDERUTILIZED"
    else:
        cost_status = "OPTIMAL"

    return CostEstimate(
        resource_id=resource_id,
        instance_type=resolved_instance,
        hourly_rate_usd=round(hourly_rate, 4),
        current_daily_cost_usd=round(daily_base_cost, 3),
        projected_monthly_cost_usd=round(monthly_base_cost, 2),
        utilized_daily_cost_usd=round(utilized_daily, 3),
        idle_waste_daily_cost_usd=round(idle_waste_daily, 3),
        idle_waste_monthly_cost_usd=round(idle_waste_monthly, 2),
        efficiency_score_pct=efficiency_score,
        recommended_instance_type=rightsized_inst,
        estimated_daily_savings_usd=daily_savings,
        estimated_monthly_savings_usd=monthly_savings,
        savings_percentage=savings_pct,
        cost_status=cost_status,
    )


def compute_scale_action_cost_impact(
    resource_id: str,
    recommendation_type: str,
    current_utilization: float,
    predicted_utilization: float,
    instance_type: Optional[str] = None
) -> Dict[str, Optional[str]]:
    cost_est = estimate_cost_metrics(
        resource_id=resource_id,
        current_utilization=current_utilization,
        predicted_utilization=predicted_utilization,
        instance_type=instance_type,
    )

    if recommendation_type == "SCALE_IN":
        if cost_est.estimated_daily_savings_usd and cost_est.recommended_instance_type:
            cost_impact = (
                f"Saves ~${cost_est.estimated_daily_savings_usd:.2f}/day "
                f"(${cost_est.estimated_monthly_savings_usd:.2f}/mo, -{cost_est.savings_percentage}%) "
                f"by rightsizing {cost_est.instance_type} -> {cost_est.recommended_instance_type}."
            )
        else:
            cost_impact = (
                f"Potential to eliminate up to ${cost_est.idle_waste_daily_cost_usd:.2f}/day "
                f"(${cost_est.idle_waste_monthly_cost_usd:.2f}/mo) in idle capacity waste."
            )
        reliability_impact = "No expected degradation: utilization remains well within safe operational headroom."

    elif recommendation_type == "SCALE_OUT":
        added_daily = cost_est.current_daily_cost_usd
        cost_impact = (
            f"Adds +${added_daily:.2f}/day (+${added_daily * 30.416:.2f}/mo) for additional capacity."
        )
        reliability_impact = "Prevents potential service degradation or SLA breach caused by forecasted load saturation."

    elif recommendation_type == "INVESTIGATE":
        cost_impact = f"Current baseline cost is ${cost_est.current_daily_cost_usd:.2f}/day; anomaly indicates potential inefficiency or abnormal load."
        reliability_impact = "Immediate investigation advised to protect system stability before taking automated scaling actions."

    elif recommendation_type == "MONITOR":
        cost_impact = f"Baseline cost stable at ${cost_est.current_daily_cost_usd:.2f}/day (waste: ${cost_est.idle_waste_daily_cost_usd:.2f}/day)."
        reliability_impact = "System operating within tolerance; telemetry tracked for emerging trends."

    else:
        cost_impact = f"Optimal cost performance (${cost_est.current_daily_cost_usd:.2f}/day, {cost_est.efficiency_score_pct:.1f}% utilized)."
        reliability_impact = "Normal operations; no reliability risk identified."

    return {
        "expected_cost_impact": cost_impact,
        "expected_reliability_impact": reliability_impact,
    }

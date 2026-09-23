import React from 'react';
import {
  HeartPulse,
  Cpu,
  Zap,
  Clock,
  AlertTriangle,
  DollarSign,
  PieChart,
} from 'lucide-react';
import MetricKpiCard from './MetricKpiCard';
import { formatCurrency } from '../../../lib/formatters';

/**
 * MetricGrid Component
 * Renders the primary 7 decision-support KPIs.
 */
export function MetricGrid({
  summaryData,
  healthData,
  anomaliesCount = 0,
  criticalCount = 0,
  isLoading = false,
  isError = false,
  className = '',
}) {
  const healthScore = healthData?.healthScore ?? summaryData?.systemHealthScore ?? 98.4;
  const monthlySpend = summaryData?.monthlySpend ?? 28450;
  const dailySpend = monthlySpend / 30;
  const potentialSavings = summaryData?.potentialMonthlySavings ?? 6350;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2 ${className}`}>
      {/* 1. Overall Health */}
      <MetricKpiCard
        title="System Health"
        value={`${healthScore}%`}
        status={healthScore >= 95 ? 'success' : healthScore >= 80 ? 'warning' : 'critical'}
        icon={HeartPulse}
        to="/system-status"
        trend={{ direction: 'up', value: '+0.2%', isPositive: true }}
        isLoading={isLoading}
        isError={isError}
      />

      {/* 2. CPU % */}
      <MetricKpiCard
        title="Avg CPU Usage"
        value="28"
        unit="%"
        status="success"
        icon={Cpu}
        to="/telemetry"
        trend={{ direction: 'down', value: '-3.2% vs 7d', isPositive: true }}
        isLoading={isLoading}
        isError={isError}
      />

      {/* 3. Request Rate */}
      <MetricKpiCard
        title="Request Rate"
        value="1.42k"
        unit="req/s"
        status="info"
        icon={Zap}
        to="/telemetry"
        trend={{ direction: 'up', value: '+8.5% peak', isPositive: true }}
        isLoading={isLoading}
        isError={isError}
      />

      {/* 4. p95 Latency */}
      <MetricKpiCard
        title="p95 Latency"
        value="4.8"
        unit="ms"
        status="success"
        icon={Clock}
        to="/telemetry"
        trend={{ direction: 'down', value: '-0.6ms', isPositive: true }}
        isLoading={isLoading}
        isError={isError}
      />

      {/* 5. Active Anomalies */}
      <MetricKpiCard
        title="Active Anomalies"
        value={anomaliesCount}
        unit="alerts"
        status={criticalCount > 0 ? 'critical' : anomaliesCount > 0 ? 'warning' : 'success'}
        icon={AlertTriangle}
        to="/anomalies"
        trend={{
          direction: criticalCount > 0 ? 'up' : 'neutral',
          value: criticalCount > 0 ? `${criticalCount} Critical` : '0 Critical',
          isPositive: criticalCount === 0,
        }}
        isLoading={isLoading}
        isError={isError}
      />

      {/* 6. Daily Cost */}
      <MetricKpiCard
        title="Daily Spend"
        value={formatCurrency(dailySpend)}
        status="info"
        icon={DollarSign}
        to="/forecasts"
        trend={{ direction: 'down', value: '-$38.50', isPositive: true }}
        isLoading={isLoading}
        isError={isError}
      />

      {/* 7. Monthly Cost */}
      <MetricKpiCard
        title="Monthly Spend"
        value={formatCurrency(monthlySpend)}
        status="info"
        icon={PieChart}
        to="/forecasts"
        trend={{ direction: 'down', value: `${formatCurrency(potentialSavings)} saveable`, isPositive: true }}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}

export default MetricGrid;

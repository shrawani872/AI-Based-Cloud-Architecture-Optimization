import React from 'react';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Skeleton } from '../../../components/feedback/Skeleton';

/**
 * TelemetryStatCards Component
 * Shows computed aggregate KPIs for the currently selected metric & time range.
 */
export function TelemetryStatCards({
  data = [],
  metricConfig,
  isLoading = false,
  className = '',
}) {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-2 ${className}`}>
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="p-3 bg-surface border border-border rounded-card space-y-1.5">
            <Skeleton width="40%" height={12} />
            <Skeleton width="70%" height={24} />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const key = metricConfig?.value || 'cpuUtilization';
  const unit = metricConfig?.unit || '';
  const threshold = metricConfig?.threshold;

  const values = data.map((d) => d[key]).filter((v) => v !== undefined && v !== null);
  const currentVal = values[values.length - 1] ?? 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 0;
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const avgVal = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 0;

  const hasBreachedThreshold = threshold && maxVal >= threshold;
  const hasActiveAnomalies = data.some((d) => d.isAnomaly);

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-2 ${className}`}>
      {/* 1. Latest Value */}
      <div className="p-3 bg-surface border border-border rounded-card">
        <span className="text-xs text-textMuted block mb-0.5">Latest Reading</span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-text">{currentVal}</span>
          <span className="text-xs font-semibold text-textMuted">{unit}</span>
        </div>
        <span className="text-[11px] text-textMuted block mt-0.5">Real-time CloudWatch stream</span>
      </div>

      {/* 2. Average in Period */}
      <div className="p-3 bg-surface border border-border rounded-card">
        <span className="text-xs text-textMuted block mb-0.5">Period Average</span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-text">{avgVal}</span>
          <span className="text-xs font-semibold text-textMuted">{unit}</span>
        </div>
        <span className="text-[11px] text-textMuted block mt-0.5">Calculated over active window</span>
      </div>

      {/* 3. Peak Maximum */}
      <div className="p-3 bg-surface border border-border rounded-card">
        <span className="text-xs text-textMuted block mb-0.5">Peak Maximum</span>
        <div className="flex items-baseline gap-1">
          <span className={`text-xl font-bold ${hasBreachedThreshold ? 'text-critical' : 'text-text'}`}>
            {maxVal}
          </span>
          <span className="text-xs font-semibold text-textMuted">{unit}</span>
        </div>
        <span className="text-[11px] text-textMuted block mt-0.5">
          {threshold ? `Alarm Threshold: ${threshold}${unit}` : `Min: ${minVal}${unit}`}
        </span>
      </div>

      {/* 4. Anomaly & SLA Status */}
      <div className="p-3 bg-surface border border-border rounded-card">
        <span className="text-xs text-textMuted block mb-0.5">Threshold / SLA Status</span>
        <div className="flex items-center gap-1.5 my-0.5">
          {hasActiveAnomalies ? (
            <div className="flex items-center gap-1 text-critical font-bold text-sm">
              <AlertTriangle className="w-2 h-2" />
              <span>Anomaly Detected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-success font-bold text-sm">
              <ShieldCheck className="w-2 h-2" />
              <span>Within Baseline</span>
            </div>
          )}
        </div>
        <span className="text-[11px] text-textMuted block mt-0.5">
          {hasActiveAnomalies ? 'Multi-variate z-score breach' : 'No metric alerts active'}
        </span>
      </div>
    </div>
  );
}

export default TelemetryStatCards;

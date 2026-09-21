import React from 'react';
import { TimeSeriesChart } from '../../../components/charts/TimeSeriesChart';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { METRIC_OPTIONS } from '../../../lib/mockData/telemetryMetrics';
import { Activity, AlertTriangle } from 'lucide-react';

/**
 * TelemetryChartSection Component
 * Displays the primary interactive TimeSeriesChart for the selected metric stream,
 * with threshold reference lines and anomaly markers.
 */
export function TelemetryChartSection({
  data = [],
  metricKey = 'cpuUtilization',
  isLoading = false,
  isError = false,
  onRetry,
  className = '',
}) {
  const metricConfig = METRIC_OPTIONS.find((m) => m.value === metricKey) || METRIC_OPTIONS[0];

  if (isLoading) {
    return (
      <div className={`p-4 bg-surface border border-border rounded-card h-80 flex flex-col justify-between ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton width="35%" height={16} />
          <Skeleton width="20%" height={16} />
        </div>
        <Skeleton width="100%" height={200} />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Telemetry Series"
        message="Unable to ingest live metric points from CloudWatch."
        onRetry={onRetry}
        className={className}
      />
    );
  }

  // Define chart series based on selected metric
  let chartSeries = [];
  if (metricKey === 'networkTraffic') {
    chartSeries = [
      { key: 'networkIn', name: 'Network In (KB/s)', color: 'var(--accent)', type: 'area' },
      { key: 'networkOut', name: 'Network Out (KB/s)', color: 'var(--info)', type: 'line', strokeDasharray: '3 3' },
    ];
  } else {
    chartSeries = [
      {
        key: metricConfig.value,
        name: metricConfig.label,
        color: metricConfig.color || 'var(--accent)',
        type: metricKey === 'cpuUtilization' || metricKey === 'memoryUtilization' ? 'area' : 'line',
      },
    ];
  }

  const thresholdConfig = metricConfig.threshold
    ? {
        y: metricConfig.threshold,
        label: `Alarm Threshold (${metricConfig.threshold}${metricConfig.unit})`,
        color: 'var(--critical)',
        strokeDasharray: '4 4',
      }
    : null;

  const anomalyPoints = data.filter((d) => d.isAnomaly);

  return (
    <div className={`p-3 bg-surface border border-border rounded-card space-y-2.5 ${className}`}>
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-input bg-accent/10 border border-accent/20 flex items-center justify-center text-accent flex-shrink-0">
            <Activity className="w-2 h-2" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-text">{metricConfig.label}</h3>
            <p className="text-[11px] text-textMuted">
              Continuous CloudWatch telemetry telemetry stream (sampled every step)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {anomalyPoints.length > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-input bg-critical/10 text-critical border border-critical/20 font-semibold text-[11px]">
              <AlertTriangle className="w-1.5 h-1.5" />
              <span>{anomalyPoints.length} Anomaly Spike Marker{anomalyPoints.length > 1 ? 's' : ''}</span>
            </span>
          )}
          {metricConfig.threshold && (
            <span className="px-1.5 py-0.5 rounded-input bg-bg border border-border text-textMuted text-[11px]">
              Critical Alert &gt; {metricConfig.threshold}{metricConfig.unit}
            </span>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <TimeSeriesChart
        data={data}
        series={chartSeries}
        xAxisKey="timestamp"
        height={260}
        thresholdLine={thresholdConfig}
        yAxisFormatter={(v) => `${v}${metricConfig.unit === '%' ? '%' : ''}`}
        tooltipFormatter={(val, name) => `${val} ${metricConfig.unit}`}
      />
    </div>
  );
}

export default TelemetryChartSection;

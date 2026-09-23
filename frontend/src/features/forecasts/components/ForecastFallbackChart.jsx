import React from 'react';
import { useMetrics } from '../../../hooks/useMetrics';
import { TimeSeriesChart } from '../../../components/charts/TimeSeriesChart';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Skeleton } from '../../../components/feedback/Skeleton';

/**
 * ForecastFallbackChart Component
 * Graceful degradation fallback: When the predictive forecast engine is unavailable,
 * renders an actuals-only historical telemetry chart with an explicit status banner.
 */
export function ForecastFallbackChart({
  resourceId = 'i-0a8b9c1d2e3f4g5',
  onRetry,
  className = '',
}) {
  const metricsQuery = useMetrics(resourceId, '24h');
  const metricsData = metricsQuery.data?.data || [];

  return (
    <div className={`p-4 bg-surface border border-warning/30 rounded-card space-y-3 ${className}`}>
      {/* Explicit Forecast Unavailable Banner */}
      <div className="p-2.5 bg-warning/10 border border-warning/30 rounded-input flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-2 h-2 text-warning flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-warning">
              ML Forecasting Service Unavailable
            </h4>
            <p className="text-[11px] text-textMuted">
              Predictive models could not be evaluated. Displaying raw 24-hour historical actuals stream instead.
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-btn text-xs font-semibold bg-warning text-white hover:bg-warning/90 transition-colors self-end sm:self-center"
          >
            <RotateCw className="w-1.5 h-1.5" />
            <span>Retry Forecast</span>
          </button>
        )}
      </div>

      {/* Historical Actuals Chart */}
      {metricsQuery.isLoading ? (
        <Skeleton height={260} />
      ) : (
        <TimeSeriesChart
          data={metricsData}
          xAxisKey="timestamp"
          height={260}
          series={[
            {
              key: 'cpuUtilization',
              name: 'Historical CPU Actuals (%)',
              color: 'var(--accent)',
              type: 'line',
            },
            {
              key: 'memoryUtilization',
              name: 'Historical Memory Actuals (%)',
              color: 'var(--info)',
              type: 'line',
              strokeDasharray: '3 3',
            },
          ]}
        />
      )}
    </div>
  );
}

export default ForecastFallbackChart;

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import { formatCurrency } from '../../lib/formatters';

/**
 * ForecastChart Component
 * Renders actual historical spend (solid line) vs projected forecast (dashed lines)
 * with a shaded 95% confidence interval uncertainty area band.
 */
export function ForecastChart({
  series = [],
  height = 320,
  showLegend = true,
  className = '',
}) {
  if (!series || series.length === 0) {
    return (
      <div
        style={{ height }}
        className={`flex items-center justify-center text-xs text-textMuted border border-border/40 rounded-input bg-bg/50 ${className}`}
      >
        No forecasting points available
      </div>
    );
  }

  const tooltipFormatter = (val, name) => {
    if (val === null || val === undefined) return '—';
    return formatCurrency(val);
  };

  // Calculate dynamic forecast trend description for screen readers
  const actualPoints = series.filter((d) => d.actual !== null && d.actual !== undefined);
  const forecastPoints = series.filter((d) => d.forecast !== null && d.forecast !== undefined);

  let forecastDescription = `Workload and cost forecast chart spanning ${series.length} intervals.`;
  if (actualPoints.length > 0 && forecastPoints.length > 0) {
    const latestActual = actualPoints[actualPoints.length - 1]?.actual;
    const finalForecast = forecastPoints[forecastPoints.length - 1]?.forecast;
    const diff = finalForecast - latestActual;
    const pctChange = latestActual ? Math.round((diff / latestActual) * 100) : 0;
    const direction = Math.abs(pctChange) < 2 ? 'stabilizing' : pctChange > 0 ? 'projected to rise' : 'projected to decline';
    forecastDescription = `Forecast chart: ${actualPoints.length} historical actual days recorded ending at ${formatCurrency(latestActual)}. Future workload is ${direction} to ${formatCurrency(finalForecast)} (${pctChange >= 0 ? '+' : ''}${pctChange}%) over ${forecastPoints.length} forward horizon days with 95% confidence interval.`;
  }

  return (
    <div
      role="region"
      aria-label={forecastDescription}
      className={`w-full ${className}`}
      style={{ height, minHeight: height }}
    >
      <p className="sr-only">{forecastDescription}</p>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={series}
          margin={{ top: 12, right: 16, left: -8, bottom: 4 }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            strokeOpacity={0.6}
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={{ stroke: 'var(--border)' }}
            dy={4}
          />

          <YAxis
            tickFormatter={(val) => `$${val}`}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={{ stroke: 'var(--border)' }}
            dx={-4}
          />

          <Tooltip content={<ChartTooltip formatter={tooltipFormatter} />} />

          {showLegend && (
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
              formatter={(value) => (
                <span className="text-text text-xs mr-2 font-medium">{value}</span>
              )}
            />
          )}

          {/* Shaded 95% Confidence Interval Area */}
          <Area
            type="monotone"
            dataKey="upperBoundCost"
            stroke="none"
            fill="var(--warning)"
            fillOpacity={0.12}
            name="95% Confidence Band"
            legendType="none"
          />

          {/* 1. Actual Historical Spend (Solid Line) */}
          <Line
            type="monotone"
            dataKey="actualCost"
            name="Historical Actual Spend"
            stroke="var(--accent)"
            strokeWidth={2.5}
            dot={{ r: 2, fill: 'var(--accent)' }}
            activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }}
            connectNulls={false}
          />

          {/* 2. Predicted Baseline Spend (Dashed Line) */}
          <Line
            type="monotone"
            dataKey="predictedCost"
            name="Forecast Baseline (Unoptimized)"
            stroke="var(--warning)"
            strokeWidth={2}
            strokeDasharray="4 4" // Dashed line per requirement
            dot={false}
            activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }}
            connectNulls
          />

          {/* 3. With AI Recommendations (Dashed Line) */}
          <Line
            type="monotone"
            dataKey="optimizedCost"
            name="Optimized Forecast (With AI Suggestions)"
            stroke="var(--success)"
            strokeWidth={2}
            strokeDasharray="2 2" // Distinct dash style
            dot={false}
            activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ForecastChart;

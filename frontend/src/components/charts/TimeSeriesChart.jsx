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
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import ChartTooltip from './ChartTooltip';

/**
 * Custom Anomaly Dot Marker
 */
const renderCustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload || !payload.isAnomaly) {
    return null;
  }

  return (
    <g key={`anomaly-dot-${payload.timestamp}`}>
      <circle
        cx={cx}
        cy={cy}
        r={7}
        fill="var(--critical)"
        fillOpacity={0.25}
        className="animate-ping"
      />
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="var(--critical)"
        stroke="var(--surface)"
        strokeWidth={2}
      />
    </g>
  );
};

/**
 * TimeSeriesChart Component
 * Reusable Recharts wrapper supporting:
 * - Minimal subtle gridlines
 * - Threshold reference lines (e.g. 80% CPU breach threshold)
 * - Anomaly point indicators
 * - Solid lines, dashed lines, shaded confidence area bands
 *
 * @param {Object} props
 * @param {Array<Object>} props.data - Time series data array
 * @param {Array<{ key: string, name: string, color: string, type?: 'line' | 'area', strokeDasharray?: string, unit?: string }>} props.series - Series definitions
 * @param {string} [props.xAxisKey='timestamp'] - Key for X-axis timestamps
 * @param {(val: any) => string} [props.xAxisFormatter] - X-axis tick formatter
 * @param {(val: any) => string} [props.yAxisFormatter] - Y-axis tick formatter
 * @param {string|number} [props.height=260] - Height of chart
 * @param {boolean} [props.showLegend=true]
 * @param {boolean} [props.showGrid=true]
 * @param {string} [props.confidenceAreaKey] - Optional key for confidence upper bound
 * @param {Object} [props.thresholdLine] - { y: number, label: string, color?: string, strokeDasharray?: string }
 * @param {string} [props.className]
 */
export function TimeSeriesChart({
  data = [],
  series = [],
  xAxisKey = 'timestamp',
  xAxisFormatter,
  yAxisFormatter,
  height = 240,
  showLegend = true,
  showGrid = true,
  confidenceAreaKey,
  thresholdLine,
  tooltipFormatter,
  className = '',
}) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className={`flex items-center justify-center text-xs text-textMuted border border-border/40 rounded-input bg-bg/50 ${className}`}
      >
        No time-series data available
      </div>
    );
  }

  const defaultXFormatter = (val) => {
    if (!val) return '';
    if (val.includes('T')) {
      const d = new Date(val);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    return val;
  };

  // Calculate dynamic trend description for screen readers and accessibility
  const primaryLineKey = series[0]?.key || (data[0] ? Object.keys(data[0]).find((k) => k !== xAxisKey && typeof data[0][k] === 'number') : null);
  const numericValues = primaryLineKey ? data.map((d) => d[primaryLineKey]).filter((v) => typeof v === 'number' && !isNaN(v)) : [];

  let trendDescription = `Time-series chart showing ${data.length} telemetry data points.`;
  if (numericValues.length >= 2) {
    const firstVal = numericValues[0];
    const lastVal = numericValues[numericValues.length - 1];
    const minVal = Math.min(...numericValues);
    const maxVal = Math.max(...numericValues);
    const metricName = series[0]?.name || primaryLineKey;
    const diff = lastVal - firstVal;
    const pctChange = firstVal !== 0 ? Math.round((diff / firstVal) * 100) : 0;
    const direction = Math.abs(diff) < 0.5 ? 'stable' : diff > 0 ? 'increasing' : 'decreasing';
    trendDescription = `${metricName} telemetry trend: currently ${direction} at ${lastVal} (started at ${firstVal}, ${pctChange >= 0 ? '+' : ''}${pctChange}% change). Range: ${minVal} to ${maxVal} across ${data.length} intervals.`;
  }

  return (
    <div
      role="region"
      aria-label={trendDescription}
      className={`w-full ${className}`}
      style={{ height, minHeight: height }}
    >
      <p className="sr-only">{trendDescription}</p>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 12, right: 16, left: -14, bottom: 4 }}
        >
          {showGrid && (
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              strokeOpacity={0.6}
              vertical={false}
            />
          )}

          <XAxis
            dataKey={xAxisKey}
            tickFormatter={xAxisFormatter || defaultXFormatter}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={{ stroke: 'var(--border)' }}
            dy={4}
          />

          <YAxis
            tickFormatter={yAxisFormatter || ((v) => `${v}`)}
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
              wrapperStyle={{ paddingBottom: 8, fontSize: 11 }}
              formatter={(value) => (
                <span className="text-text text-xs mr-2 font-medium">{value}</span>
              )}
            />
          )}

          {/* Optional Threshold Reference Line */}
          {thresholdLine && thresholdLine.y !== undefined && (
            <ReferenceLine
              y={thresholdLine.y}
              stroke={thresholdLine.color || 'var(--critical)'}
              strokeDasharray={thresholdLine.strokeDasharray || '3 3'}
              strokeWidth={1.5}
              label={{
                value: thresholdLine.label || `Threshold (${thresholdLine.y})`,
                fill: thresholdLine.color || 'var(--critical)',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
          )}

          {/* Optional Confidence Interval Area */}
          {confidenceAreaKey && (
            <Area
              type="monotone"
              dataKey={confidenceAreaKey}
              stroke="none"
              fill="var(--accent)"
              fillOpacity={0.12}
              name="95% Confidence Band"
              legendType="none"
            />
          )}

          {/* Series definitions */}
          {series.map((s) => {
            if (s.type === 'area') {
              return (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  strokeDasharray={s.strokeDasharray}
                  dot={renderCustomDot}
                  activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }}
                />
              );
            }

            return (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.strokeDasharray}
                dot={renderCustomDot}
                activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }}
                connectNulls
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TimeSeriesChart;

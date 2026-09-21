import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

/**
 * Custom tooltip for outcome comparison chart
 */
function OutcomeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-card px-2.5 py-2 shadow-sm text-xs">
      <p className="font-semibold text-text mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 py-0.5">
          <span
            className="inline-block w-2 h-2 rounded-sm flex-shrink-0"
            style={{
              background: entry.name.includes('Actual') ? 'none' : entry.fill,
              border: entry.name.includes('Actual') ? `2px solid ${entry.stroke}` : 'none',
              borderStyle: entry.name.includes('Actual') ? 'dashed' : 'solid',
            }}
          />
          <span className="text-textMuted">{entry.name}:</span>
          <span className="font-semibold text-text">${Number(entry.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * OutcomeComparisonChart
 * Bar = Predicted monthly cost (solid fill)
 * Line = Actual monthly cost (dashed stroke, distinct shape)
 * Distinguished by both shape/pattern AND label — never color alone.
 *
 * @param {{ data: Array<{month, predicted, actual}>, height?: number }} props
 */
export function OutcomeComparisonChart({ data = [], height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-textMuted border border-border/40 rounded-input bg-bg/50"
      >
        No outcome data available
      </div>
    );
  }

  // Calculate dynamic outcome comparison summary for screen readers
  const totalPredicted = data.reduce((sum, item) => sum + (Number(item.predicted) || 0), 0);
  const totalActual = data.reduce((sum, item) => sum + (Number(item.actual) || 0), 0);
  const netDiff = totalPredicted - totalActual;
  const outcomeDescription = `Outcome comparison chart over ${data.length} months. Total predicted cost: $${totalPredicted.toFixed(2)}, total actual realized spend: $${totalActual.toFixed(2)}, resulting in a ${netDiff >= 0 ? `$${netDiff.toFixed(2)} under-budget savings` : `$${Math.abs(netDiff).toFixed(2)} cost variance`}.`;

  return (
    <div
      role="region"
      aria-label={outcomeDescription}
      style={{ height, minHeight: height }}
      className="w-full"
    >
      <p className="sr-only">{outcomeDescription}</p>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 4 }}>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            dx={-4}
          />
          <Tooltip content={<OutcomeTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: 6, fontSize: 11 }}
            formatter={(value) => (
              <span className="text-text text-xs font-medium mr-2">{value}</span>
            )}
          />

          {/* Predicted — solid bar (shape distinction #1) */}
          <Bar
            dataKey="predicted"
            name="▩ Predicted Cost"
            fill="var(--accent)"
            fillOpacity={0.25}
            radius={[3, 3, 0, 0]}
            maxBarSize={48}
          />

          {/* Actual — dashed line + dots (shape distinction #2) */}
          <Line
            type="monotone"
            dataKey="actual"
            name="◇ Actual Cost"
            stroke="var(--success)"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 4, fill: 'var(--surface)', stroke: 'var(--success)', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: 'var(--success)', stroke: 'var(--surface)', strokeWidth: 2 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default OutcomeComparisonChart;

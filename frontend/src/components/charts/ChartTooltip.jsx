import React from 'react';

/**
 * Custom Tooltip for Recharts
 * Adapts to active CSS theme tokens (bg, surface, border, text).
 */
export function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="p-2 bg-surface/95 backdrop-blur-xs border border-border rounded-input shadow-sm text-xs space-y-1 z-50">
      {label && (
        <div className="font-semibold text-text border-b border-border pb-1 mb-1">
          {label}
        </div>
      )}
      <div className="space-y-0.5">
        {payload.map((entry, index) => {
          if (entry.value === null || entry.value === undefined) return null;
          const formattedValue = formatter
            ? formatter(entry.value, entry.name, entry)
            : entry.value;

          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color || 'var(--accent)' }}
                />
                <span className="text-textMuted text-[11px]">{entry.name}:</span>
              </div>
              <span className="font-medium text-text">{formattedValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ChartTooltip;

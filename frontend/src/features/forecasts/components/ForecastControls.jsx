import React from 'react';
import { Select } from '../../../components/ui/Select';
import { RotateCw, Calendar, Sparkles } from 'lucide-react';
import { mockForecastResources } from '../../../lib/mockData/forecasts';

const HORIZON_OPTIONS = [
  { id: '7d', label: '7 Days (Short-Term)' },
  { id: '30d', label: '30 Days (Standard Monthly)' },
  { id: '90d', label: '90 Days (Quarterly Outlook)' },
];

/**
 * ForecastControls Component
 * Controls resource selection, prediction horizon pills, and manual model recomputation trigger.
 */
export function ForecastControls({
  selectedResourceId,
  onResourceChange,
  selectedHorizon,
  onHorizonChange,
  onRecompute,
  isRecomputing = false,
  className = '',
}) {
  const resourceOptions = mockForecastResources.map((r) => ({
    value: r.id,
    label: `${r.name} (${r.service})`,
  }));

  return (
    <div className={`p-3 bg-surface border border-border rounded-card flex flex-col md:flex-row md:items-center justify-between gap-3 ${className}`}>
      {/* Resource Target Dropdown */}
      <div className="w-full md:w-80">
        <Select
          label="Forecast Target Resource / Scope"
          value={selectedResourceId}
          onChange={onResourceChange}
          options={resourceOptions}
        />
      </div>

      {/* Horizon Selector Pill Group */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-textMuted">Prediction Horizon</span>
        <div
          className="inline-flex items-center p-0.5 rounded-input bg-bg border border-border"
          role="group"
          aria-label="Forecast horizon selector"
        >
          {HORIZON_OPTIONS.map((h) => {
            const isActive = selectedHorizon === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => onHorizonChange(h.id)}
                aria-pressed={isActive}
                className={`px-2.5 py-1 rounded-btn text-xs font-medium transition-colors duration-fast ${
                  isActive
                    ? 'bg-accent text-white font-bold shadow-xs'
                    : 'text-textMuted hover:text-text hover:bg-surface'
                }`}
              >
                {h.label.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recompute Forecast Mutation Button */}
      <div className="flex items-end self-end md:self-center">
        <button
          type="button"
          onClick={onRecompute}
          disabled={isRecomputing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-bold bg-accent hover:bg-accentHover text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors disabled:opacity-50 shadow-xs"
        >
          <RotateCw className={`w-1.5 h-1.5 ${isRecomputing ? 'animate-spin' : ''}`} />
          <span>{isRecomputing ? 'Recomputing Model...' : 'Recompute Forecast'}</span>
        </button>
      </div>
    </div>
  );
}

export default ForecastControls;

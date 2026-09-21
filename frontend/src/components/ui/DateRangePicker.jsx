import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';

const PRESETS = [
  { id: '1h', label: '1h' },
  { id: '6h', label: '6h' },
  { id: '24h', label: '24h' },
  { id: '7d', label: '7d' },
  { id: 'custom', label: 'Custom' },
];

/**
 * DateRangePicker Component
 * Allows selecting standard time window presets or custom start/end timestamps.
 * @param {Object} props
 * @param {{ preset: string, startDate?: string, endDate?: string }} props.value
 * @param {(val: { preset: string, startDate?: string, endDate?: string }) => void} props.onChange
 * @param {string} [props.className]
 */
export function DateRangePicker({
  value = { preset: '24h' },
  onChange,
  className = '',
}) {
  const [isCustomOpen, setIsCustomOpen] = useState(value.preset === 'custom');

  const handlePresetSelect = (presetId) => {
    if (presetId === 'custom') {
      setIsCustomOpen(true);
      onChange?.({
        preset: 'custom',
        startDate: value.startDate || new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 16),
        endDate: value.endDate || new Date().toISOString().slice(0, 16),
      });
    } else {
      setIsCustomOpen(false);
      onChange?.({ preset: presetId });
    }
  };

  const handleCustomDateChange = (field, val) => {
    onChange?.({
      ...value,
      preset: 'custom',
      [field]: val,
    });
  };

  return (
    <div className={`inline-flex flex-col gap-1.5 ${className}`}>
      {/* Preset Pill Buttons */}
      <div
        className="inline-flex items-center p-0.5 rounded-input bg-surface border border-border"
        role="group"
        aria-label="Time range selector"
      >
        <span className="pl-1.5 pr-1 text-textMuted flex items-center">
          <Clock className="w-1.5 h-1.5" aria-hidden="true" />
        </span>
        {PRESETS.map((preset) => {
          const isActive = value.preset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.id)}
              aria-pressed={isActive}
              className={`px-2 py-1 rounded-btn text-xs font-medium transition-colors duration-fast ${
                isActive
                  ? 'bg-accent text-white font-semibold shadow-xs'
                  : 'text-textMuted hover:text-text hover:bg-bg'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Custom Date Inputs Dropdown / Collapsible */}
      {isCustomOpen && (
        <div className="flex items-center gap-1.5 p-1.5 bg-surface border border-border rounded-input text-xs animate-fade-in flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-textMuted text-[11px]">From:</span>
            <input
              type="datetime-local"
              value={value.startDate || ''}
              onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
              className="px-1.5 py-0.5 bg-bg border border-border rounded-input text-xs text-text focus-visible:ring-1 focus-visible:ring-accent outline-none"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-textMuted text-[11px]">To:</span>
            <input
              type="datetime-local"
              value={value.endDate || ''}
              onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
              className="px-1.5 py-0.5 bg-bg border border-border rounded-input text-xs text-text focus-visible:ring-1 focus-visible:ring-accent outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default DateRangePicker;

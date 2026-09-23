import React from 'react';
import { Select } from '../../../components/ui/Select';
import { DateRangePicker } from '../../../components/ui/DateRangePicker';
import { StatusChip } from '../../../components/feedback/StatusChip';
import { METRIC_OPTIONS } from '../../../lib/mockData/telemetryMetrics';
import { Layers, Activity, Calendar } from 'lucide-react';

/**
 * TelemetryFilterBar Component
 * Control bar for selecting AWS Resource, Metric Stream, and Time Window.
 */
export function TelemetryFilterBar({
  resources = [],
  selectedResourceId,
  onResourceChange,
  selectedMetricKey,
  onMetricChange,
  rangeValue,
  onRangeChange,
  className = '',
}) {
  const currentResource = resources.find((r) => r.id === selectedResourceId) || resources[0];

  const resourceOptions = resources.map((r) => ({
    value: r.id,
    label: `${r.name} (${r.service})`,
  }));

  return (
    <div className={`p-3 bg-surface border border-border rounded-card space-y-2.5 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Resource Selector */}
        <div className="w-full md:w-72">
          <Select
            label="AWS Resource Target"
            value={selectedResourceId}
            onChange={onResourceChange}
            options={resourceOptions}
          />
        </div>

        {/* Metric Selector */}
        <div className="w-full md:w-64">
          <Select
            label="Telemetry Metric Stream"
            value={selectedMetricKey}
            onChange={onMetricChange}
            options={METRIC_OPTIONS}
          />
        </div>

        {/* Range Selector */}
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <span className="text-xs font-medium text-textMuted">Time Window</span>
          <DateRangePicker
            value={rangeValue}
            onChange={onRangeChange}
          />
        </div>
      </div>

      {/* Selected Resource Metadata Strip */}
      {currentResource && (
        <div className="pt-2 border-t border-border flex items-center justify-between gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text">{currentResource.name}</span>
            <span className="font-mono text-textMuted text-[11px]">{currentResource.id}</span>
            <span className="px-1.5 py-0.2 rounded-input bg-bg border border-border text-[11px] font-medium">
              {currentResource.service} • {currentResource.instanceType}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-textMuted">Region: <strong>{currentResource.region || 'us-east-1'}</strong></span>
            <StatusChip status={currentResource.status?.toLowerCase() || 'healthy'} />
          </div>
        </div>
      )}
    </div>
  );
}

export default TelemetryFilterBar;

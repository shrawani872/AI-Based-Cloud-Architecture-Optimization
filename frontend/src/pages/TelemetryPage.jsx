import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import {
  TelemetryFilterBar,
  TelemetryStatCards,
  TelemetryChartSection,
  TelemetryDataTable,
} from '../features/telemetry';
import { useMetrics, useTelemetryResources } from '../hooks';
import { METRIC_OPTIONS } from '../lib/mockData/telemetryMetrics';
import { RotateCw, Activity } from 'lucide-react';

export default function TelemetryPage() {
  const [selectedResourceId, setSelectedResourceId] = useState('i-0a8b9c1d2e3f4g5');
  const [selectedMetricKey, setSelectedMetricKey] = useState('cpuUtilization');
  const [rangeValue, setRangeValue] = useState({ preset: '24h' });

  // 1. Fetch available resources and metrics
  const resourcesQuery = useTelemetryResources();
  const resources = resourcesQuery.data || [];

  // 2. Fetch live metrics for selected resource & range
  const metricsQuery = useMetrics(selectedResourceId, rangeValue.preset || '24h');
  const telemetryData = metricsQuery.data?.data || [];

  const selectedMetricConfig =
    METRIC_OPTIONS.find((m) => m.value === selectedMetricKey) || METRIC_OPTIONS[0];

  return (
    <div className="space-y-3 pb-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Telemetry & Metrics"
        subtitle="High-resolution AWS CloudWatch metric streams, threshold breaches, and continuous resource telemetry."
        badge={
          <span className="px-1.5 py-0.5 rounded-input bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold">
            Multi-Resource Ingest
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => metricsQuery.refetch()}
            disabled={metricsQuery.isFetching}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-btn text-xs font-medium bg-surface border border-border text-text hover:bg-bg hover:border-accent transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-1.5 h-1.5 text-accent ${metricsQuery.isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh Stream</span>
          </button>
        }
      />

      {/* 2. Target Resource, Metric & Range Selectors */}
      <TelemetryFilterBar
        resources={resources}
        selectedResourceId={selectedResourceId}
        onResourceChange={setSelectedResourceId}
        selectedMetricKey={selectedMetricKey}
        onMetricChange={setSelectedMetricKey}
        rangeValue={rangeValue}
        onRangeChange={setRangeValue}
      />

      {/* 3. Metric Aggregates & Threshold Status Cards */}
      <TelemetryStatCards
        data={telemetryData}
        metricConfig={selectedMetricConfig}
        isLoading={metricsQuery.isLoading}
      />

      {/* 4. Main Telemetry TimeSeries Chart with Threshold Line & Anomaly Markers */}
      <TelemetryChartSection
        data={telemetryData}
        metricKey={selectedMetricKey}
        isLoading={metricsQuery.isLoading}
        isError={metricsQuery.isError}
        onRetry={() => metricsQuery.refetch()}
      />

      {/* 5. Raw Data Observations Table with Downsampling & Pagination */}
      {!metricsQuery.isError && (
        <TelemetryDataTable
          rawData={telemetryData}
          range={rangeValue.preset || '24h'}
          pageSize={10}
        />
      )}
    </div>
  );
}

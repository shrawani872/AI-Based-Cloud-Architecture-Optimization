import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { ForecastChart } from '../components/charts/ForecastChart';
import {
  ForecastControls,
  ForecastModelMetrics,
  ForecastFallbackChart,
} from '../features/forecasts';
import { useForecast, useRecomputeForecast } from '../hooks/useForecast';
import { useToast } from '../hooks/useToast';
import { EmptyState } from '../components/feedback/EmptyState';
import { Skeleton } from '../components/feedback/Skeleton';
import { formatCurrency } from '../lib/formatters';
import { TrendingUp, Database, Sparkles, AlertCircle } from 'lucide-react';

export default function ForecastsPage() {
  const toast = useToast();
  const [selectedResourceId, setSelectedResourceId] = useState('global-cloud');
  const [selectedHorizon, setSelectedHorizon] = useState('30d');

  // 1. Fetch predictive forecast query
  const forecastQuery = useForecast(selectedResourceId, selectedHorizon);
  const forecastData = forecastQuery.data;

  // 2. Recompute mutation
  const recomputeMutation = useRecomputeForecast();

  const handleRecompute = async () => {
    try {
      await recomputeMutation.mutateAsync({
        resourceId: selectedResourceId,
        horizon: selectedHorizon,
      });
      toast.success('Forecasting model recomputed with latest telemetry stream.');
    } catch (err) {
      toast.error(err.message || 'Failed to recompute forecast');
    }
  };

  const hasInsufficientHistory = forecastData?.hasInsufficientHistory;

  return (
    <div className="space-y-3 pb-6">
      {/* 1. Header */}
      <PageHeader
        title="Capacity & Cost Forecasting"
        subtitle="Predictive resource consumption models, multi-variate trend extrapolations, and projected cost savings with 95% confidence intervals."
        badge={
          <span className="px-1.5 py-0.5 rounded-input bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold">
            Prophet-LSTM Engine
          </span>
        }
      />

      {/* 2. Controls (Resource, Horizon, Recompute) */}
      <ForecastControls
        selectedResourceId={selectedResourceId}
        onResourceChange={setSelectedResourceId}
        selectedHorizon={selectedHorizon}
        onHorizonChange={setSelectedHorizon}
        onRecompute={handleRecompute}
        isRecomputing={recomputeMutation.isPending}
      />

      {/* 3. ML Model Performance Metrics & Input Freshness */}
      <ForecastModelMetrics
        modelName={forecastData?.modelName}
        modelVersion={forecastData?.modelVersion}
        accuracyMetrics={forecastData?.accuracyMetrics}
        telemetryFreshness={forecastData?.telemetryFreshness}
        isLoading={forecastQuery.isLoading}
      />

      {/* 4. Main Projection Visual Canvas */}
      {hasInsufficientHistory ? (
        /* Insufficient History Empty State */
        <EmptyState
          icon={Database}
          title="Insufficient Historical Telemetry Data"
          description={`At least 7 days of continuous CloudWatch telemetry are required to train the predictive forecasting model for "${selectedResourceId}". Only ${forecastData.actualHistoryDays || 2} days are currently available.`}
          className="p-8"
        />
      ) : forecastQuery.isError ? (
        /* Graceful Fallback on Failure (Never blank!) */
        <ForecastFallbackChart
          resourceId={selectedResourceId}
          onRetry={() => forecastQuery.refetch()}
        />
      ) : forecastQuery.isLoading ? (
        <div className="p-4 bg-surface border border-border rounded-card h-96 flex flex-col justify-between">
          <Skeleton width="40%" height={16} />
          <Skeleton width="100%" height={260} />
        </div>
      ) : (
        <div className="p-3 bg-surface border border-border rounded-card space-y-2.5">
          {/* Chart Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-input bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <TrendingUp className="w-2 h-2" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text">
                  Workload Spend Trajectory ({selectedHorizon.toUpperCase()} Forecast)
                </h3>
                <p className="text-[11px] text-textMuted">
                  Comparing current unoptimized trajectory vs AI-optimized workload with 95% confidence bands
                </p>
              </div>
            </div>

            {/* Savings Projection Badge */}
            {forecastData?.summary?.projectedNetSavings && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-input bg-success/10 border border-success/20 text-success text-xs font-bold">
                <Sparkles className="w-1.5 h-1.5" />
                <span>Saveable: {formatCurrency(forecastData.summary.projectedNetSavings)} ({selectedHorizon})</span>
              </div>
            )}
          </div>

          {/* Recharts Forecast Curve */}
          <ForecastChart
            series={forecastData?.series || []}
            height={300}
          />

          {/* Bottom Horizon Summary Cards */}
          {forecastData?.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border">
              <div className="p-2 bg-bg border border-border rounded-input">
                <span className="text-[11px] text-textMuted block">Current Monthly Spend</span>
                <span className="text-sm font-bold text-text">
                  {formatCurrency(forecastData.summary.currentMonthlySpend)}
                </span>
              </div>
              <div className="p-2 bg-bg border border-border rounded-input">
                <span className="text-[11px] text-textMuted block">Projected Unoptimized Spend</span>
                <span className="text-sm font-bold text-warning">
                  {formatCurrency(forecastData.summary.forecastedUnoptimizedSpend)}
                </span>
              </div>
              <div className="p-2 bg-bg border border-border rounded-input">
                <span className="text-[11px] text-textMuted block">Projected AI-Optimized Spend</span>
                <span className="text-sm font-bold text-success">
                  {formatCurrency(forecastData.summary.forecastedOptimizedSpend)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

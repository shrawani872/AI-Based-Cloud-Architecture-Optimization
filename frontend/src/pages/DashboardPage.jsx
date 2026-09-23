import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  RotateCw,
  Sparkles,
  TrendingUp,
  Activity,
  History,
  AlertTriangle,
  Server,
  Layers,
} from 'lucide-react';

import { PageHeader } from '../components/layout/PageHeader';
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart';
import { ErrorState } from '../components/feedback/ErrorState';
import { Skeleton } from '../components/feedback/Skeleton';
import { EmptyState } from '../components/feedback/EmptyState';

import {
  MetricGrid,
  AnomalyBanner,
  DashboardRecommendationCard,
  RecentOutcomesList,
} from '../features/dashboard';

import {
  useDashboardSummary,
  useAnomalies,
  useRecommendations,
  useSystemHealth,
  useMetrics,
  useForecast,
  useHistory,
} from '../hooks';

import { formatCurrency, formatTimestamp } from '../lib/formatters';

export default function DashboardPage() {
  const queryClient = useQueryClient();

  // 1. Data queries with independent error states
  const summaryQuery = useDashboardSummary();
  const anomaliesQuery = useAnomalies();
  const recommendationsQuery = useRecommendations();
  const healthQuery = useSystemHealth();
  const metricsQuery = useMetrics('i-0a8b9c1d2e3f4g5', '24h');
  const forecastQuery = useForecast('global-cloud', '30d');
  const historyQuery = useHistory();

  const handleRefreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    await queryClient.invalidateQueries({ queryKey: ['anomalies'] });
    await queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    await queryClient.invalidateQueries({ queryKey: ['system', 'health'] });
    await queryClient.invalidateQueries({ queryKey: ['telemetry'] });
    await queryClient.invalidateQueries({ queryKey: ['forecasts'] });
    await queryClient.invalidateQueries({ queryKey: ['history'] });
  };

  const anomaliesList = anomaliesQuery.data || [];
  const criticalAnomaliesCount = anomaliesList.filter((a) => a.severity === 'CRITICAL').length;
  const pendingRecommendations = (recommendationsQuery.data || []).filter(
    (r) => r.status === 'PENDING'
  );
  const topRecommendations = (recommendationsQuery.data || []).slice(0, 3);

  return (
    <div className="space-y-3 pb-6">
      {/* 1. Header with Refresh Action */}
      <PageHeader
        title="Dashboard"
        subtitle="Live AWS infrastructure telemetry, predictive cost forecasts, anomaly detection, and AI recommendations."
        badge={
          <span className="px-1.5 py-0.5 rounded-input bg-success/10 border border-success/20 text-success text-[11px] font-semibold">
            Telemetry Stream Active
          </span>
        }
        actions={
          <button
            type="button"
            onClick={handleRefreshAll}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-btn text-xs font-medium bg-surface border border-border text-text hover:bg-bg hover:border-accent transition-colors"
          >
            <RotateCw className="w-1.5 h-1.5 text-accent" />
            <span>Refresh Dashboard</span>
          </button>
        }
      />

      {/* 2. Anomaly Alert Banner (Conditional: shows only if HIGH or CRITICAL anomalies exist) */}
      {anomaliesQuery.isError ? (
        <ErrorState
          title="Anomaly Detection Engine Offline"
          message="Unable to verify active incident alarms."
          onRetry={() => anomaliesQuery.refetch()}
          isStale={true}
        />
      ) : (
        <AnomalyBanner anomalies={anomaliesList} />
      )}

      {/* 3. Primary 7-KPI Grid (Fails independently) */}
      {summaryQuery.isError && healthQuery.isError ? (
        <ErrorState
          title="Failed to Load Executive KPIs"
          message="Executive telemetry summary metrics are currently unavailable."
          onRetry={() => {
            summaryQuery.refetch();
            healthQuery.refetch();
          }}
        />
      ) : (
        <MetricGrid
          summaryData={summaryQuery.data}
          healthData={healthQuery.data}
          anomaliesCount={anomaliesList.length}
          criticalCount={criticalAnomaliesCount}
          isLoading={summaryQuery.isLoading || healthQuery.isLoading}
          isError={summaryQuery.isError}
        />
      )}

      {/* 4. Main Charts Section (3 Independent Panels) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Chart A: Workload Actual vs Forecast (with 95% Confidence Band & Solid vs Dashed curves) */}
        <div className="lg:col-span-2 p-3 bg-surface border border-border rounded-card space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-input bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <TrendingUp className="w-2 h-2" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text">
                  Workload & Cost Projection (30-Day Forecast)
                </h3>
                <p className="text-[11px] text-textMuted">
                  Historical spend (solid) vs Predicted trend (dashed) with 95% confidence interval
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-accent hidden sm:inline">
              Model: Prophet-LSTM
            </span>
          </div>

          {forecastQuery.isLoading ? (
            <div className="h-60 flex items-center justify-center">
              <Skeleton width="100%" height={220} />
            </div>
          ) : forecastQuery.isError ? (
            <ErrorState
              title="Forecast Model Stream Error"
              message="Could not compute 30-day forecast projection."
              onRetry={() => forecastQuery.refetch()}
            />
          ) : (
            <TimeSeriesChart
              data={forecastQuery.data?.series || []}
              xAxisKey="date"
              height={230}
              confidenceAreaKey="upperBoundCost"
              tooltipFormatter={(val, name) => `${formatCurrency(val)}`}
              yAxisFormatter={(val) => `$${val}`}
              series={[
                {
                  key: 'actualCost',
                  name: 'Actual Spend (Daily)',
                  color: 'var(--accent)',
                  type: 'line',
                },
                {
                  key: 'predictedCost',
                  name: 'Predicted Baseline',
                  color: 'var(--warning)',
                  type: 'line',
                  strokeDasharray: '4 4', // Dashed line to distinguish forecast
                },
                {
                  key: 'optimizedCost',
                  name: 'With AI Recommendations',
                  color: 'var(--success)',
                  type: 'line',
                  strokeDasharray: '2 2', // Alternate dashed style
                },
              ]}
            />
          )}
        </div>

        {/* Chart B: Multi-metric CPU & Memory Utilization */}
        <div className="p-3 bg-surface border border-border rounded-card space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-input bg-success/10 border border-success/20 flex items-center justify-center text-success">
                <Activity className="w-2 h-2" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text">
                  Resource Utilization (24h)
                </h3>
                <p className="text-[11px] text-textMuted">
                  Live CPU & Memory across active worker pool
                </p>
              </div>
            </div>
          </div>

          {metricsQuery.isLoading ? (
            <div className="h-60 flex items-center justify-center">
              <Skeleton width="100%" height={220} />
            </div>
          ) : metricsQuery.isError ? (
            <ErrorState
              title="Metrics Retrieval Failed"
              message="EC2 CloudWatch telemetry unavailable."
              onRetry={() => metricsQuery.refetch()}
            />
          ) : (
            <TimeSeriesChart
              data={metricsQuery.data?.data || []}
              xAxisKey="timestamp"
              height={230}
              tooltipFormatter={(val) => `${val}%`}
              yAxisFormatter={(val) => `${val}%`}
              series={[
                {
                  key: 'cpuUtilization',
                  name: 'CPU Usage %',
                  color: 'var(--accent)',
                  type: 'area',
                },
                {
                  key: 'memoryUtilization',
                  name: 'Memory Usage %',
                  color: 'var(--info)',
                  type: 'line',
                  strokeDasharray: '3 3',
                },
              ]}
            />
          )}
        </div>
      </div>

      {/* 5. Bottom Two-Column Deck: Top Recommendations vs Recent Outcomes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Top 3 Recommendations Panel */}
        <div className="p-3 bg-surface border border-border rounded-card space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-input bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Sparkles className="w-2 h-2" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text">
                  Top Optimization Proposals
                </h3>
                <p className="text-[11px] text-textMuted">
                  Ranked by projected ROI and stability risk score
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-warning">
              {pendingRecommendations.length} Pending Review
            </span>
          </div>

          {recommendationsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={56} />
            </div>
          ) : recommendationsQuery.isError ? (
            <ErrorState
              title="Failed to Load Proposals"
              message="AI recommendation inference queue timed out."
              onRetry={() => recommendationsQuery.refetch()}
            />
          ) : topRecommendations.length === 0 ? (
            <EmptyState
              title="No Pending Recommendations"
              description="All resources are running with optimal architecture profiles."
            />
          ) : (
            <div className="space-y-1.5">
              {topRecommendations.map((rec, index) => (
                <DashboardRecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  rank={index + 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Audit Outcomes Panel */}
        <div className="p-3 bg-surface border border-border rounded-card space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-input bg-info/10 border border-info/20 flex items-center justify-center text-info">
                <History className="w-2 h-2" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text">
                  Recent Human Review Outcomes
                </h3>
                <p className="text-[11px] text-textMuted">
                  Audit trail of verified approvals and dismissals
                </p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-textMuted">
              Audit Integrity 100%
            </span>
          </div>

          {historyQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton height={48} />
              <Skeleton height={48} />
              <Skeleton height={48} />
            </div>
          ) : historyQuery.isError ? (
            <ErrorState
              title="Audit Log Ingestion Error"
              message="Historical outcome audit trail could not be fetched."
              onRetry={() => historyQuery.refetch()}
            />
          ) : (
            <RecentOutcomesList history={historyQuery.data || []} />
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import {
  AnomalyFilterBar,
  AnomalyTimelineTable,
  AnomalyDetailDrawer,
} from '../features/anomalies';
import { useAnomalies } from '../hooks/useAnomalies';
import { Skeleton } from '../components/feedback/Skeleton';
import { ErrorState } from '../components/feedback/ErrorState';
import { AlertOctagon, AlertTriangle, Activity, ShieldCheck, RotateCw } from 'lucide-react';

export default function AnomaliesPage() {
  const [filters, setFilters] = useState({
    severity: 'all',
    service: 'all',
    state: 'all',
    search: '',
  });

  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 1. Fetch anomalies with active filters
  const anomaliesQuery = useAnomalies(filters);
  const anomaliesList = anomaliesQuery.data || [];

  const handleRowClick = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const criticalCount = anomaliesList.filter((a) => a.severity === 'CRITICAL').length;
  const highCount = anomaliesList.filter((a) => a.severity === 'HIGH').length;
  const activeCount = anomaliesList.filter((a) => a.status === 'ACTIVE').length;

  return (
    <div className="space-y-3 pb-6">
      {/* 1. Header */}
      <PageHeader
        title="Anomaly Detection & Incident Log"
        subtitle="Automated statistical z-score breach detection, threshold violations, and root-cause diagnostics across cloud telemetry streams."
        badge={
          criticalCount > 0 ? (
            <span className="px-2 py-0.5 rounded-input bg-critical/15 border border-critical/30 text-critical text-[11px] font-bold animate-pulse">
              {criticalCount} Critical Active
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-input bg-success/10 border border-success/20 text-success text-[11px] font-semibold">
              All Baselines Healthy
            </span>
          )
        }
        actions={
          <button
            type="button"
            onClick={() => anomaliesQuery.refetch()}
            disabled={anomaliesQuery.isFetching}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-btn text-xs font-medium bg-surface border border-border text-text hover:bg-bg hover:border-accent transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-1.5 h-1.5 text-accent ${anomaliesQuery.isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh Incidents</span>
          </button>
        }
      />

      {/* 2. Quick Incident Severity Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 bg-surface border border-border rounded-card">
          <span className="text-xs text-textMuted block mb-0.5">Total Filtered Incidents</span>
          <span className="text-xl font-bold text-text">{anomaliesList.length}</span>
          <span className="text-[10px] text-textMuted block mt-0.5">Evaluated across all streams</span>
        </div>
        <div className="p-2.5 bg-surface border border-border rounded-card">
          <span className="text-xs text-textMuted block mb-0.5">Critical Severity</span>
          <span className={`text-xl font-bold ${criticalCount > 0 ? 'text-critical' : 'text-text'}`}>
            {criticalCount}
          </span>
          <span className="text-[10px] text-textMuted block mt-0.5">Immediate intervention required</span>
        </div>
        <div className="p-2.5 bg-surface border border-border rounded-card">
          <span className="text-xs text-textMuted block mb-0.5">High Severity</span>
          <span className={`text-xl font-bold ${highCount > 0 ? 'text-warning' : 'text-text'}`}>
            {highCount}
          </span>
          <span className="text-[10px] text-textMuted block mt-0.5">P95 latency or cost spike</span>
        </div>
        <div className="p-2.5 bg-surface border border-border rounded-card">
          <span className="text-xs text-textMuted block mb-0.5">Active Incidents</span>
          <span className="text-xl font-bold text-text">{activeCount}</span>
          <span className="text-[10px] text-textMuted block mt-0.5">Under live monitoring</span>
        </div>
      </div>

      {/* 3. Filter Bar (Severity, Service, State, Search) */}
      <AnomalyFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={() => setFilters({ severity: 'all', service: 'all', state: 'all', search: '' })}
      />

      {/* 4. Incident Timeline Table */}
      {anomaliesQuery.isLoading ? (
        <div className="p-4 bg-surface border border-border rounded-card space-y-2">
          <Skeleton height={20} width="30%" />
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
        </div>
      ) : anomaliesQuery.isError ? (
        <ErrorState
          title="Failed to Load Anomaly Incidents"
          message="Anomaly detection query timed out or failed to reach the server."
          onRetry={() => anomaliesQuery.refetch()}
        />
      ) : (
        <AnomalyTimelineTable
          anomalies={anomaliesList}
          onRowClick={handleRowClick}
          pageSize={6}
        />
      )}

      {/* 5. Anomaly Detail Drawer */}
      <AnomalyDetailDrawer
        anomaly={selectedAnomaly}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}

import React from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Clock,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusChip } from '../components/feedback/StatusChip';
import { Skeleton } from '../components/feedback/Skeleton';
import { ErrorState } from '../components/feedback/ErrorState';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { ServiceHealthList } from '../features/system';
import { formatTimestamp } from '../lib/formatters';

function MetricBar({ label, value, icon: Icon, color = 'bg-accent' }) {
  return (
    <div className="p-2.5 bg-surface border border-border rounded-card">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1 text-[11px] text-textMuted">
          <Icon className="w-1.5 h-1.5" />
          {label}
        </div>
        <span className="text-xs font-bold text-text">{value}%</span>
      </div>
      <div className="w-full h-1 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-slow ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function SystemStatusPage() {
  const { data: health, isLoading, isError, refetch, isFetching } = useSystemHealth();

  const isHealthy = health?.overallStatus === 'HEALTHY';

  return (
    <div className="space-y-3 pb-6">
      <PageHeader
        title="System Status"
        subtitle="Real-time operational status for core backend services, database clusters, AI models, and cloud telemetry streams."
        badge={
          health ? (
            <span className={`px-2 py-0.5 rounded-input border text-[11px] font-semibold flex items-center gap-1.5 ${isHealthy ? 'bg-success/10 border-success/20 text-success' : 'bg-warning/10 border-warning/20 text-warning'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              {isHealthy ? 'All Systems Operational' : 'Degraded Performance'}
            </span>
          ) : null
        }
        actions={
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-textMuted hidden sm:inline-flex items-center gap-1">
              <Radio className="w-1.5 h-1.5 text-accent animate-pulse" />
              Polling 30s
            </span>
            <button
              type="button"
              onClick={refetch}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-btn text-xs font-medium bg-surface border border-border text-text hover:bg-bg hover:border-accent transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-1.5 h-1.5 text-accent ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} height={68} className="rounded-card" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
            {[...Array(4)].map((_, i) => <Skeleton key={i} height={130} className="rounded-card" />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} height={55} className="rounded-card" />)}
          </div>
        </div>
      ) : isError ? (
        <ErrorState
          title="Health check failed"
          message="Unable to reach system health endpoint. Check network connectivity or mock configuration."
          onRetry={refetch}
        />
      ) : (
        <>
          {/* Overall Health KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'System Health Score', value: `${health.healthScore}%`, icon: Activity, color: 'text-success' },
              { label: 'Service Uptime', value: `${health.uptimePercent}%`, icon: CheckCircle2, color: 'text-success' },
              { label: 'Agent Workers Active', value: health.systemMetrics?.activeAgentWorkers || 4, icon: Zap, color: 'text-accent' },
              {
                label: 'Unhandled Errors',
                value: health.systemMetrics?.unhandledErrorsCount || 0,
                icon: AlertTriangle,
                color: (health.systemMetrics?.unhandledErrorsCount || 0) > 0 ? 'text-critical' : 'text-success',
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="p-2.5 bg-surface border border-border rounded-card">
                <span className="text-[11px] text-textMuted block mb-0.5">{label}</span>
                <div className={`flex items-center gap-1.5 text-lg font-bold ${color}`}>
                  <Icon className="w-2 h-2" />
                  <span>{value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Core Infrastructure Health Cards (Backend, PostgreSQL, AI service, AWS connectivity) */}
          <ServiceHealthList
            services={health.services}
            lastChecked={health.lastHealthCheck}
          />

          {/* Pipeline Host Resource Metrics */}
          <div className="space-y-1.5">
            <h2 className="text-[11px] font-bold text-textMuted uppercase tracking-wider px-0.5">
              Host Resource Telemetry
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <MetricBar
                label="CPU Usage"
                value={health.systemMetrics?.cpuUsage || 24}
                icon={Cpu}
                color={(health.systemMetrics?.cpuUsage || 0) > 80 ? 'bg-critical' : 'bg-accent'}
              />
              <MetricBar
                label="Memory Usage"
                value={health.systemMetrics?.memoryUsage || 41}
                icon={MemoryStick}
                color={(health.systemMetrics?.memoryUsage || 0) > 85 ? 'bg-critical' : 'bg-info'}
              />
              <MetricBar
                label="Disk Usage"
                value={health.systemMetrics?.diskUsage || 34}
                icon={HardDrive}
                color={(health.systemMetrics?.diskUsage || 0) > 90 ? 'bg-critical' : 'bg-success'}
              />
            </div>
          </div>

          {/* Last health check footer */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-textMuted pt-1 border-t border-border/40">
            <div className="flex items-center gap-1.5">
              <Clock className="w-1.5 h-1.5 text-accent" />
              <span>Last global health check: {formatTimestamp(health.lastHealthCheck)}</span>
            </div>
            <span className="text-[10px] text-textMuted/70">
              Autonomous background polling: 30s interval
            </span>
          </div>
        </>
      )}
    </div>
  );
}

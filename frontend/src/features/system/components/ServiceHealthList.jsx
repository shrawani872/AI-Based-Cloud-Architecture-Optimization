import React from 'react';
import {
  Server,
  Database,
  Sparkles,
  Cloud,
  Clock,
  Activity,
  Zap,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { StatusChip } from '../../../components/feedback/StatusChip';
import { formatTimestamp } from '../../../lib/formatters';

const SERVICE_ICONS = {
  backend: Server,
  postgres: Database,
  ai_service: Sparkles,
  aws_connectivity: Cloud,
};

function formatRelativeTime(isoString) {
  if (!isoString) return 'Just now';
  try {
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return formatTimestamp(isoString);
  } catch {
    return 'Recent';
  }
}

/**
 * ServiceHealthCard Component
 * Displays the health status, response metrics, and last-checked timestamp for a core service.
 */
export function ServiceHealthCard({ service }) {
  const IconComponent = SERVICE_ICONS[service.id] || Activity;
  const statusKey = (service.status || 'healthy').toLowerCase();
  const lastCheckedText = formatRelativeTime(service.lastChecked || service.lastHeartbeat);

  return (
    <div
      className="p-3 bg-surface border border-border hover:border-accent/40 rounded-card transition-all duration-normal flex flex-col justify-between shadow-subtle"
      data-testid={`service-card-${service.id || service.name}`}
    >
      {/* Header: Service identification & Status */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-input bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 text-accent">
              <IconComponent className="w-2.5 h-2.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-text truncate leading-tight">
                {service.name}
              </h3>
              <p className="text-[10px] text-textMuted truncate">
                {service.type}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <StatusChip status={statusKey} />
          </div>
        </div>

        {/* Technical summary detail */}
        {service.details && (
          <p className="text-[11px] text-textMuted/90 mb-3 line-clamp-2 leading-relaxed">
            {service.details}
          </p>
        )}
      </div>

      {/* Metrics Strip & Footer */}
      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-1.5 rounded-input bg-bg border border-border/40">
            <span className="text-[10px] text-textMuted block">Latency</span>
            <span className="font-mono font-semibold text-text">
              {service.latencyMs !== undefined ? `${service.latencyMs}ms` : '—'}
            </span>
          </div>
          <div className="p-1.5 rounded-input bg-bg border border-border/40">
            <span className="text-[10px] text-textMuted block">Throughput / Pool</span>
            <span className="font-medium text-text truncate block" title={service.throughput}>
              {service.throughput || 'Normal'}
            </span>
          </div>
        </div>

        {/* Last-checked timestamp footer */}
        <div className="flex items-center justify-between text-[10px] text-textMuted pt-0.5">
          <div className="flex items-center gap-1">
            <Clock className="w-1.5 h-1.5 text-textMuted/70" />
            <span>Last checked: {lastCheckedText}</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-textMuted">{service.uptime || '99.9%'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ServiceHealthList Component
 * Renders health cards for Backend, PostgreSQL, AI service, and AWS connectivity.
 * @param {Object} props
 * @param {Array} props.services - Array of service health status objects
 * @param {string} [props.lastChecked] - Global last checked ISO string
 */
export function ServiceHealthList({ services = [], lastChecked }) {
  if (!services || services.length === 0) {
    return (
      <div className="p-6 text-center text-textMuted text-xs bg-surface border border-border rounded-card">
        No service telemetry available at this time.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-2 h-2 text-accent" />
          <h2 className="text-xs font-bold text-text uppercase tracking-wider">
            Core Infrastructure & Service Health
          </h2>
        </div>
        <span className="text-[10px] text-textMuted">
          {services.length} Monitored Services
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
        {services.map((service) => (
          <ServiceHealthCard
            key={service.id || service.name}
            service={service}
          />
        ))}
      </div>
    </div>
  );
}

export default ServiceHealthList;

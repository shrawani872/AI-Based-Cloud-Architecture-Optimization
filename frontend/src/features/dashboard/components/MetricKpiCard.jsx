import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '../../../components/feedback/Skeleton';

/**
 * MetricKpiCard Component
 * Displays a single KPI tile with threshold-based semantic styling, trend arrow, and navigation link.
 */
export function MetricKpiCard({
  title,
  value,
  unit = '',
  trend,
  status = 'info',
  icon: Icon,
  to,
  subtitle,
  isLoading = false,
  isError = false,
  className = '',
}) {
  if (isLoading) {
    return (
      <div className={`p-3 bg-surface border border-border rounded-card space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton width="50%" height={14} />
          <Skeleton variant="circular" width={24} height={24} />
        </div>
        <Skeleton width="75%" height={28} />
        <Skeleton width="40%" height={12} />
      </div>
    );
  }

  const statusColors = {
    success: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    critical: 'text-critical bg-critical/10 border-critical/20',
    info: 'text-info bg-info/10 border-info/20',
    neutral: 'text-textMuted bg-bg border-border',
  };

  const trendColor = trend?.isPositive
    ? 'text-success'
    : trend?.isPositive === false
    ? 'text-critical'
    : 'text-textMuted';

  const CardWrapper = to ? Link : 'div';

  return (
    <CardWrapper
      to={to}
      className={`block p-3 bg-surface border border-border rounded-card hover:border-accent/40 transition-all duration-fast group relative ${
        to ? 'cursor-pointer hover:shadow-sm' : ''
      } ${className}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="text-xs font-medium text-textMuted truncate">{title}</span>
        <div className="flex items-center gap-1">
          {Icon && (
            <div className={`w-3.5 h-3.5 rounded-input border flex items-center justify-center ${statusColors[status] || statusColors.info}`}>
              <Icon className="w-2 h-2" aria-hidden="true" />
            </div>
          )}
          {to && (
            <ArrowUpRight className="w-2 h-2 text-textMuted group-hover:text-accent transition-colors" />
          )}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-1 my-0.5">
        {isError ? (
          <span className="text-sm font-bold text-critical">Unavailable</span>
        ) : (
          <>
            <span className="text-2xl font-bold tracking-tight text-text">
              {value ?? '—'}
            </span>
            {unit && <span className="text-xs font-semibold text-textMuted">{unit}</span>}
          </>
        )}
      </div>

      {/* Trend / Subtitle Footer */}
      <div className="flex items-center justify-between text-[11px] text-textMuted mt-1">
        {trend && !isError ? (
          <div className={`flex items-center gap-0.5 font-medium ${trendColor}`}>
            {trend.direction === 'up' && <TrendingUp className="w-1.5 h-1.5" />}
            {trend.direction === 'down' && <TrendingDown className="w-1.5 h-1.5" />}
            {trend.direction === 'neutral' && <Minus className="w-1.5 h-1.5" />}
            <span>{trend.value}</span>
          </div>
        ) : isError ? (
          <span className="text-critical text-[10px]">Stale / Failed</span>
        ) : (
          <span>{subtitle || 'Normal operating range'}</span>
        )}
      </div>
    </CardWrapper>
  );
}

export default MetricKpiCard;

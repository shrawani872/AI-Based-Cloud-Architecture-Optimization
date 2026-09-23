import React from 'react';
import { ArrowRight, TrendingDown } from 'lucide-react';
import { StatusChip } from '../../../components/feedback/StatusChip';
import { CategoryBadge, RiskBadge } from './RecommendationStatusBadge';
import { formatCurrency, formatTimestamp } from '../../../lib/formatters';

/**
 * RecommendationCard — mobile card view for one recommendation
 * @param {{ rec: object, onClick: () => void }} props
 */
export function RecommendationCard({ rec, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-3 bg-surface border border-border rounded-card hover:border-accent hover:shadow-sm transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={`View recommendation: ${rec.title}`}
    >
      {/* Status row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusChip status={rec.status} />
          <CategoryBadge category={rec.category} />
          <RiskBadge riskLevel={rec.riskLevel} />
        </div>
        <span className="text-[11px] font-mono text-textMuted shrink-0">{rec.id}</span>
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-text leading-snug line-clamp-2 mb-2">
        {rec.title}
      </p>

      {/* Service + resource */}
      <p className="text-[11px] text-textMuted mb-2 truncate">
        {rec.service} · <span className="font-mono">{rec.resourceName || rec.resourceId}</span>
      </p>

      {/* Cost impact row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-success text-xs font-bold">
          <TrendingDown className="w-1.5 h-1.5" aria-hidden="true" />
          <span>{formatCurrency(rec.monthlySavings)}/mo savings</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-textMuted">
          <span>{formatTimestamp(rec.createdAt)}</span>
          <ArrowRight className="w-1.5 h-1.5 text-accent" aria-hidden="true" />
        </div>
      </div>
    </button>
  );
}

export default RecommendationCard;

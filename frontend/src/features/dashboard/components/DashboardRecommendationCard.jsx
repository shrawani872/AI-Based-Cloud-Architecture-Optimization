import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles, TrendingDown } from 'lucide-react';
import { StatusChip } from '../../../components/feedback/StatusChip';
import { formatCurrency } from '../../../lib/formatters';

/**
 * DashboardRecommendationCard Component
 * Preview card for top AI recommendations ranked by impact.
 */
export function DashboardRecommendationCard({
  recommendation,
  rank = 1,
  className = '',
}) {
  if (!recommendation) return null;

  return (
    <Link
      to={`/recommendations/${recommendation.id}`}
      className={`block p-3 bg-bg border border-border rounded-input hover:border-accent/40 hover:bg-surface transition-all duration-fast group ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 rounded-input bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-xs flex-shrink-0">
            #{rank}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs font-semibold text-text group-hover:text-accent transition-colors">
                {recommendation.title}
              </h4>
              <StatusChip status={recommendation.status} />
            </div>
            <p className="text-[11px] text-textMuted line-clamp-1">
              Resource: <span className="font-mono text-text">{recommendation.resourceName || recommendation.resourceId}</span> ({recommendation.service})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <span className="text-xs font-bold text-success block">
              +{formatCurrency(recommendation.monthlySavings)}/mo
            </span>
            <span className="text-[10px] text-textMuted block">
              Risk: {recommendation.riskLevel} ({recommendation.riskScore}/10)
            </span>
          </div>
          <ArrowUpRight className="w-2 h-2 text-textMuted group-hover:text-accent transition-colors" />
        </div>
      </div>
    </Link>
  );
}

export default DashboardRecommendationCard;

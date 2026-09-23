import React from 'react';
import { Link } from 'react-router-dom';
import { History, ArrowRight, UserCheck, ShieldX } from 'lucide-react';
import { StatusChip } from '../../../components/feedback/StatusChip';
import { formatCurrency, formatTimestamp } from '../../../lib/formatters';

/**
 * RecentOutcomesList Component
 * Renders the recent human-approved / rejected decisions audit trail.
 */
export function RecentOutcomesList({ history = [], className = '' }) {
  if (!history || history.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-textMuted bg-bg border border-border rounded-input">
        No recent human decisions logged yet.
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {history.slice(0, 4).map((entry) => {
        const isApproved = entry.action === 'APPROVED';

        return (
          <div
            key={entry.id}
            className="p-2.5 bg-bg border border-border rounded-input flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-3.5 h-3.5 rounded-input border flex items-center justify-center flex-shrink-0 ${
                  isApproved
                    ? 'text-success bg-success/10 border-success/20'
                    : 'text-critical bg-critical/10 border-critical/20'
                }`}
              >
                {isApproved ? <UserCheck className="w-2 h-2" /> : <ShieldX className="w-2 h-2" />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-text truncate max-w-xs">
                    {entry.title}
                  </span>
                  <StatusChip
                    status={isApproved ? 'approved' : 'rejected'}
                    label={isApproved ? 'Approved' : 'Rejected'}
                  />
                </div>
                <div className="text-[11px] text-textMuted flex items-center gap-2">
                  <span>By: <strong className="text-text">{entry.actor}</strong></span>
                  <span>•</span>
                  <span>{formatTimestamp(entry.timestamp)}</span>
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              {isApproved && entry.monthlySavings ? (
                <span className="text-xs font-bold text-success block">
                  +{formatCurrency(entry.monthlySavings)}/mo
                </span>
              ) : (
                <span className="text-[11px] text-textMuted block">Dismissed</span>
              )}
            </div>
          </div>
        );
      })}

      <div className="pt-1 text-right">
        <Link
          to="/history"
          className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-medium"
        >
          <span>View full audit log</span>
          <ArrowRight className="w-1.5 h-1.5" />
        </Link>
      </div>
    </div>
  );
}

export default RecentOutcomesList;

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  TrendingDown,
  TrendingUp,
  Minus,
  ChevronRight,
  User,
  CalendarDays,
} from 'lucide-react';
import { StatusChip } from '../../../components/feedback/StatusChip';
import { CategoryBadge } from '../../recommendations/components/RecommendationStatusBadge';
import { OutcomeComparisonChart } from './OutcomeComparisonChart';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { formatCurrency, formatTimestamp } from '../../../lib/formatters';

const ACTION_ICONS = {
  APPROVED: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  REJECTED: { icon: XCircle, color: 'text-critical', bg: 'bg-critical/10' },
  APPLIED: { icon: Activity, color: 'text-accent', bg: 'bg-accent/10' },
  PENDING: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
};

const VARIANCE_CONFIG = {
  better: { icon: TrendingDown, color: 'text-success', label: 'Better than predicted' },
  exact: { icon: Minus, color: 'text-textMuted', label: 'Matches prediction' },
  worse: { icon: TrendingUp, color: 'text-warning', label: 'Worse than predicted' },
};

/**
 * Single history entry card — expanded layout with inline outcome chart.
 */
function HistoryEntryCard({ entry, isExpanded, onToggle, onOpenDrawer }) {
  const meta = ACTION_ICONS[entry.action] || ACTION_ICONS.PENDING;
  const ActionIcon = meta.icon;
  const hasOutcome = entry.action === 'APPROVED' && entry.actualOutcome;
  const variance = entry.actualOutcome?.varianceDirection;
  const varCfg = VARIANCE_CONFIG[variance] || null;
  const VarIcon = varCfg?.icon;

  return (
    <div
      className={`bg-surface border rounded-card transition-all duration-normal ${
        isExpanded ? 'border-accent/40 shadow-sm' : 'border-border hover:border-accent/30'
      }`}
    >
      {/* ── Row header (always visible) ── */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left flex items-start gap-3 px-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent rounded-card"
        aria-expanded={isExpanded}
      >
        {/* Action icon */}
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.bg}`}>
          <ActionIcon className={`w-2 h-2 ${meta.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-text leading-snug line-clamp-2">{entry.title}</p>
            <span className="text-[10px] font-mono text-textMuted whitespace-nowrap shrink-0">{entry.id}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusChip status={entry.action?.toLowerCase()} />
            <CategoryBadge category={entry.category} />
            {entry.monthlySavings > 0 && (
              <span className="text-[10px] text-success font-bold">
                {formatCurrency(entry.monthlySavings)}/mo savings
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-textMuted flex items-center gap-0.5">
              <User className="w-1.5 h-1.5" /> {entry.actor}
            </span>
            <span className="text-[10px] text-textMuted flex items-center gap-0.5">
              <CalendarDays className="w-1.5 h-1.5" /> {formatTimestamp(entry.timestamp)}
            </span>
            {varCfg && VarIcon && (
              <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${varCfg.color}`}>
                <VarIcon className="w-1.5 h-1.5" />
                {entry.actualOutcome.variance} ({varCfg.label})
              </span>
            )}
          </div>
        </div>

        <ChevronRight
          className={`w-2.5 h-2.5 text-textMuted shrink-0 mt-1 transition-transform duration-fast ${isExpanded ? 'rotate-90' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* ── Expanded outcome panel ── */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/60 pt-3">
          {/* Outcome stat comparison */}
          {entry.predictedOutcome && (
            <div className="grid grid-cols-2 gap-2">
              {/* Predicted */}
              <div className="p-2.5 bg-accent/5 border border-accent/20 rounded-input space-y-1">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">▩ Predicted</span>
                <div className="text-xs font-bold text-text">
                  {formatCurrency(entry.predictedOutcome.monthlyCost)}/mo
                </div>
                <div className="text-[10px] text-success">
                  {formatCurrency(entry.predictedOutcome.monthlySavings)} saved ({entry.predictedOutcome.savingsPercent}%)
                </div>
                <p className="text-[10px] text-textMuted leading-tight">{entry.predictedOutcome.reliabilityImpact}</p>
              </div>

              {/* Actual */}
              {entry.actualOutcome ? (
                <div className={`p-2.5 rounded-input border space-y-1 ${
                  variance === 'better' ? 'bg-success/5 border-success/20'
                  : variance === 'worse' ? 'bg-warning/5 border-warning/20'
                  : 'bg-bg border-border'
                }`}>
                  <span className="text-[10px] font-bold text-success uppercase tracking-wider block">◇ Actual</span>
                  <div className="text-xs font-bold text-text">
                    {formatCurrency(entry.actualOutcome.monthlyCost)}/mo
                  </div>
                  <div className="text-[10px] text-success">
                    {formatCurrency(entry.actualOutcome.monthlySavings)} saved ({entry.actualOutcome.savingsPercent}%)
                  </div>
                  <p className="text-[10px] text-textMuted leading-tight">{entry.actualOutcome.reliabilityImpact}</p>
                </div>
              ) : (
                <div className="p-2.5 bg-bg border border-border rounded-input flex items-center justify-center">
                  <span className="text-[11px] text-textMuted text-center">
                    {entry.action === 'REJECTED'
                      ? 'No outcome — change was rejected'
                      : 'Outcome data pending…'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Monthly cost chart */}
          {entry.outcomeTimeSeries?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider">
                Monthly Cost: Predicted vs Actual
              </span>
              <OutcomeComparisonChart data={entry.outcomeTimeSeries} height={170} />
            </div>
          )}

          {/* Notes */}
          {entry.actualOutcome?.notes && (
            <p className="text-[11px] text-textMuted leading-relaxed border-t border-border/60 pt-2">
              <span className="font-semibold text-text">Note: </span>
              {entry.actualOutcome.notes}
            </p>
          )}

          {/* Open in drawer CTA */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => onOpenDrawer(entry)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-btn text-xs font-medium bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors"
            >
              <Activity className="w-1.5 h-1.5" />
              View full recommendation details
              <ChevronRight className="w-1.5 h-1.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * HistoryList — expandable list of resolved/applied recommendations
 * with inline outcome comparison charts and drawer link.
 */
export function HistoryList({ entries, onOpenDrawer }) {
  const [expandedId, setExpandedId] = React.useState(null);

  if (!entries || entries.length === 0) {
    return (
      <EmptyState
        title="No history entries found"
        description="Adjust filters or approve a recommendation to see outcomes here."
      />
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <HistoryEntryCard
          key={entry.id}
          entry={entry}
          isExpanded={expandedId === entry.id}
          onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
          onOpenDrawer={onOpenDrawer}
        />
      ))}
    </div>
  );
}

export default HistoryList;

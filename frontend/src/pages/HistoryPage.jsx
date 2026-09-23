import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  DollarSign,
  Activity,
  RotateCw,
  TrendingDown,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Skeleton } from '../components/feedback/Skeleton';
import { ErrorState } from '../components/feedback/ErrorState';
import { RecommendationDrawer } from '../features/recommendations';
import { HistoryFilterBar, HistoryList } from '../features/history';
import { useHistory } from '../hooks/useSystemHealth';
import { formatCurrency } from '../lib/formatters';

const DEFAULT_FILTERS = {
  category: 'all',
  status: 'all',
  search: '',
};

// Map history entry → a rec-shaped object the drawer can render
function historyEntryToRec(entry) {
  return {
    id: entry.recommendationId,
    title: entry.title,
    service: entry.service,
    resourceId: entry.resourceId,
    resourceName: entry.resourceName,
    category: entry.category,
    status: entry.action === 'APPROVED' ? 'APPROVED' : 'REJECTED',
    riskLevel: entry.riskLevel ?? 'LOW',
    confidenceScore: entry.confidenceScore ?? 0.9,
    monthlySavings: entry.monthlySavings,
    annualSavings: (entry.monthlySavings ?? 0) * 12,
    currentCost: entry.predictedOutcome?.monthlyCost
      ? (entry.predictedOutcome.monthlyCost + entry.monthlySavings)
      : null,
    estimatedCost: entry.predictedOutcome?.monthlyCost ?? null,
    savingsPercent: entry.predictedOutcome?.savingsPercent ?? null,
    reviewedBy: entry.actor,
    reviewedAt: entry.timestamp,
    rejectionReason: entry.executionDetails,
    rollbackPlan: null,
    description: entry.executionDetails,
    aiReasoning: entry.predictedOutcome?.notes ?? null,
    architectureDiff: null,
    // Outcome data forwarded directly
    predictedOutcome: entry.predictedOutcome ?? null,
    actualOutcome: entry.actualOutcome ?? null,
    outcomeTimeSeries: entry.outcomeTimeSeries ?? null,
  };
}

export default function HistoryPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [drawerRec, setDrawerRec] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: history = [], isLoading, isError, refetch, isFetching } = useHistory();

  // Filter entries client-side
  const filtered = useMemo(() => {
    return history.filter((entry) => {
      if (filters.category !== 'all' && entry.category !== filters.category) return false;
      if (filters.status !== 'all' && entry.executionStatus !== filters.status) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !entry.title.toLowerCase().includes(q) &&
          !(entry.resourceName ?? '').toLowerCase().includes(q) &&
          !(entry.actor ?? '').toLowerCase().includes(q) &&
          !(entry.id ?? '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [history, filters]);

  // Summary stats from full history (not filtered)
  const totalLocked = history
    .filter((h) => h.action === 'APPROVED')
    .reduce((sum, h) => sum + (h.monthlySavings || 0), 0);

  const completedCount = history.filter((h) => h.executionStatus === 'COMPLETED').length;
  const dismissedCount = history.filter((h) => h.executionStatus === 'DISMISSED').length;

  const handleOpenDrawer = (entry) => {
    setDrawerRec(historyEntryToRec(entry));
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-3 pb-6">
      {/* ── HEADER ─────────────────────────────────────── */}
      <PageHeader
        title="Execution History"
        subtitle="Resolved and applied recommendations with predicted vs actual outcome comparison — the ground truth for AI model calibration."
        badge={
          <span className="px-2 py-0.5 rounded-input bg-success/10 border border-success/20 text-success text-[11px] font-semibold">
            {formatCurrency(totalLocked)}/mo locked in
          </span>
        }
        actions={
          <button
            type="button"
            onClick={refetch}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-btn text-xs font-medium bg-surface border border-border text-text hover:bg-bg hover:border-accent transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-1.5 h-1.5 text-accent ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* ── KPI STRIP ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          {
            label: 'Total Actions',
            value: history.length,
            icon: Activity,
            color: 'text-text',
          },
          {
            label: 'Completed',
            value: completedCount,
            icon: CheckCircle2,
            color: 'text-success',
          },
          {
            label: 'Dismissed',
            value: dismissedCount,
            icon: XCircle,
            color: 'text-critical',
          },
          {
            label: 'Monthly Savings Locked In',
            value: formatCurrency(totalLocked),
            icon: TrendingDown,
            color: 'text-success',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-2.5 bg-surface border border-border rounded-card">
            <span className="text-[11px] text-textMuted block mb-0.5">{label}</span>
            <div className={`flex items-center gap-1.5 text-lg font-bold ${color}`}>
              <Icon className="w-2 h-2 flex-shrink-0" aria-hidden="true" />
              <span>{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTERS ────────────────────────────────────── */}
      <HistoryFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* ── CONTENT ────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height={80} variant="rectangular" className="rounded-card" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load execution history"
          message="Audit log unavailable. Check your connection and retry."
          onRetry={refetch}
        />
      ) : (
        <HistoryList
          entries={filtered}
          onOpenDrawer={handleOpenDrawer}
        />
      )}

      {/* ── DRAWER ─────────────────────────────────────── */}
      <RecommendationDrawer
        rec={drawerRec}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        initialSection="outcome"
      />
    </div>
  );
}

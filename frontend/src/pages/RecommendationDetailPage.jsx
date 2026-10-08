import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCw,
  TrendingDown,
  Sparkles,
  Activity,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  Loader2,
  Sliders,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusChip } from '../components/feedback/StatusChip';
import { Skeleton } from '../components/feedback/Skeleton';
import { ErrorState } from '../components/feedback/ErrorState';
import { CategoryBadge, RiskBadge } from '../features/recommendations/components/RecommendationStatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  useRecommendation,
  useApproveRecommendation,
  useRejectRecommendation,
} from '../hooks/useRecommendations';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatTimestamp } from '../lib/formatters';

export default function RecommendationDetailPage() {
  const { id } = useParams();
  const [confirmAction, setConfirmAction] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: rec, isLoading, isError, refetch, isFetching } = useRecommendation(id);
  const approveMutation = useApproveRecommendation();
  const rejectMutation = useRejectRecommendation();
  const { success: toastSuccess, error: toastError } = useToast();

  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  const handleApprove = async () => {
    if (!rec) return;
    setConfirmAction(null);
    try {
      await approveMutation.mutateAsync({ id: rec.id });
      toastSuccess(`Recommendation ${rec.id} approved successfully.`);
    } catch {
      toastError(`Failed to approve ${rec.id}. Please retry.`);
    }
  };

  const handleReject = async () => {
    if (!rec) return;
    setConfirmAction(null);
    try {
      await rejectMutation.mutateAsync({
        id: rec.id,
        reason: rejectReason || 'Dismissed by human reviewer',
      });
      toastSuccess(`Recommendation ${rec.id} rejected.`);
    } catch {
      toastError(`Failed to reject ${rec.id}. Please retry.`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-border">
          <div className="space-y-1">
            <Skeleton width={260} height={24} />
            <Skeleton width={180} height={14} />
          </div>
          <Skeleton width={140} height={32} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Skeleton height={80} variant="rectangular" className="rounded-card" />
          <Skeleton height={80} variant="rectangular" className="rounded-card" />
          <Skeleton height={80} variant="rectangular" className="rounded-card" />
        </div>
        <Skeleton height={120} variant="rectangular" className="rounded-card" />
        <Skeleton height={140} variant="rectangular" className="rounded-card" />
      </div>
    );
  }

  if (isError || !rec) {
    return (
      <div className="space-y-3 pb-6">
        <PageHeader
          title={`Recommendation Detail — #${id || ''}`}
          subtitle="Deep dive review and human approval workflow."
          actions={
            <Link
              to="/recommendations"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-btn text-xs font-medium border border-border bg-surface text-text hover:bg-bg transition-colors"
            >
              <ArrowLeft className="w-2 h-2" />
              <span>Back to Recommendations</span>
            </Link>
          }
        />
        <ErrorState
          title="Recommendation Not Found"
          message={`Recommendation "${id || ''}" could not be retrieved from the backend.`}
          onRetry={refetch}
        />
      </div>
    );
  }

  const isPending = rec.status === 'PENDING';
  const diffBefore = rec.architectureDiff?.before ?? {};
  const diffAfter = rec.architectureDiff?.after ?? {};
  const diffKeys = Array.from(new Set([...Object.keys(diffBefore), ...Object.keys(diffAfter)]));

  const savingsPercent =
    rec.currentCost && rec.currentCost > 0 && rec.projectedCost !== undefined
      ? Math.round(((rec.currentCost - rec.projectedCost) / rec.currentCost) * 1000) / 10
      : null;

  return (
    <div className="space-y-3 pb-6">
      {/* ── HEADER ─────────────────────────────────────── */}
      <PageHeader
        title={rec.title || `Recommendation ${rec.id}`}
        subtitle={`${rec.service || 'Cloud Service'} · Resource: ${rec.resourceId}`}
        badge={<StatusChip status={rec.status} />}
        actions={
          <>
            <Link
              to="/recommendations"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-btn text-xs font-medium border border-border bg-surface text-text hover:bg-bg transition-colors"
            >
              <ArrowLeft className="w-2 h-2" />
              <span>Back to Recommendations</span>
            </Link>
            <button
              type="button"
              onClick={refetch}
              disabled={isFetching}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-btn text-xs font-medium border border-border bg-surface text-text hover:bg-bg transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-2 h-2 text-accent ${isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </>
        }
      />

      {/* ── METADATA STRIP ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-surface border border-border rounded-card text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-xs font-bold text-text px-1.5 py-0.5 bg-bg border border-border rounded-input">
            {rec.id}
          </span>
          <CategoryBadge category={rec.category} />
          <RiskBadge riskLevel={rec.riskLevel} />
          <StatusChip status={rec.status} />
        </div>
        <div className="ml-auto flex items-center gap-3 text-textMuted text-[11px] flex-wrap">
          <span>Created: <strong className="text-text font-normal">{formatTimestamp(rec.createdAt)}</strong></span>
          {rec.updatedAt && (
            <span>Updated: <strong className="text-text font-normal">{formatTimestamp(rec.updatedAt)}</strong></span>
          )}
        </div>
      </div>

      {/* ── FINANCIAL IMPACT KPI CARDS ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="p-3 bg-surface border border-border rounded-card">
          <span className="text-[10px] text-textMuted uppercase font-semibold block mb-1">
            Current Monthly Cost
          </span>
          <div className="text-sm font-bold text-text">
            {formatCurrency(rec.currentCost)}/mo
          </div>
        </div>
        <div className="p-3 bg-surface border border-border rounded-card">
          <span className="text-[10px] text-textMuted uppercase font-semibold block mb-1">
            Projected Monthly Cost
          </span>
          <div className="text-sm font-bold text-text">
            {formatCurrency(rec.projectedCost)}/mo
          </div>
        </div>
        <div className="p-3 bg-success/5 border border-success/20 rounded-card">
          <span className="text-[10px] text-success uppercase font-semibold block mb-1">
            Potential Monthly Savings
          </span>
          <div className="flex items-center gap-1.5 text-sm font-bold text-success flex-wrap">
            <TrendingDown className="w-2 h-2 flex-shrink-0" />
            <span>{formatCurrency(rec.monthlySavings)}/mo</span>
            {savingsPercent !== null && (
              <span className="text-[11px] font-semibold text-success/80">
                ({savingsPercent}% reduction)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── OPTIMIZATION SUMMARY ─────────────────────────── */}
      <div className="p-4 bg-surface border border-border rounded-card space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-text uppercase tracking-wider">
          <Sparkles className="w-2 h-2 text-accent" />
          <span>Optimization Summary</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-bg border border-border rounded-input">
            <span className="text-[10px] text-textMuted block mb-0.5">Category</span>
            <span className="font-semibold text-text">{rec.category || '—'}</span>
          </div>
          <div className="p-2.5 bg-bg border border-border rounded-input">
            <span className="text-[10px] text-textMuted block mb-0.5">Service</span>
            <span className="font-semibold text-text">{rec.service || '—'}</span>
          </div>
          <div className="p-2.5 bg-bg border border-border rounded-input">
            <span className="text-[10px] text-textMuted block mb-0.5">Resource</span>
            <span className="font-mono font-semibold text-text truncate block">{rec.resourceId || '—'}</span>
          </div>
          <div className="p-2.5 bg-bg border border-border rounded-input">
            <span className="text-[10px] text-textMuted block mb-0.5">Optimization</span>
            <span className="font-semibold text-text truncate block" title={rec.title}>{rec.title || '—'}</span>
          </div>
        </div>

        <div className="p-3 bg-bg border border-border rounded-input text-xs space-y-1">
          <span className="text-[10px] text-textMuted font-semibold uppercase block">Description</span>
          <p className="text-text leading-relaxed">{rec.description || 'No description provided.'}</p>
          {rec.aiReasoning && (
            <p className="text-textMuted leading-relaxed border-t border-border/60 pt-2 mt-2">
              {rec.aiReasoning}
            </p>
          )}
        </div>

        {rec.resourceId && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-border/60">
            <Link
              to={`/telemetry?resource=${encodeURIComponent(rec.resourceId)}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-accent hover:text-accentHover border border-accent/20 rounded-btn bg-accent/5 transition-colors"
            >
              <Activity className="w-1.5 h-1.5" />
              <span>View telemetry for <span className="font-mono">{rec.resourceId}</span></span>
              <ChevronRight className="w-1.5 h-1.5" />
            </Link>
            <Link
              to={`/forecasts?resource=${encodeURIComponent(rec.resourceId)}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-accent hover:text-accentHover border border-accent/20 rounded-btn bg-accent/5 transition-colors"
            >
              <TrendingDown className="w-1.5 h-1.5" />
              <span>Forecast model for this resource</span>
              <ChevronRight className="w-1.5 h-1.5" />
            </Link>
          </div>
        )}
      </div>

      {/* ── STRUCTURED CONFIGURATION CHANGES (when available) ── */}
      {diffKeys.length > 0 && (
        <div className="p-4 bg-surface border border-border rounded-card space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-text uppercase tracking-wider">
            <Sliders className="w-2 h-2 text-accent" />
            <span>Proposed Configuration Changes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="pb-1.5 pt-1 px-2 text-left text-[10px] font-semibold text-textMuted uppercase">Attribute</th>
                  <th className="pb-1.5 pt-1 px-2 text-left text-[10px] font-semibold text-textMuted uppercase">Current Configuration</th>
                  <th className="pb-1.5 pt-1 px-2 text-left text-[10px] font-semibold text-accent uppercase">Recommended Configuration</th>
                </tr>
              </thead>
              <tbody>
                {diffKeys.map((key) => (
                  <tr key={key} className="border-b border-border/60 last:border-0">
                    <td className="py-1.5 px-2 text-[11px] text-textMuted font-medium whitespace-nowrap">{key}</td>
                    <td className="py-1.5 px-2 text-[11px] font-mono text-text">{diffBefore[key] ?? '—'}</td>
                    <td className="py-1.5 px-2 text-[11px] font-mono text-accent font-semibold">{diffAfter[key] ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── APPROVE / REJECT ACTIONS ────────────────────── */}
      <div className="p-4 bg-surface border border-border rounded-card">
        {isPending ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-text">Human-in-the-Loop Review</h3>
              <p className="text-xs text-textMuted mt-0.5">
                Review this proposal and confirm approval or rejection. Approved actions are queued for orchestration.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                disabled={isMutating}
                onClick={() => setConfirmAction('reject')}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-semibold border border-critical/40 text-critical hover:bg-critical/10 transition-colors disabled:opacity-50"
              >
                {rejectMutation.isPending ? <Loader2 className="w-2 h-2 animate-spin" /> : <XCircle className="w-2 h-2" />}
                <span>Reject</span>
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={() => setConfirmAction('approve')}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-semibold bg-accent hover:bg-accentHover text-white transition-colors disabled:opacity-50 shadow-xs"
              >
                {approveMutation.isPending ? <Loader2 className="w-2 h-2 animate-spin" /> : <CheckCircle2 className="w-2 h-2" />}
                <span>Approve</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-textMuted">
            <Info className="w-2 h-2 shrink-0 text-info" />
            <span>
              This recommendation is currently <strong className="text-text font-semibold">{rec.status.toLowerCase()}</strong>. No further review action is required.
            </span>
          </div>
        )}
      </div>

      {/* ── CONFIRMATION MODALS ────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmAction === 'approve'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleApprove}
        title={`Approve Recommendation ${rec.id}?`}
        description="This will approve the architecture recommendation for automated deployment. Human approval is recorded in the system audit log."
        confirmText="Approve Recommendation"
        variant="accent"
        isLoading={approveMutation.isPending}
      >
        <div className="p-2.5 bg-bg border border-border rounded-input text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-textMuted">Resource:</span>
            <span className="font-mono text-text">{rec.resourceId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-textMuted">Monthly savings:</span>
            <span className="text-success font-bold">{formatCurrency(rec.monthlySavings)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-textMuted">Risk level:</span>
            <span className="text-text">{rec.riskLevel}</span>
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={confirmAction === 'reject'}
        onClose={() => { setConfirmAction(null); setRejectReason(''); }}
        onConfirm={handleReject}
        title={`Reject Recommendation ${rec.id}?`}
        description="This recommendation will be dismissed. You can optionally provide a reason for the audit trail."
        confirmText="Confirm Rejection"
        cancelText="Go Back"
        variant="critical"
        isLoading={rejectMutation.isPending}
      >
        <div className="mt-2">
          <label htmlFor="reject-reason" className="block text-[11px] font-medium text-textMuted mb-1">
            Rejection reason (optional)
          </label>
          <textarea
            id="reject-reason"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Workload migration planned next quarter..."
            className="w-full px-2.5 py-1.5 bg-bg border border-border rounded-input text-xs text-text placeholder:text-textMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none transition-colors"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}

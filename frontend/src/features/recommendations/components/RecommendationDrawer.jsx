import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  CheckCircle2,
  XCircle,
  TrendingDown,
  TrendingUp,
  Minus,
  ShieldCheck,
  Activity,
  Sparkles,
  FileText,
  ChevronRight,
  Loader2,
  RotateCw,
  Info,
} from 'lucide-react';
import { StatusChip } from '../../../components/feedback/StatusChip';
import { CategoryBadge, RiskBadge } from './RecommendationStatusBadge';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { OutcomeComparisonChart } from '../../history/components/OutcomeComparisonChart';
import { formatCurrency, formatTimestamp } from '../../../lib/formatters';
import { useApproveRecommendation, useRejectRecommendation } from '../../../hooks/useRecommendations';
import { useToast } from '../../../hooks/useToast';

const VARIANCE_CONFIG = {
  better: { icon: TrendingDown, color: 'text-success', label: 'Better than predicted' },
  exact:  { icon: Minus,        color: 'text-textMuted', label: 'Matches prediction' },
  worse:  { icon: TrendingUp,   color: 'text-warning',   label: 'Worse than predicted' },
};

/** Inline diff row for before/after architecture table */
function DiffRow({ label, before, after }) {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="py-1 pr-3 text-[11px] text-textMuted font-medium whitespace-nowrap">{label}</td>
      <td className="py-1 pr-3 text-[11px] font-mono text-text">{before ?? '—'}</td>
      <td className="py-1 text-[11px] font-mono text-accent font-semibold">{after ?? '—'}</td>
    </tr>
  );
}

/**
 * RecommendationDrawer
 * Side drawer (desktop) / full-screen sheet (mobile) for the human review flow.
 * Approve / Reject with ConfirmDialog + toast feedback.
 */
export function RecommendationDrawer({ rec, isOpen, onClose, initialSection = null }) {
  const drawerRef = useRef(null);
  const outcomeSectionRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject'
  const [rejectReason, setRejectReason] = useState('');

  const { success: toastSuccess, error: toastError } = useToast();
  const approveMutation = useApproveRecommendation();
  const rejectMutation = useRejectRecommendation();

  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  // Save active element and focus drawer/first element on open, restore on close
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement;
      setTimeout(() => {
        const focusable = drawerRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable && focusable.length > 0) {
          focusable[0].focus();
        } else if (drawerRef.current) {
          drawerRef.current.focus();
        }
      }, 50);
    } else if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus?.();
      previousActiveElementRef.current = null;
    }
  }, [isOpen]);

  // ESC closes drawer and Tab/Shift+Tab traps focus inside drawer
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape' && !isMutating && !confirmAction) {
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose, isMutating, confirmAction]);

  // Scroll to outcome section when opened from history
  useEffect(() => {
    if (isOpen && initialSection === 'outcome' && outcomeSectionRef.current) {
      setTimeout(() => {
        outcomeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    }
  }, [isOpen, initialSection]);

  if (!isOpen || !rec) return null;

  const isPending = rec.status === 'PENDING';
  const isApplied = rec.status === 'APPLIED';

  const handleApprove = async () => {
    setConfirmAction(null);
    try {
      await approveMutation.mutateAsync({ id: rec.id });
      toastSuccess(`Recommendation ${rec.id} approved and queued for deployment.`);
      onClose();
    } catch {
      toastError(`Failed to approve ${rec.id}. Please retry.`);
    }
  };

  const handleReject = async () => {
    setConfirmAction(null);
    try {
      await rejectMutation.mutateAsync({ id: rec.id, reason: rejectReason || 'Dismissed by human reviewer' });
      toastSuccess(`Recommendation ${rec.id} rejected.`);
      onClose();
    } catch {
      toastError(`Failed to reject ${rec.id}. Please retry.`);
    }
  };

  // Build diff rows from architectureDiff
  const diffBefore = rec.architectureDiff?.before ?? {};
  const diffAfter = rec.architectureDiff?.after ?? {};
  const diffKeys = Array.from(new Set([...Object.keys(diffBefore), ...Object.keys(diffAfter)]));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs animate-fade-in"
        onClick={!isMutating ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rec-drawer-title"
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-surface border-l border-border shadow-sm overflow-y-auto flex flex-col outline-none animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 flex items-start justify-between gap-2 z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusChip status={rec.status} />
              <CategoryBadge category={rec.category} />
              <RiskBadge riskLevel={rec.riskLevel} />
              <span className="text-[11px] font-mono text-textMuted">{rec.id}</span>
            </div>
            <h2 id="rec-drawer-title" className="text-sm font-bold text-text leading-snug max-w-[380px]">
              {rec.title}
            </h2>
            <p className="text-[11px] text-textMuted">
              {rec.service} · <span className="font-mono">{rec.resourceName || rec.resourceId}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isMutating}
            aria-label="Close recommendation drawer"
            className="text-textMuted hover:text-text p-1 rounded-btn hover:bg-bg transition-colors disabled:opacity-50 shrink-0"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* ── BODY ───────────────────────────────────────── */}
        <div className="flex-1 px-4 py-3 space-y-3">

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 bg-bg border border-border rounded-input text-center">
              <div className="flex items-center justify-center gap-1 text-success text-xs font-bold mb-0.5">
                <TrendingDown className="w-1.5 h-1.5" />
                <span>{formatCurrency(rec.monthlySavings)}/mo</span>
              </div>
              <span className="text-[10px] text-textMuted">Monthly Savings</span>
            </div>
            <div className="p-2.5 bg-bg border border-border rounded-input text-center">
              <div className="text-xs font-bold text-accent mb-0.5">
                {Math.round((rec.confidenceScore ?? 0) * 100)}%
              </div>
              <span className="text-[10px] text-textMuted">AI Confidence</span>
            </div>
            <div className="p-2.5 bg-bg border border-border rounded-input text-center">
              <div className="text-xs font-bold text-text mb-0.5">
                {formatCurrency(rec.annualSavings)}/yr
              </div>
              <span className="text-[10px] text-textMuted">Annual Savings</span>
            </div>
          </div>

          {/* Natural-language reason */}
          <div className="p-3 bg-bg border border-border rounded-card space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-text uppercase tracking-wider">
              <Sparkles className="w-1.5 h-1.5 text-accent" />
              AI Reasoning
            </div>
            <p className="text-xs text-text leading-relaxed">{rec.description}</p>
            {rec.aiReasoning && (
              <p className="text-xs text-textMuted leading-relaxed border-t border-border/60 pt-1.5">
                {rec.aiReasoning}
              </p>
            )}
          </div>

          {/* Architecture diff */}
          {diffKeys.length > 0 && (
            <div className="p-3 bg-bg border border-border rounded-card">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text uppercase tracking-wider mb-2">
                <Activity className="w-1.5 h-1.5 text-accent" />
                Proposed Architecture Change
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-1 text-left text-[10px] font-semibold text-textMuted uppercase">Attribute</th>
                      <th className="pb-1 text-left text-[10px] font-semibold text-textMuted uppercase">Current</th>
                      <th className="pb-1 text-left text-[10px] font-semibold text-accent uppercase">Proposed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffKeys.map((key) => (
                      <DiffRow key={key} label={key} before={diffBefore[key]} after={diffAfter[key]} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rollback plan */}
          {rec.rollbackPlan && (
            <div className="p-3 bg-bg border border-border rounded-card">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                <RotateCw className="w-1.5 h-1.5 text-info" />
                Rollback Plan
              </div>
              <p className="text-xs text-textMuted leading-relaxed">{rec.rollbackPlan}</p>
            </div>
          )}

          {/* Rejection reason — shown if rejected */}
          {rec.status === 'REJECTED' && rec.rejectionReason && (
            <div className="p-3 bg-critical/5 border border-critical/20 rounded-card">
              <div className="flex items-center gap-1.5 text-xs font-bold text-critical uppercase tracking-wider mb-1">
                <XCircle className="w-1.5 h-1.5" />
                Rejection Reason
              </div>
              <p className="text-xs text-text leading-relaxed">{rec.rejectionReason}</p>
              {rec.reviewedBy && (
                <p className="text-[10px] text-textMuted mt-1">
                  Reviewed by {rec.reviewedBy} · {formatTimestamp(rec.reviewedAt)}
                </p>
              )}
            </div>
          )}

          {/* Approved by */}
          {rec.status === 'APPROVED' && rec.reviewedBy && (
            <div className="p-3 bg-success/5 border border-success/20 rounded-card">
              <div className="flex items-center gap-1.5 text-xs font-bold text-success uppercase tracking-wider mb-1">
                <ShieldCheck className="w-1.5 h-1.5" />
                Approved
              </div>
              <p className="text-[10px] text-textMuted">
                Approved by {rec.reviewedBy} · {formatTimestamp(rec.reviewedAt)}
              </p>
            </div>
          )}

          {/* ── Predicted vs Actual Outcome (shown when actualOutcome exists on rec) ── */}
          {rec.actualOutcome && (
            <div
              ref={outcomeSectionRef}
              className="p-3 bg-bg border border-border rounded-card space-y-2"
              id="rec-outcome-section"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-text uppercase tracking-wider">
                <Activity className="w-1.5 h-1.5 text-accent" />
                Predicted vs Actual Outcome
              </div>

              {/* Variance badge */}
              {rec.actualOutcome.varianceDirection && (() => {
                const vc = VARIANCE_CONFIG[rec.actualOutcome.varianceDirection];
                const VIcon = vc?.icon;
                return vc ? (
                  <div className={`inline-flex items-center gap-1 text-[11px] font-semibold ${vc.color}`}>
                    <VIcon className="w-1.5 h-1.5" />
                    {rec.actualOutcome.variance} — {vc.label}
                  </div>
                ) : null;
              })()}

              {/* Stat comparison */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-accent/5 border border-accent/20 rounded-input">
                  <span className="text-[10px] font-bold text-accent block mb-1">▩ Predicted</span>
                  <div className="text-xs font-bold text-text">{formatCurrency(rec.predictedOutcome?.monthlyCost)}/mo</div>
                  <div className="text-[10px] text-success">{formatCurrency(rec.predictedOutcome?.monthlySavings)} saved</div>
                  <p className="text-[10px] text-textMuted mt-0.5 leading-tight">{rec.predictedOutcome?.reliabilityImpact}</p>
                </div>
                <div className="p-2 bg-success/5 border border-success/20 rounded-input">
                  <span className="text-[10px] font-bold text-success block mb-1">◇ Actual</span>
                  <div className="text-xs font-bold text-text">{formatCurrency(rec.actualOutcome.monthlyCost)}/mo</div>
                  <div className="text-[10px] text-success">{formatCurrency(rec.actualOutcome.monthlySavings)} saved</div>
                  <p className="text-[10px] text-textMuted mt-0.5 leading-tight">{rec.actualOutcome.reliabilityImpact}</p>
                </div>
              </div>

              {/* Outcome chart */}
              {rec.outcomeTimeSeries?.length > 0 && (
                <OutcomeComparisonChart data={rec.outcomeTimeSeries} height={160} />
              )}

              {rec.actualOutcome.notes && (
                <p className="text-[11px] text-textMuted leading-relaxed border-t border-border/60 pt-1.5">
                  <span className="font-semibold text-text">Note: </span>{rec.actualOutcome.notes}
                </p>
              )}
            </div>
          )}

          {/* Evidence links */}
          <div className="p-3 bg-bg border border-border rounded-card">
            <div className="flex items-center gap-1.5 text-xs font-bold text-text uppercase tracking-wider mb-2">
              <FileText className="w-1.5 h-1.5 text-textMuted" />
              Evidence Links
            </div>
            <div className="space-y-1.5">
              <Link
                to={`/telemetry?resource=${encodeURIComponent(rec.resourceId)}`}
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs text-accent hover:text-accentHover transition-colors"
              >
                <Activity className="w-1.5 h-1.5" />
                <span>View telemetry for <span className="font-mono">{rec.resourceName || rec.resourceId}</span></span>
                <ChevronRight className="w-1.5 h-1.5 ml-auto" />
              </Link>
              <Link
                to={`/forecasts?resource=${encodeURIComponent(rec.resourceId)}`}
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs text-accent hover:text-accentHover transition-colors"
              >
                <TrendingUp className="w-1.5 h-1.5" />
                <span>Forecast model for this resource</span>
                <ChevronRight className="w-1.5 h-1.5 ml-auto" />
              </Link>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-bg border border-border rounded-input">
              <span className="text-[10px] text-textMuted block">Current Monthly Cost</span>
              <span className="font-bold text-text">{formatCurrency(rec.currentCost)}</span>
            </div>
            <div className="p-2.5 bg-success/5 border border-success/20 rounded-input">
              <span className="text-[10px] text-textMuted block">Estimated Monthly Cost</span>
              <span className="font-bold text-success">{formatCurrency(rec.estimatedCost)}</span>
            </div>
          </div>

          {/* Disclaimer for non-pending */}
          {!isPending && (
            <div className="flex items-center gap-1.5 p-2.5 bg-bg border border-border rounded-input text-xs text-textMuted">
              <Info className="w-1.5 h-1.5 shrink-0 text-info" />
              This recommendation has been {rec.status.toLowerCase()}. No further action required.
            </div>
          )}
        </div>

        {/* ── FOOTER — Approve / Reject ─────────────────── */}
        <div className="sticky bottom-0 bg-surface border-t border-border px-4 py-3 flex items-center gap-2">
          {isPending ? (
            <>
              <button
                type="button"
                disabled={isMutating}
                onClick={() => setConfirmAction('reject')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-btn text-xs font-semibold border border-critical/40 text-critical hover:bg-critical/10 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-critical"
              >
                {rejectMutation.isPending ? <Loader2 className="w-2 h-2 animate-spin" /> : <XCircle className="w-2 h-2" />}
                Reject
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={() => setConfirmAction('approve')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-btn text-xs font-semibold bg-accent hover:bg-accentHover text-white transition-colors disabled:opacity-50 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {approveMutation.isPending ? <Loader2 className="w-2 h-2 animate-spin" /> : <CheckCircle2 className="w-2 h-2" />}
                Approve
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto px-3 py-1.5 rounded-btn text-xs font-medium bg-bg border border-border text-text hover:bg-surface transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* ── CONFIRM DIALOGS ────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmAction === 'approve'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleApprove}
        title={`Approve Recommendation ${rec.id}?`}
        description="This will queue the architecture change for automated deployment. Human approval is required before any AWS action is taken."
        confirmText="Approve & Queue"
        variant="accent"
        isLoading={approveMutation.isPending}
      >
        <div className="p-2.5 bg-bg border border-border rounded-input text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-textMuted">Monthly savings:</span>
            <span className="text-success font-bold">{formatCurrency(rec.monthlySavings)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-textMuted">Risk level:</span>
            <span className="text-text">{rec.riskLevel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-textMuted">AI confidence:</span>
            <span className="text-text">{Math.round((rec.confidenceScore ?? 0) * 100)}%</span>
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={confirmAction === 'reject'}
        onClose={() => { setConfirmAction(null); setRejectReason(''); }}
        onConfirm={handleReject}
        title={`Reject Recommendation ${rec.id}?`}
        description="This recommendation will be dismissed. You can optionally provide a reason to improve future AI proposals."
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
            placeholder="e.g. Pending architecture migration next quarter..."
            className="w-full px-2.5 py-1.5 bg-bg border border-border rounded-input text-xs text-text placeholder:text-textMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none transition-colors"
          />
        </div>
      </ConfirmDialog>
    </>
  );
}

export default RecommendationDrawer;

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Activity,
  Sparkles,
  Server,
  Layers,
} from 'lucide-react';
import { StatusChip } from '../../../components/feedback/StatusChip';
import { TimeSeriesChart } from '../../../components/charts/TimeSeriesChart';
import { formatTimestamp } from '../../../lib/formatters';

/**
 * AnomalyDetailDrawer Component
 * Accessible slide-over drawer displaying deep-dive anomaly diagnostics,
 * zoomed time-series chart excerpt, and direct links to related AI recommendations.
 */
export function AnomalyDetailDrawer({
  anomaly,
  isOpen,
  onClose,
}) {
  const drawerRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  // Focus management: save previous active element and focus drawer on open, restore on close
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

  // ESC key listener & Tab/Shift+Tab focus trap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
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
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !anomaly) return null;

  // Generate zoomed synthetic time series excerpt for the anomaly window (e.g. 12 sample points around anomaly)
  const zoomedChartData = [
    { timestamp: 'T-50m', baseline: 100, observed: 98, isAnomaly: false },
    { timestamp: 'T-40m', baseline: 100, observed: 104, isAnomaly: false },
    { timestamp: 'T-30m', baseline: 100, observed: 110, isAnomaly: false },
    { timestamp: 'T-20m', baseline: 100, observed: 180, isAnomaly: false },
    { timestamp: 'T-10m', baseline: 100, observed: 340, isAnomaly: false },
    { timestamp: 'Incident', baseline: 100, observed: 480, isAnomaly: true, anomalyReason: anomaly.rootCause },
    { timestamp: 'T+10m', baseline: 100, observed: 460, isAnomaly: true },
    { timestamp: 'T+20m', baseline: 100, observed: 390, isAnomaly: false },
    { timestamp: 'T+30m', baseline: 100, observed: 210, isAnomaly: false },
    { timestamp: 'T+40m', baseline: 100, observed: 115, isAnomaly: false },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="anomaly-drawer-title"
    >
      <div
        ref={drawerRef}
        tabIndex={-1}
        className="w-full max-w-xl bg-surface border-l border-border h-full overflow-y-auto p-4 shadow-sm flex flex-col justify-between outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          {/* Drawer Header */}
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusChip status={anomaly.severity} />
                <StatusChip status={anomaly.status} />
                <span className="text-[11px] font-mono text-textMuted">{anomaly.id}</span>
              </div>
              <h2 id="anomaly-drawer-title" className="text-base font-bold text-text">
                {anomaly.title}
              </h2>
              <p className="text-xs text-textMuted">
                Detected: {formatTimestamp(anomaly.detectedAt)}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close incident drawer"
              className="text-textMuted hover:text-text p-1 rounded-btn hover:bg-bg transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Key Metric Comparison Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 bg-bg border border-border rounded-input">
              <span className="text-[11px] text-textMuted block">Z-Score Deviation</span>
              <span className="text-base font-bold text-critical font-mono">z = {anomaly.zScore}</span>
            </div>
            <div className="p-2.5 bg-bg border border-border rounded-input">
              <span className="text-[11px] text-textMuted block">Deviation %</span>
              <span className="text-base font-bold text-critical font-mono">{anomaly.deviationPercent}</span>
            </div>
            <div className="p-2.5 bg-bg border border-border rounded-input">
              <span className="text-[11px] text-textMuted block">Expected Baseline</span>
              <span className="text-xs font-semibold text-text truncate block">{anomaly.baselineValue}</span>
            </div>
            <div className="p-2.5 bg-bg border border-border rounded-input">
              <span className="text-[11px] text-textMuted block">Observed Value</span>
              <span className="text-xs font-semibold text-critical truncate block">{anomaly.anomalyValue}</span>
            </div>
          </div>

          {/* Root Cause & Impact */}
          <div className="p-3 bg-bg border border-border rounded-card space-y-2">
            <div>
              <span className="text-xs font-bold text-text uppercase tracking-wider block mb-0.5">
                Root Cause Analysis
              </span>
              <p className="text-xs text-text leading-relaxed">
                {anomaly.rootCause}
              </p>
            </div>
            <div className="pt-2 border-t border-border/60">
              <span className="text-xs font-bold text-textMuted uppercase tracking-wider block mb-0.5">
                Impact Summary
              </span>
              <p className="text-xs text-textMuted">
                {anomaly.impactSummary}
              </p>
            </div>
          </div>

          {/* Zoomed Time Series Chart Excerpt */}
          <div className="p-3 bg-bg border border-border rounded-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-1.5 h-1.5 text-accent" />
                Incident Time Window Excerpt
              </span>
              <span className="text-[11px] text-critical font-medium">Spike Highlighted</span>
            </div>
            <TimeSeriesChart
              data={zoomedChartData}
              xAxisKey="timestamp"
              height={190}
              series={[
                { key: 'baseline', name: 'Expected Baseline', color: 'var(--text-muted)', strokeDasharray: '3 3' },
                { key: 'observed', name: 'Observed Telemetry', color: 'var(--critical)' },
              ]}
            />
          </div>

          {/* Related AI Recommendation Link */}
          {anomaly.recommendedActionId ? (
            <div className="p-3 bg-accent/10 border border-accent/30 rounded-card space-y-2">
              <div className="flex items-center gap-1.5 text-accent font-bold text-xs">
                <Sparkles className="w-2 h-2" />
                <span>AI Optimization Proposal Available</span>
              </div>
              <p className="text-xs text-textMuted">
                Our decision support agent has synthesized an architecture recommendation to permanently remediate this recurring condition.
              </p>
              <Link
                to={`/recommendations/${anomaly.recommendedActionId}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-bold bg-accent hover:bg-accentHover text-white transition-colors shadow-xs"
              >
                <span>View Recommendation ({anomaly.recommendedActionId})</span>
                <ArrowRight className="w-1.5 h-1.5" />
              </Link>
            </div>
          ) : (
            <div className="p-3 bg-surface border border-border rounded-input text-xs text-textMuted">
              No automated architecture proposal linked to this transient incident.
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-textMuted mt-4">
          <span>Target: <strong className="text-text font-mono">{anomaly.resourceName || anomaly.resourceId}</strong> ({anomaly.service})</span>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-btn text-xs font-medium bg-surface border border-border hover:bg-bg text-text"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnomalyDetailDrawer;

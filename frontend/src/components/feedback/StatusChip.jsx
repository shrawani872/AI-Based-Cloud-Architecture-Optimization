import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  XCircle,
  Info as InfoIcon,
  MinusCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Search,
  Activity,
} from 'lucide-react';

const STATUS_CONFIGS = {
  // --- Severities ---
  critical: {
    icon: AlertOctagon,
    subtle: 'bg-critical/10 text-critical border-critical/20',
    solid: 'bg-critical text-white border-transparent',
    outline: 'border-critical text-critical bg-transparent',
    defaultLabel: 'Critical',
  },
  high: {
    icon: AlertTriangle,
    subtle: 'bg-warning/15 text-warning border-warning/30',
    solid: 'bg-warning text-white border-transparent',
    outline: 'border-warning text-warning bg-transparent',
    defaultLabel: 'High',
  },
  medium: {
    icon: AlertCircle,
    subtle: 'bg-warning/10 text-warning border-warning/20',
    solid: 'bg-warning text-white border-transparent',
    outline: 'border-warning text-warning bg-transparent',
    defaultLabel: 'Medium',
  },
  low: {
    icon: InfoIcon,
    subtle: 'bg-info/10 text-info border-info/20',
    solid: 'bg-info text-white border-transparent',
    outline: 'border-info text-info bg-transparent',
    defaultLabel: 'Low',
  },
  info: {
    icon: MinusCircle,
    subtle: 'bg-surface text-textMuted border-border',
    solid: 'bg-textMuted text-white border-transparent',
    outline: 'border-border text-textMuted bg-transparent',
    defaultLabel: 'Info',
  },

  // --- Incident States ---
  active: {
    icon: Activity,
    subtle: 'bg-critical/10 text-critical border-critical/20 font-semibold',
    solid: 'bg-critical text-white border-transparent',
    outline: 'border-critical text-critical bg-transparent',
    defaultLabel: 'Active',
  },
  investigating: {
    icon: Search,
    subtle: 'bg-warning/10 text-warning border-warning/20',
    solid: 'bg-warning text-white border-transparent',
    outline: 'border-warning text-warning bg-transparent',
    defaultLabel: 'Investigating',
  },
  resolved: {
    icon: CheckCircle2,
    subtle: 'bg-success/10 text-success border-success/20',
    solid: 'bg-success text-white border-transparent',
    outline: 'border-success text-success bg-transparent',
    defaultLabel: 'Resolved',
  },

  // --- Standard Decision States ---
  success: {
    icon: CheckCircle2,
    subtle: 'bg-success/10 text-success border-success/20',
    solid: 'bg-success text-white border-transparent',
    outline: 'border-success text-success bg-transparent',
    defaultLabel: 'Success',
  },
  approved: {
    icon: ShieldCheck,
    subtle: 'bg-success/10 text-success border-success/20',
    solid: 'bg-success text-white border-transparent',
    outline: 'border-success text-success bg-transparent',
    defaultLabel: 'Approved',
  },
  healthy: {
    icon: CheckCircle2,
    subtle: 'bg-success/10 text-success border-success/20',
    solid: 'bg-success text-white border-transparent',
    outline: 'border-success text-success bg-transparent',
    defaultLabel: 'Healthy',
  },
  degraded: {
    icon: AlertTriangle,
    subtle: 'bg-warning/15 text-warning border-warning/30',
    solid: 'bg-warning text-white border-transparent',
    outline: 'border-warning text-warning bg-transparent',
    defaultLabel: 'Degraded',
  },
  down: {
    icon: XCircle,
    subtle: 'bg-critical/15 text-critical border-critical/30',
    solid: 'bg-critical text-white border-transparent',
    outline: 'border-critical text-critical bg-transparent',
    defaultLabel: 'Down',
  },
  warning: {
    icon: AlertTriangle,
    subtle: 'bg-warning/10 text-warning border-warning/20',
    solid: 'bg-warning text-white border-transparent',
    outline: 'border-warning text-warning bg-transparent',
    defaultLabel: 'Warning',
  },
  pending: {
    icon: Clock,
    subtle: 'bg-warning/10 text-warning border-warning/20',
    solid: 'bg-warning text-white border-transparent',
    outline: 'border-warning text-warning bg-transparent',
    defaultLabel: 'Pending Review',
  },
  rejected: {
    icon: ShieldAlert,
    subtle: 'bg-critical/10 text-critical border-critical/20',
    solid: 'bg-critical text-white border-transparent',
    outline: 'border-critical text-critical bg-transparent',
    defaultLabel: 'Rejected',
  },
  neutral: {
    icon: MinusCircle,
    subtle: 'bg-surface border-border text-textMuted',
    solid: 'bg-textMuted text-white border-transparent',
    outline: 'border-border text-textMuted bg-transparent',
    defaultLabel: 'Neutral',
  },
  optimized: {
    icon: Sparkles,
    subtle: 'bg-accent/10 text-accent border-accent/20',
    solid: 'bg-accent text-white border-transparent',
    outline: 'border-accent text-accent bg-transparent',
    defaultLabel: 'Optimized',
  },
};

/**
 * StatusChip Component
 * Accessible status indicator combining iconography and text labels.
 * @param {Object} props
 * @param {string} [props.status='neutral'] - Status category
 * @param {string} [props.label] - Custom label text
 * @param {'subtle' | 'solid' | 'outline'} [props.variant='subtle'] - Visual style variant
 * @param {string} [props.className] - Additional class names
 */
export function StatusChip({
  status = 'neutral',
  label,
  variant = 'subtle',
  className = '',
}) {
  const normalizedStatus = String(status).toLowerCase();
  const config = STATUS_CONFIGS[normalizedStatus] || STATUS_CONFIGS.neutral;
  const Icon = config.icon;
  const textLabel = label || config.defaultLabel;
  const variantClass = config[variant] || config.subtle;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-input text-xs font-medium border ${variantClass} transition-colors duration-fast ${className}`}
      role="status"
    >
      <Icon className="w-1.5 h-1.5 flex-shrink-0" aria-hidden="true" />
      <span className="truncate">{textLabel}</span>
    </span>
  );
}

export default StatusChip;

import React from 'react';
import {
  TrendingDown,
  HardDrive,
  Cpu,
  Layers,
  DollarSign,
  Zap,
  Tag,
} from 'lucide-react';

const CATEGORY_CONFIGS = {
  RIGHTSIZING: { icon: TrendingDown, label: 'Rightsizing', color: 'text-accent bg-accent/10 border-accent/20' },
  STORAGE_TIER: { icon: HardDrive, label: 'Storage Tier', color: 'text-info bg-info/10 border-info/20' },
  ARCH_MODERNIZATION: { icon: Layers, label: 'Arch Modernization', color: 'text-warning bg-warning/10 border-warning/20' },
  SAVINGS_PLAN: { icon: DollarSign, label: 'Savings Plan', color: 'text-success bg-success/10 border-success/20' },
  NETWORKING: { icon: Zap, label: 'Networking', color: 'text-accent bg-accent/10 border-accent/20' },
  COMPUTE: { icon: Cpu, label: 'Compute', color: 'text-warning bg-warning/10 border-warning/20' },
};

const RISK_CONFIGS = {
  LOW: { label: 'Low Risk', color: 'text-success bg-success/10 border-success/20' },
  MEDIUM: { label: 'Med Risk', color: 'text-warning bg-warning/10 border-warning/20' },
  HIGH: { label: 'High Risk', color: 'text-critical bg-critical/10 border-critical/20' },
};

/**
 * Category badge for recommendation types
 */
export function CategoryBadge({ category, className = '' }) {
  const config = CATEGORY_CONFIGS[category] || { icon: Tag, label: category || 'Other', color: 'text-textMuted bg-surface border-border' };
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-input text-[11px] font-medium border ${config.color} ${className}`}>
      <Icon className="w-1.5 h-1.5 flex-shrink-0" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Risk level badge
 */
export function RiskBadge({ riskLevel, className = '' }) {
  const config = RISK_CONFIGS[riskLevel] || { label: riskLevel || 'Unknown', color: 'text-textMuted bg-surface border-border' };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-input text-[11px] font-medium border ${config.color} ${className}`}>
      {config.label}
    </span>
  );
}

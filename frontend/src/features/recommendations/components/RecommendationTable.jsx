import React from 'react';
import { ArrowUpDown, ArrowRight, TrendingDown, ChevronRight } from 'lucide-react';
import { StatusChip } from '../../../components/feedback/StatusChip';
import { CategoryBadge, RiskBadge } from './RecommendationStatusBadge';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { formatCurrency, formatTimestamp } from '../../../lib/formatters';

const COLUMNS = [
  { key: 'category', label: 'Type' },
  { key: 'riskLevel', label: 'Risk' },
  { key: 'resourceName', label: 'Resource' },
  { key: 'title', label: 'Reason', className: 'max-w-[200px]' },
  { key: 'monthlySavings', label: 'Monthly Savings' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created' },
  { key: '_action', label: '' },
];

/**
 * RecommendationTable — desktop DataTable for recommendations list
 */
export function RecommendationTable({ recommendations, onRowClick, page, pageSize, onPageChange }) {
  const start = (page - 1) * pageSize;
  const pageItems = recommendations.slice(start, start + pageSize);

  if (recommendations.length === 0) {
    return (
      <EmptyState
        title="No recommendations found"
        description="Adjust your filters or wait for the AI engine to process new telemetry."
      />
    );
  }

  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-xs" role="grid">
          <thead>
            <tr className="border-b border-border bg-bg">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-3 py-2 text-left text-[11px] font-semibold text-textMuted uppercase tracking-wider whitespace-nowrap ${col.className || ''}`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.key !== '_action' && col.label && (
                      <ArrowUpDown className="w-1 h-1 text-border" aria-hidden="true" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageItems.map((rec) => (
              <tr
                key={rec.id}
                onClick={() => onRowClick(rec)}
                role="row"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onRowClick(rec)}
                className="hover:bg-bg cursor-pointer transition-colors duration-fast group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
              >
                <td className="px-3 py-2.5">
                  <CategoryBadge category={rec.category} />
                </td>
                <td className="px-3 py-2.5">
                  <RiskBadge riskLevel={rec.riskLevel} />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] text-text truncate max-w-[120px]">
                      {rec.resourceName || rec.resourceId}
                    </span>
                    <span className="text-[10px] text-textMuted">{rec.service}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 max-w-[200px]">
                  <p className="text-xs text-text line-clamp-2 leading-snug">{rec.title}</p>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1 text-success font-bold">
                    <TrendingDown className="w-1.5 h-1.5" aria-hidden="true" />
                    <span>{formatCurrency(rec.monthlySavings)}</span>
                  </div>
                  <span className="text-[10px] text-textMuted">
                    {rec.savingsPercent}% reduction
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <StatusChip status={rec.status} />
                </td>
                <td className="px-3 py-2.5 text-[11px] text-textMuted whitespace-nowrap">
                  {formatTimestamp(rec.createdAt)}
                </td>
                <td className="px-3 py-2.5">
                  <ChevronRight
                    className="w-2 h-2 text-border group-hover:text-accent transition-colors"
                    aria-hidden="true"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {recommendations.length > pageSize && (
        <div className="border-t border-border px-3 py-2">
          <Pagination
            currentPage={page}
            totalItems={recommendations.length}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

export default RecommendationTable;

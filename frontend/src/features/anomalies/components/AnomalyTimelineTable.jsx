import React, { useState } from 'react';
import { DataTable } from '../../../components/ui/DataTable';
import { Pagination } from '../../../components/ui/Pagination';
import { StatusChip } from '../../../components/feedback/StatusChip';
import { formatTimestamp } from '../../../lib/formatters';
import { AlertCircle, ChevronRight, Sparkles } from 'lucide-react';

/**
 * AnomalyTimelineTable Component
 * Renders the interactive incident log table with 5-severity chips, z-scores, and row click handlers.
 */
export function AnomalyTimelineTable({
  anomalies = [],
  onRowClick,
  pageSize = 6,
  className = '',
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(anomalies.length / pageSize) || 1;
  const start = (currentPage - 1) * pageSize;
  const paginatedData = anomalies.slice(start, start + pageSize);

  const columns = [
    {
      key: 'severity',
      header: 'Severity',
      render: (item) => <StatusChip status={item.severity} />,
    },
    {
      key: 'zScore',
      header: 'Z-Score',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-critical">
          z = {item.zScore}
        </span>
      ),
    },
    {
      key: 'resource',
      header: 'Resource & Service',
      render: (item) => (
        <div>
          <span className="font-semibold text-text block truncate max-w-xs">{item.resourceName}</span>
          <span className="text-[11px] text-textMuted font-mono block">
            {item.service} • {item.resourceId}
          </span>
        </div>
      ),
    },
    {
      key: 'detectedAt',
      header: 'Start Time',
      render: (item) => (
        <span className="text-text font-medium text-xs">
          {formatTimestamp(item.detectedAt)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'State',
      render: (item) => <StatusChip status={item.status} />,
    },
    {
      key: 'rootCause',
      header: 'Diagnosed Root Cause',
      render: (item) => (
        <div className="flex items-center justify-between gap-2 max-w-sm">
          <span className="text-xs text-textMuted line-clamp-1 truncate">{item.rootCause}</span>
          {item.recommendedActionId && (
            <span
              title="AI Proposal Linked"
              className="w-4 h-4 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent flex-shrink-0"
            >
              <Sparkles className="w-2 h-2" />
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={`p-3 bg-surface border border-border rounded-card space-y-3 ${className}`}>
      <DataTable
        columns={columns}
        data={paginatedData}
        keyField="id"
        onRowClick={onRowClick}
        emptyTitle="No Anomaly Incidents Found"
        emptyDescription="No anomalies match your current filter criteria."
      />

      {anomalies.length > pageSize && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={anomalies.length}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

export default AnomalyTimelineTable;

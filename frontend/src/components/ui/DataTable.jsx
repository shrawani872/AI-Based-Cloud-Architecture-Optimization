import React from 'react';
import { EmptyState } from '../feedback/EmptyState';
import { Skeleton } from '../feedback/Skeleton';

/**
 * DataTable Component
 * Responsive generic table that renders a <table> on screens >=640px
 * and automatically switches to stacked cards on screens <640px.
 *
 * @param {Object} props
 * @param {Array<{ key: string, header: string | React.ReactNode, render?: (item: any, idx: number) => React.ReactNode, align?: 'left' | 'center' | 'right', hideOnMobile?: boolean }>} props.columns
 * @param {Array<any>} props.data - Array of row objects
 * @param {string} [props.keyField='id'] - Key field identifier
 * @param {boolean} [props.isLoading=false]
 * @param {string} [props.emptyTitle='No records found']
 * @param {string} [props.emptyDescription]
 * @param {(item: any) => void} [props.onRowClick]
 * @param {(item: any, idx: number) => React.ReactNode} [props.renderCard] - Custom mobile card renderer
 * @param {string} [props.className]
 */
export function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your criteria.',
  onRowClick,
  renderCard,
  className = '',
}) {
  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {/* Desktop Table Skeleton */}
        <div className="hidden sm:block border border-border rounded-card overflow-hidden bg-surface">
          <div className="h-6 bg-border/40 border-b border-border flex items-center px-3 gap-3">
            {columns.map((col, idx) => (
              <div key={idx} className="h-2 bg-border/60 rounded-input flex-1" />
            ))}
          </div>
          {[1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="h-7 border-b border-border/60 flex items-center px-3 gap-3"
            >
              {columns.map((col, idx) => (
                <div key={idx} className="h-2 bg-border/40 rounded-input flex-1" />
              ))}
            </div>
          ))}
        </div>

        {/* Mobile Stacked Card Skeleton */}
        <div className="sm:hidden space-y-2">
          {[1, 2, 3].map((card) => (
            <div key={card} className="p-3 bg-surface border border-border rounded-card space-y-2">
              <div className="h-3 w-32 bg-border/60 rounded-input" />
              <div className="h-2 w-full bg-border/40 rounded-input" />
              <div className="h-2 w-2/3 bg-border/40 rounded-input" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Empty State
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    );
  }

  // Virtualization safeguard for large datasets (>200 items)
  const isLargeDataset = data.length > 200;
  const [scrollTop, setScrollTop] = React.useState(0);
  const rowHeight = 36;
  const visibleCount = 40;

  const startIndex = isLargeDataset ? Math.max(0, Math.floor(scrollTop / rowHeight) - 5) : 0;
  const endIndex = isLargeDataset ? Math.min(data.length, startIndex + visibleCount + 10) : data.length;
  const visibleData = isLargeDataset ? data.slice(startIndex, endIndex) : data;
  const topPadding = isLargeDataset ? startIndex * rowHeight : 0;
  const bottomPadding = isLargeDataset ? (data.length - endIndex) * rowHeight : 0;

  const handleTableScroll = (e) => {
    if (isLargeDataset) {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop & Tablet Table (>= 640px) */}
      <div className="hidden sm:block border border-border rounded-card overflow-hidden bg-surface">
        <div
          className={`overflow-x-auto ${isLargeDataset ? 'max-h-[600px] overflow-y-auto' : ''}`}
          onScroll={handleTableScroll}
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg/50 text-textMuted font-semibold">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-3 py-2 ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topPadding > 0 && (
                <tr style={{ height: `${topPadding}px` }} aria-hidden="true">
                  <td colSpan={columns.length} />
                </tr>
              )}
              {visibleData.map((item, rowIdx) => {
                const actualIndex = startIndex + rowIdx;
                const rowKey = item[keyField] ?? actualIndex;
                return (
                  <tr
                    key={rowKey}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                    className={`transition-colors duration-fast ${
                      onRowClick ? 'cursor-pointer hover:bg-bg/80' : 'hover:bg-bg/40'
                    }`}
                  >
                    {columns.map((col) => {
                      const cellContent = col.render
                        ? col.render(item, rowIdx)
                        : item[col.key] ?? '—';

                      return (
                        <td
                          key={col.key}
                          className={`px-3 py-2 text-text align-middle ${
                            col.align === 'right'
                              ? 'text-right'
                              : col.align === 'center'
                              ? 'text-center'
                              : 'text-left'
                          }`}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {bottomPadding > 0 && (
                <tr style={{ height: `${bottomPadding}px` }} aria-hidden="true">
                  <td colSpan={columns.length} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards (< 640px) */}
      <div className="sm:hidden space-y-2" role="feed" aria-label="Records list">
        {data.map((item, idx) => {
          const cardKey = item[keyField] ?? idx;

          if (renderCard) {
            return (
              <div key={cardKey} onClick={onRowClick ? () => onRowClick(item) : undefined}>
                {renderCard(item, idx)}
              </div>
            );
          }

          // Default auto-generated card from columns
          return (
            <div
              key={cardKey}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              className={`p-3 bg-surface border border-border rounded-card space-y-1.5 transition-colors ${
                onRowClick ? 'cursor-pointer active:bg-bg' : ''
              }`}
            >
              {columns.map((col) => {
                if (col.hideOnMobile) return null;
                const content = col.render
                  ? col.render(item, idx)
                  : item[col.key] ?? '—';

                return (
                  <div key={col.key} className="flex items-center justify-between text-xs gap-2">
                    <span className="text-textMuted font-medium">{col.header}:</span>
                    <span className="text-text font-normal text-right">{content}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DataTable;

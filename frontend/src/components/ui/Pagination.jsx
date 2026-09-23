import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination Component
 * @param {Object} props
 * @param {number} props.page - Current 1-based page number
 * @param {number} props.totalPages - Total number of pages
 * @param {(newPage: number) => void} props.onPageChange - Handler for page updates
 * @param {number} [props.totalItems] - Optional total record count
 * @param {number} [props.pageSize] - Optional page size
 * @param {string} [props.className]
 */
export function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  pageSize,
  className = '',
}) {
  if (totalPages <= 1 && !totalItems) return null;

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (page < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      className={`flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text ${className}`}
      aria-label="Pagination Navigation"
    >
      {/* Item range indicator */}
      {totalItems !== undefined && pageSize !== undefined ? (
        <div className="text-textMuted text-xs">
          Showing <span className="font-medium text-text">{(page - 1) * pageSize + 1}</span> to{' '}
          <span className="font-medium text-text">{Math.min(page * pageSize, totalItems)}</span> of{' '}
          <span className="font-medium text-text">{totalItems}</span> results
        </div>
      ) : (
        <div className="text-textMuted text-xs">
          Page <span className="font-medium text-text">{page}</span> of{' '}
          <span className="font-medium text-text">{totalPages}</span>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="inline-flex items-center gap-1">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange?.(page - 1)}
          disabled={page <= 1}
          aria-label="Go to previous page"
          className="p-1 rounded-btn border border-border bg-surface text-text hover:bg-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-2 h-2" />
        </button>

        {/* Numeric Page Buttons */}
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-1 text-textMuted">
                ...
              </span>
            );
          }

          const isActive = page === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange?.(p)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Go to page ${p}`}
              className={`w-4 h-4 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-btn text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-white font-bold shadow-xs'
                  : 'border border-border bg-surface text-text hover:bg-bg'
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange?.(page + 1)}
          disabled={page >= totalPages}
          aria-label="Go to next page"
          className="p-1 rounded-btn border border-border bg-surface text-text hover:bg-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-2 h-2" />
        </button>
      </div>
    </nav>
  );
}

export default Pagination;

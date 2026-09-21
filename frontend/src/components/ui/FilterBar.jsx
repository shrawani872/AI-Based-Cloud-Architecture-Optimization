import React from 'react';
import { X, Filter } from 'lucide-react';

/**
 * FilterBar Component
 * Wraps search input, select dropdowns, date picker, and active filter chips with a "Clear all" button.
 * @param {Object} props
 * @param {React.ReactNode} [props.searchSlot] - Search input component slot
 * @param {React.ReactNode} [props.filtersSlot] - Dropdowns and filter controls slot
 * @param {Array<{ key: string, label: string, value: string }>} [props.activeFilters=[]] - Active filter tags
 * @param {(filterKey: string) => void} [props.onRemoveFilter] - Callback when a filter tag is dismissed
 * @param {() => void} [props.onClearAll] - Callback to reset all filters
 * @param {string} [props.className]
 */
export function FilterBar({
  searchSlot,
  filtersSlot,
  activeFilters = [],
  onRemoveFilter,
  onClearAll,
  className = '',
}) {
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Controls Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        {searchSlot && <div className="w-full md:w-72">{searchSlot}</div>}
        {filtersSlot && (
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            {filtersSlot}
          </div>
        )}
      </div>

      {/* Active Filter Chips Row */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border">
          <div className="flex items-center gap-1 text-[11px] text-textMuted font-medium">
            <Filter className="w-1.5 h-1.5" />
            <span>Active filters:</span>
          </div>

          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-input bg-surface border border-border text-xs text-text"
            >
              <span className="text-textMuted">{filter.label}:</span>
              <span className="font-semibold text-accent">{filter.value}</span>
              <button
                type="button"
                onClick={() => onRemoveFilter?.(filter.key)}
                aria-label={`Remove filter for ${filter.label}`}
                className="text-textMuted hover:text-text ml-0.5 rounded-btn p-0.5"
              >
                <X className="w-1.5 h-1.5" />
              </button>
            </span>
          ))}

          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-accent hover:underline font-medium ml-1"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterBar;

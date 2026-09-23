import React from 'react';
import { Select } from '../../../components/ui/Select';
import { SearchInput } from '../../../components/ui/SearchInput';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'RIGHTSIZING', label: 'Rightsizing' },
  { value: 'STORAGE_TIER', label: 'Storage Tier' },
  { value: 'ARCH_MODERNIZATION', label: 'Arch Modernization' },
  { value: 'SAVINGS_PLAN', label: 'Savings Plan' },
  { value: 'NETWORKING', label: 'Networking' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Outcomes' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DISMISSED', label: 'Dismissed' },
];

/**
 * HistoryFilterBar — category type / outcome-status / search filters
 */
export function HistoryFilterBar({ filters, onFilterChange, onResetFilters }) {
  const set = (key) => (val) => onFilterChange({ ...filters, [key]: val });

  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.status !== 'all' ||
    filters.search;

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div className="flex-1 min-w-[180px]">
        <SearchInput
          value={filters.search}
          onSearch={set('search')}
          placeholder="Search title, resource, actor…"
        />
      </div>
      <Select
        value={filters.category}
        onChange={set('category')}
        options={CATEGORY_OPTIONS}
        className="w-36"
      />
      <Select
        value={filters.status}
        onChange={set('status')}
        options={STATUS_OPTIONS}
        className="w-36"
      />
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="px-2 py-1.5 text-xs text-textMuted border border-border rounded-btn hover:text-critical hover:border-critical/40 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export default HistoryFilterBar;

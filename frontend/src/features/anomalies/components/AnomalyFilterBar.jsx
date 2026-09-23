import React from 'react';
import { FilterBar } from '../../../components/ui/FilterBar';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Select } from '../../../components/ui/Select';

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'info', label: 'Info' },
];

const SERVICE_OPTIONS = [
  { value: 'all', label: 'All AWS Services' },
  { value: 'ec2', label: 'Amazon EC2' },
  { value: 'ebs', label: 'Amazon EBS' },
  { value: 'rds', label: 'Amazon RDS' },
  { value: 'lambda', label: 'AWS Lambda' },
  { value: 's3', label: 'Amazon S3' },
  { value: 'data transfer', label: 'AWS Data Transfer' },
];

const STATE_OPTIONS = [
  { value: 'all', label: 'All States' },
  { value: 'active', label: 'Active' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
];

/**
 * AnomalyFilterBar Component
 * Search and filtering controls for the anomaly incident timeline.
 */
export function AnomalyFilterBar({
  filters = {},
  onFilterChange,
  onResetFilters,
  className = '',
}) {
  const activeFilters = [];
  if (filters.severity && filters.severity !== 'all') {
    activeFilters.push({ key: 'severity', label: 'Severity', value: filters.severity.toUpperCase() });
  }
  if (filters.service && filters.service !== 'all') {
    activeFilters.push({ key: 'service', label: 'Service', value: filters.service.toUpperCase() });
  }
  if (filters.state && filters.state !== 'all') {
    activeFilters.push({ key: 'state', label: 'State', value: filters.state.toUpperCase() });
  }
  if (filters.search) {
    activeFilters.push({ key: 'search', label: 'Query', value: `"${filters.search}"` });
  }

  const handleRemoveFilter = (key) => {
    onFilterChange({
      ...filters,
      [key]: key === 'search' ? '' : 'all',
    });
  };

  return (
    <div className={`p-3 bg-surface border border-border rounded-card ${className}`}>
      <FilterBar
        searchSlot={
          <SearchInput
            placeholder="Search incident title, resource, ID..."
            value={filters.search || ''}
            onSearch={(search) => onFilterChange({ ...filters, search })}
          />
        }
        filtersSlot={
          <>
            <div className="w-36">
              <Select
                value={filters.severity || 'all'}
                onChange={(severity) => onFilterChange({ ...filters, severity })}
                options={SEVERITY_OPTIONS}
              />
            </div>
            <div className="w-44">
              <Select
                value={filters.service || 'all'}
                onChange={(service) => onFilterChange({ ...filters, service })}
                options={SERVICE_OPTIONS}
              />
            </div>
            <div className="w-36">
              <Select
                value={filters.state || 'all'}
                onChange={(state) => onFilterChange({ ...filters, state })}
                options={STATE_OPTIONS}
              />
            </div>
          </>
        }
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={onResetFilters}
      />
    </div>
  );
}

export default AnomalyFilterBar;

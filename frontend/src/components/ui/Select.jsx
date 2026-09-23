import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Select Component
 * @param {Object} props
 * @param {string | number} props.value - Selected value
 * @param {(value: string) => void} props.onChange - Selection change handler
 * @param {Array<{ value: string | number, label: string } | string>} props.options - Option items
 * @param {string} [props.placeholder='Select an option']
 * @param {string} [props.label] - Optional field label
 * @param {string} [props.error] - Optional error message
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.className]
 */
export function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  className = '',
  id,
  ...props
}) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-textMuted">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={`w-full appearance-none px-2.5 py-1.5 pr-6 bg-surface border rounded-input text-xs text-text border-border hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-critical focus-visible:ring-critical' : ''
          }`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-textMuted bg-surface">
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val} className="bg-surface text-text">
                {lbl}
              </option>
            );
          })}
        </select>
        <ChevronDown
          className="w-2 h-2 text-textMuted pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
          aria-hidden="true"
        />
      </div>
      {error && <span className="text-[11px] text-critical">{error}</span>}
    </div>
  );
}

export default Select;

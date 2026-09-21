import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

/**
 * SearchInput Component
 * Controlled search input with built-in debouncing.
 * @param {Object} props
 * @param {string} [props.value] - External controlled value (optional)
 * @param {(debouncedValue: string) => void} props.onSearch - Called whenever the debounced value changes
 * @param {number} [props.delay=350] - Debounce delay in ms
 * @param {string} [props.placeholder='Search resources, alerts, actions...']
 * @param {string} [props.className]
 */
export function SearchInput({
  value: externalValue,
  onSearch,
  delay = 350,
  placeholder = 'Search...',
  className = '',
  id = 'search-input',
  ...props
}) {
  const [internalValue, setInternalValue] = useState(externalValue ?? '');
  const debouncedValue = useDebouncedValue(internalValue, delay);

  // Sync external value if provided
  useEffect(() => {
    if (externalValue !== undefined && externalValue !== internalValue) {
      setInternalValue(externalValue);
    }
  }, [externalValue]);

  // Trigger search callback on debounced change
  useEffect(() => {
    onSearch?.(debouncedValue);
  }, [debouncedValue, onSearch]);

  const handleClear = () => {
    setInternalValue('');
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        className="w-2 h-2 text-textMuted absolute left-2 pointer-events-none"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-6 pr-6 py-1.5 bg-surface border border-border rounded-input text-xs text-text placeholder:text-textMuted hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-fast"
        {...props}
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search input"
          className="absolute right-2 text-textMuted hover:text-text p-0.5 rounded-btn transition-colors"
        >
          <X className="w-1.5 h-1.5" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;

import { useState, useEffect } from 'react';

/**
 * useDebouncedValue hook
 * Debounces a fast-changing value by specified delay (e.g. search input).
 * @param {T} value - Target value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 350ms)
 * @returns {T} - Debounced value
 */
export function useDebouncedValue(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebouncedValue;

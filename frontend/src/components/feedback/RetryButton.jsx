import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';

/**
 * RetryButton Component
 * @param {Object} props
 * @param {() => Promise<any> | void} props.onRetry - Callback function invoked on click
 * @param {string} [props.label='Retry'] - Button label
 * @param {string} [props.className]
 */
export function RetryButton({
  onRetry,
  label = 'Retry',
  className = '',
  ...props
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e) => {
    if (!onRetry) return;
    try {
      setIsLoading(true);
      await onRetry(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-btn text-xs font-medium bg-surface text-text border border-border hover:bg-bg hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      <RotateCw
        className={`w-1.5 h-1.5 ${isLoading ? 'animate-spin text-accent' : ''}`}
        aria-hidden="true"
      />
      <span>{isLoading ? 'Retrying...' : label}</span>
    </button>
  );
}

export default RetryButton;

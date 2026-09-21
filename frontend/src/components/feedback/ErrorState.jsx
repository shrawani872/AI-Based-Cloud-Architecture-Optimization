import React from 'react';
import { AlertCircle, CloudOff } from 'lucide-react';
import { RetryButton } from './RetryButton';

/**
 * ErrorState Component
 * Displays a structured error alert with explicit stale/unavailable notice and retry action.
 * Rule: Never render fake zeroes on failure — show "stale/unavailable" explicitly.
 * @param {Object} props
 * @param {string} [props.title='Failed to load data']
 * @param {string} [props.message='The telemetry or metric stream is currently unavailable.']
 * @param {() => void} [props.onRetry] - Optional retry handler
 * @param {boolean} [props.isStale=false] - Whether data is stale or completely unavailable
 * @param {string} [props.className]
 */
export function ErrorState({
  title = 'Failed to load data',
  message = 'Telemetry or service metrics could not be retrieved from the backend.',
  onRetry,
  isStale = false,
  className = '',
}) {
  return (
    <div
      className={`p-4 bg-critical/5 border border-critical/20 rounded-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <div className="w-4 h-4 rounded-input bg-critical/10 border border-critical/20 flex items-center justify-center text-critical flex-shrink-0 mt-0.5 sm:mt-0">
          {isStale ? <CloudOff className="w-2 h-2" /> : <AlertCircle className="w-2 h-2" />}
        </div>
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-xs font-semibold text-critical">{title}</h4>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1 py-0.2 bg-critical/10 text-critical rounded">
              {isStale ? 'Stale Data' : 'Unavailable'}
            </span>
          </div>
          <p className="text-xs text-textMuted mt-0.5">{message}</p>
        </div>
      </div>

      {onRetry && (
        <div className="flex-shrink-0 self-end sm:self-center">
          <RetryButton onRetry={onRetry} />
        </div>
      )}
    </div>
  );
}

export default ErrorState;

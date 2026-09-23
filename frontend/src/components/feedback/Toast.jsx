import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const TOAST_ICONS = {
  success: { icon: CheckCircle2, color: 'text-success', border: 'border-success/30' },
  error: { icon: AlertCircle, color: 'text-critical', border: 'border-critical/30' },
  warning: { icon: AlertTriangle, color: 'text-warning', border: 'border-warning/30' },
  info: { icon: Info, color: 'text-info', border: 'border-info/30' },
};

/**
 * Toast Item Component
 */
export function Toast({
  id,
  type = 'info',
  title,
  message,
  duration = 4000,
  onDismiss,
}) {
  const [isPaused, setIsPaused] = useState(false);
  const config = TOAST_ICONS[type] || TOAST_ICONS.info;
  const Icon = config.icon;

  useEffect(() => {
    if (duration === Infinity || isPaused) return;

    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss, isPaused]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`w-full max-w-sm p-2.5 bg-surface border ${config.border} rounded-card shadow-sm flex items-start gap-2 text-text transition-all duration-normal pointer-events-auto`}
    >
      <div className={`mt-0.5 flex-shrink-0 ${config.color}`}>
        <Icon className="w-2 h-2" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        {title && <h5 className="text-xs font-semibold text-text">{title}</h5>}
        {message && <p className="text-xs text-textMuted mt-0.5 leading-snug">{message}</p>}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Close notification"
        className="text-textMuted hover:text-text p-0.5 rounded-btn transition-colors"
      >
        <X className="w-1.5 h-1.5" />
      </button>
    </div>
  );
}

export default Toast;

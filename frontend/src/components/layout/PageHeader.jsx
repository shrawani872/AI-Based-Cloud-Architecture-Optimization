import React from 'react';

/**
 * PageHeader Component
 * @param {Object} props
 * @param {string} props.title - Page title heading
 * @param {string} [props.subtitle] - Optional descriptive subtitle
 * @param {React.ReactNode} [props.actions] - Optional action buttons slot
 * @param {React.ReactNode} [props.badge] - Optional badge or status tag
 */
export function PageHeader({ title, subtitle, actions, badge, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-border ${className}`}>
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-text">
            {title}
          </h1>
          {badge && <div className="inline-flex">{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-xs text-textMuted">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;

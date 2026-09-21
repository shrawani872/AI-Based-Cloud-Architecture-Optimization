import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState Component
 * Displays a clean, user-friendly placeholder when a collection/list is empty.
 * @param {Object} props
 * @param {React.ElementType} [props.icon=Inbox] - Icon component
 * @param {string} [props.title='No items found'] - Main heading
 * @param {string} [props.description='There are no records matching your current filter criteria.'] - Description
 * @param {React.ReactNode} [props.action] - Optional action button slot
 * @param {string} [props.className]
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no records matching your current criteria.',
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-6 text-center bg-surface border border-border border-dashed rounded-card ${className}`}
      role="status"
    >
      <div className="w-6 h-6 rounded-full bg-bg border border-border flex items-center justify-center text-textMuted mb-2">
        <Icon className="w-3 h-3" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-text mb-1">{title}</h3>
      <p className="text-xs text-textMuted max-w-sm mb-3">{description}</p>
      {action && <div className="inline-flex items-center">{action}</div>}
    </div>
  );
}

export default EmptyState;

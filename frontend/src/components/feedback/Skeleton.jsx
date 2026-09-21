import React from 'react';

/**
 * Skeleton loading placeholder component
 * Features subtle shimmer with graceful fallback for prefers-reduced-motion.
 * @param {Object} props
 * @param {'text' | 'circular' | 'rectangular' | 'card'} [props.variant='rectangular']
 * @param {string | number} [props.width]
 * @param {string | number} [props.height]
 * @param {string} [props.className]
 */
export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  className = '',
  ...props
}) {
  const variantStyles = {
    text: 'h-2 w-full rounded-input',
    circular: 'rounded-full aspect-square',
    rectangular: 'rounded-input',
    card: 'rounded-card p-3 border border-border',
  };

  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      aria-hidden="true"
      style={style}
      className={`relative overflow-hidden bg-border/40 dark:bg-border/60 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-surface/40 before:to-transparent motion-reduce:before:hidden ${variantStyles[variant] || ''} ${className}`}
      {...props}
    />
  );
}

export default Skeleton;

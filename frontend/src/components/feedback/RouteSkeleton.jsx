import React from 'react';

/**
 * RouteSkeleton fallback component for lazy-loaded routes
 */
export function RouteSkeleton() {
  return (
    <div className="w-full space-y-3 p-3 animate-pulse" aria-busy="true" aria-label="Loading page content">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="space-y-1">
          <div className="h-4 w-48 bg-border rounded-input" />
          <div className="h-2 w-72 bg-border/60 rounded-input" />
        </div>
        <div className="h-4 w-28 bg-border rounded-input" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="p-3 bg-surface border border-border rounded-card space-y-2">
            <div className="h-2 w-20 bg-border/60 rounded-input" />
            <div className="h-5 w-32 bg-border rounded-input" />
            <div className="h-2 w-24 bg-border/40 rounded-input" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="p-4 bg-surface border border-border rounded-card h-64 flex flex-col justify-between">
        <div className="h-3 w-40 bg-border rounded-input" />
        <div className="space-y-2">
          <div className="h-2 w-full bg-border/40 rounded-input" />
          <div className="h-2 w-5/6 bg-border/40 rounded-input" />
          <div className="h-2 w-4/6 bg-border/40 rounded-input" />
        </div>
      </div>
    </div>
  );
}

export default RouteSkeleton;

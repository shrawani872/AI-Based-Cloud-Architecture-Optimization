import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { RotateCw, Sparkles, Cloud } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ScenarioSelector } from './ScenarioSelector';

const ROUTE_TITLES = {
  '/': 'Dashboard Overview',
  '/dashboard': 'Dashboard Overview',
  '/recommendations': 'AI Architecture Recommendations',
  '/telemetry': 'AWS CloudWatch Telemetry',
  '/forecasts': 'Resource & Cost Forecasting',
  '/anomalies': 'Anomaly & Incident Detection',
  '/history': 'Audit & Execution History',
  '/settings': 'Engine Configurations & Thresholds',
  '/system-status': 'System & Agent Status',
};

/**
 * TopBar Component
 * Global header containing:
 * - Current screen context title
 * - Environment Badge (Demo Mode)
 * - LastUpdated timer
 * - Global Refresh button
 * - ThemeToggle
 */
export function TopBar() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [relativeTime, setRelativeTime] = useState('just now');

  // Derive dynamic page title
  let currentTitle = ROUTE_TITLES[location.pathname];
  if (!currentTitle) {
    if (location.pathname.startsWith('/recommendations/')) {
      currentTitle = 'Recommendation Review';
    } else {
      currentTitle = 'Cloud Optimizer';
    }
  }

  // Update relative time display
  useEffect(() => {
    const updateRelative = () => {
      const diffSeconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (diffSeconds < 10) {
        setRelativeTime('just now');
      } else if (diffSeconds < 60) {
        setRelativeTime(`${diffSeconds}s ago`);
      } else {
        const mins = Math.floor(diffSeconds / 60);
        setRelativeTime(`${mins}m ago`);
      }
    };

    updateRelative();
    const interval = setInterval(updateRelative, 5000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await queryClient.invalidateQueries();
      setLastUpdated(new Date());
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <header className="h-6 bg-surface border-b border-border px-3 flex items-center justify-between sticky top-0 z-20 transition-colors duration-normal">
      {/* Left: Mobile Brand / Page Title */}
      <div className="flex items-center gap-2">
        <div className="md:hidden flex items-center gap-1.5 text-accent font-bold text-xs">
          <Cloud className="w-2.5 h-2.5" />
          <span className="text-text">CloudOptimizer</span>
        </div>
        <div className="hidden md:block">
          <h2 className="text-xs font-semibold text-text truncate">
            {currentTitle}
          </h2>
        </div>
      </div>

      {/* Right: Actions & Badges */}
      <div className="flex items-center gap-2">
        {/* Dev Mock Scenario Selector */}
        <ScenarioSelector />

        {/* Environment Badge */}
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-input bg-accent/10 border border-accent/20 text-accent text-[11px] font-medium hidden sm:inline-flex">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span>Demo Mode</span>
        </div>

        {/* Last Updated Timestamp */}
        <div className="hidden sm:flex items-center text-[11px] text-textMuted gap-1">
          <span>Updated:</span>
          <span className="font-medium text-text">{relativeTime}</span>
        </div>

        {/* Manual Refresh Button */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="Refresh application data"
          title="Refresh application data"
          className="w-4 h-4 min-h-[32px] min-w-[32px] sm:min-h-0 sm:min-w-0 p-1 rounded-btn border border-border bg-surface text-textMuted hover:text-text hover:bg-bg focus-visible:ring-2 focus-visible:ring-accent inline-flex items-center justify-center transition-colors duration-fast"
        >
          <RotateCw
            className={`w-2 h-2 ${isRefreshing ? 'animate-spin text-accent' : ''}`}
            aria-hidden="true"
          />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}

export default TopBar;

import React from 'react';
import { Outlet } from 'react-router-dom';
import { CloudOff } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import { useMockScenario } from '../../hooks/useMockScenario';

/**
 * AppShell Component
 * Primary layout composing Sidebar (desktop/tablet), TopBar, scrollable Outlet content, and MobileNav.
 */
export function AppShell() {
  const { isAwsUnavailable } = useMockScenario();

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col md:flex-row antialiased transition-colors duration-normal">
      {/* Skip to Main Content Link for Keyboard Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:bg-accent focus:text-white focus:rounded-btn focus:shadow-elevated focus:outline-none focus:ring-2 focus:ring-accent font-medium text-xs"
      >
        Skip to main content
      </a>

      {/* Desktop & Tablet Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* App-Wide Stale Data Banner for AWS Disruption Scenario */}
        {isAwsUnavailable && (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-warning/15 border-b border-warning/30 text-warning px-3 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 z-30 shadow-subtle text-center"
          >
            <CloudOff className="w-2 h-2 flex-shrink-0 animate-pulse" />
            <span>
              AWS CloudWatch Connectivity Disrupted — Telemetry ingestion stream offline. Displaying last known cached state; live polling suspended. No fake zeroes.
            </span>
          </div>
        )}

        {/* Sticky TopBar Header */}
        <TopBar />

        {/* Scrollable Page Content Container */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-2 sm:p-3 pb-8 md:pb-3 max-w-7xl w-full mx-auto outline-none"
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation */}
      <MobileNav />
    </div>
  );
}

export default AppShell;

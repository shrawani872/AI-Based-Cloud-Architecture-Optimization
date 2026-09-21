import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Bell,
  Shield,
  Database,
  Clock,
  Lock,
  Radio,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { useTheme } from '../hooks/useTheme';

/**
 * Reusable SettingRow layout component
 */
function SettingRow({ icon: Icon, label, description, children, badge }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-border last:border-0">
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="w-5 h-5 bg-accent/10 border border-accent/20 rounded-input flex items-center justify-center flex-shrink-0 mt-0.5 text-accent">
          <Icon className="w-2.5 h-2.5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-text">{label}</p>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="text-[11px] text-textMuted mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0 self-start sm:self-center">{children}</div>
    </div>
  );
}

/**
 * Disabled Read-Only Configuration Input with "Read-only in this build" Tooltip
 */
function ReadOnlyConfigInput({ id, label, value, unit, description, icon: Icon }) {
  const tooltipText = 'Read-only in this build';

  return (
    <div
      className="p-3 bg-bg/50 border border-border rounded-card hover:border-accent/30 transition-colors"
      title={tooltipText}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-semibold text-text cursor-not-allowed">
          {Icon && <Icon className="w-2 h-2 text-accent" />}
          <span>{label}</span>
        </label>
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-input bg-surface border border-border text-[10px] text-textMuted font-medium cursor-not-allowed"
          title={tooltipText}
        >
          <Lock className="w-1.5 h-1.5 text-textMuted" />
          Read-only in this build
        </span>
      </div>

      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          readOnly
          disabled
          aria-readonly="true"
          title={tooltipText}
          className="w-full px-3 py-1.5 bg-bg text-text font-mono text-xs border border-border/80 rounded-input cursor-not-allowed opacity-85 select-none focus:outline-none"
        />
      </div>

      {description && (
        <p className="text-[10px] text-textMuted mt-1.5 leading-tight">
          {description}
        </p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    toasts: true,
    criticalAlerts: true,
    pendingReminders: true,
  });

  const toggleNotification = (key) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-3.5 pb-8 max-w-5xl">
      <PageHeader
        title="Settings & Configuration"
        subtitle="Platform configuration, runtime agent parameters, environment indicators, and local preferences."
      />

      {/* 1. Environment & Demo Mode Indicator */}
      <div className="p-3.5 bg-surface border border-border rounded-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-6 h-6 rounded-input bg-info/10 border border-info/20 flex items-center justify-center flex-shrink-0 text-info mt-0.5">
              <Radio className="w-3 h-3 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs font-bold text-text">
                  Environment: Demonstration Sandbox
                </h2>
                <span className="px-2 py-0.5 rounded-input bg-info/15 text-info border border-info/30 text-[10px] font-bold tracking-wide uppercase">
                  Demo Mode Active
                </span>
              </div>
              <p className="text-[11px] text-textMuted mt-1 leading-relaxed">
                The application is running in client-side mock evaluation mode (<code className="font-mono text-accent">VITE_USE_MOCK=true</code>).
                Telemetry streams, forecasts, and AI recommendations are rendered from deterministic cloud fixtures.
                Write operations and pipeline configuration are read-only in this preview build.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 pl-9 sm:pl-0">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-input bg-bg border border-border text-[11px] font-mono text-textMuted">
              <CheckCircle2 className="w-1.5 h-1.5 text-success" />
              Fixtures Loaded
            </span>
          </div>
        </div>
      </div>

      {/* 2. Runtime Pipeline Configuration (Read-only inputs with tooltips) */}
      <div className="bg-surface border border-border rounded-card p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-border/80 pb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Sliders className="w-2 h-2 text-accent" />
              <h2 className="text-xs font-bold text-text uppercase tracking-wider">
                Pipeline Runtime Parameters
              </h2>
            </div>
            <p className="text-[11px] text-textMuted mt-0.5">
              Underlying hyperparameters governing ingestion polling, forecasting horizons, and statistical anomaly detection.
            </p>
          </div>
          <span
            className="hidden sm:inline-flex items-center gap-1 text-[10px] text-textMuted px-2 py-0.5 bg-bg rounded-input border border-border"
            title="Read-only in this build"
          >
            <Lock className="w-1.5 h-1.5" />
            Admin lock engaged
          </span>
        </div>

        {/* Read-Only Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ReadOnlyConfigInput
            id="telemetry-interval"
            label="Telemetry Refresh Interval"
            value="30 seconds"
            icon={Clock}
            description="Frequency of autonomous background polling for CloudWatch & EC2 metrics."
          />
          <ReadOnlyConfigInput
            id="forecast-horizon"
            label="Forecast Horizon Default"
            value="30 days forward"
            icon={Sparkles}
            description="Projection lookahead window computed by Prophet & LSTM multi-variate workers."
          />
          <ReadOnlyConfigInput
            id="anomaly-threshold"
            label="Anomaly Sensitivity Threshold"
            value="3.0 σ (Z-Score)"
            icon={Shield}
            description="Statistical deviation cutoff beyond rolling baseline before triggering an incident."
          />
        </div>
      </div>

      {/* 3. Appearance */}
      <div className="bg-surface border border-border rounded-card px-3.5 py-2">
        <p className="text-[11px] font-bold text-textMuted uppercase tracking-wider mb-1">
          Appearance & Theme
        </p>
        <SettingRow
          icon={theme === 'dark' ? Moon : Sun}
          label="Interface Theme"
          description="Toggle between dark mode (deep blue/slate palette) and light mode (high-contrast crisp design)."
        >
          <button
            type="button"
            id="theme-toggle-settings-btn"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-btn text-xs font-medium bg-bg border border-border hover:border-accent text-text transition-colors shadow-subtle"
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-2 h-2 text-accent" />
                <span>Dark Theme</span>
              </>
            ) : (
              <>
                <Sun className="w-2 h-2 text-warning" />
                <span>Light Theme</span>
              </>
            )}
          </button>
        </SettingRow>
      </div>

      {/* 4. Notification Preferences */}
      <div className="bg-surface border border-border rounded-card px-3.5 py-2">
        <p className="text-[11px] font-bold text-textMuted uppercase tracking-wider mb-1">
          Notification Preferences
        </p>
        <SettingRow
          icon={Bell}
          label="In-App Toast Notifications"
          description="Display contextual toast notifications on approval, rejection, or data recomputation events."
        >
          <input
            type="checkbox"
            id="toast-notifications-toggle"
            checked={notifications.toasts}
            onChange={() => toggleNotification('toasts')}
            className="w-4 h-4 rounded text-accent focus:ring-accent border-border cursor-pointer accent-accent"
          />
        </SettingRow>

        <SettingRow
          icon={AlertCircle}
          label="Critical Anomaly Alerts"
          description="Highlight High and Critical anomaly banners and system alerts across all views."
        >
          <input
            type="checkbox"
            id="critical-alerts-toggle"
            checked={notifications.criticalAlerts}
            onChange={() => toggleNotification('criticalAlerts')}
            className="w-4 h-4 rounded text-accent focus:ring-accent border-border cursor-pointer accent-accent"
          />
        </SettingRow>

        <SettingRow
          icon={Clock}
          label="Pending Approval Indicators"
          description="Show active count badges on navigation tabs when recommendations require human review."
        >
          <input
            type="checkbox"
            id="pending-indicators-toggle"
            checked={notifications.pendingReminders}
            onChange={() => toggleNotification('pendingReminders')}
            className="w-4 h-4 rounded text-accent focus:ring-accent border-border cursor-pointer accent-accent"
          />
        </SettingRow>
      </div>

      {/* 5. System Build & Artifact Details */}
      <div className="bg-surface border border-border rounded-card px-3.5 py-3">
        <p className="text-[11px] font-bold text-textMuted uppercase tracking-wider mb-2">
          System & Build Information
        </p>
        <div className="divide-y divide-border/60">
          {[
            ['Application', 'AI-Based Cloud Architecture Optimizer'],
            ['Build Version', 'v0.1.0 (Module 11 Release)'],
            ['Frontend Architecture', 'React 18 + Vite + Tailwind CSS + TanStack Query v5'],
            ['Design System Grid', '8px Spacing Grid • Semantic HSL Color Tokens'],
            ['API Endpoint Mode', '/api/v1 (MockStore In-Memory Active)'],
            ['Polling Interval', '30 seconds continuous background refresh'],
            ['Environment Status', 'Client Demo Mode • Administrative Mutations Disabled'],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 gap-1"
            >
              <span className="text-[11px] text-textMuted">{label}</span>
              <span className="text-[11px] text-text font-mono font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

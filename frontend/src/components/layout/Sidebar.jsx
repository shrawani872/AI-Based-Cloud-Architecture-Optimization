import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Activity,
  TrendingUp,
  AlertTriangle,
  History as HistoryIcon,
  Settings,
  Server,
  Cloud,
} from 'lucide-react';

export const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Recommendations', path: '/recommendations', icon: Sparkles },
  { name: 'Telemetry', path: '/telemetry', icon: Activity },
  { name: 'Forecast', path: '/forecasts', icon: TrendingUp },
  { name: 'Anomalies', path: '/anomalies', icon: AlertTriangle },
  { name: 'History', path: '/history', icon: HistoryIcon },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'System Status', path: '/system-status', icon: Server },
];

/**
 * Sidebar Component
 * - Persistent desktop (>=1024px): w-64, shows labels + icons
 * - Collapsed tablet (768-1023px): w-16, shows icons only with tooltips
 * - Hidden mobile (<768px): hidden
 */
export function Sidebar() {
  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 border-r border-border bg-surface transition-all duration-normal lg:w-48 md:w-8 h-screen sticky top-0 z-30"
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="h-6 flex items-center px-2 border-b border-border gap-2">
        <div className="w-4 h-4 rounded-input bg-accent/10 border border-accent/20 flex items-center justify-center text-accent flex-shrink-0">
          <Cloud className="w-2.5 h-2.5" />
        </div>
        <div className="hidden lg:block overflow-hidden">
          <span className="font-bold text-sm text-text tracking-tight block truncate">
            Cloud Optimizer
          </span>
          <span className="text-[11px] text-textMuted block truncate">
            Decision Support
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-2 px-1 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.name}
              className={({ isActive }) =>
                `flex items-center gap-2 px-2 py-1.5 rounded-btn text-xs transition-colors duration-fast group relative ${
                  isActive
                    ? 'border-l-2 border-accent text-accent bg-accent/10 font-bold'
                    : 'text-textMuted hover:text-text hover:bg-bg border-l-2 border-transparent font-semibold'
                } justify-center lg:justify-start`
              }
            >
              <Icon className="w-2.5 h-2.5 flex-shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-2 border-t border-border hidden lg:block">
        <div className="p-1.5 rounded-input bg-bg border border-border">
          <div className="flex items-center gap-1.5 text-xs text-text font-medium mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span>AWS Telemetry Live</span>
          </div>
          <span className="text-[11px] text-textMuted block">Region: us-east-1</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

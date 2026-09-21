import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  AlertTriangle,
  MoreHorizontal,
  Activity,
  TrendingUp,
  History as HistoryIcon,
  Settings,
  Server,
  X,
} from 'lucide-react';

const MORE_ITEMS = [
  { name: 'Telemetry', path: '/telemetry', icon: Activity, desc: 'Live AWS CloudWatch metrics' },
  { name: 'Forecast', path: '/forecasts', icon: TrendingUp, desc: 'Capacity & cost trends' },
  { name: 'History', path: '/history', icon: HistoryIcon, desc: 'Audit log of past actions' },
  { name: 'Settings', path: '/settings', icon: Settings, desc: 'Engine & threshold configs' },
  { name: 'System Status', path: '/system-status', icon: Server, desc: 'Service health & agents' },
];

/**
 * MobileNav Component
 * Fixed bottom navigation bar for viewport < 768px.
 * Features:
 * - Touch targets >= 44px
 * - Accessible ARIA attributes and focus management
 * - Slide-over "More" sheet
 */
export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const sheetRef = useRef(null);

  // Close sheet on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Handle ESC key to close modal sheet and trap focus inside sheet
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }

      if (e.key === 'Tab' && sheetRef.current) {
        const focusableElements = sheetRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus sheet when opened
  useEffect(() => {
    if (isOpen && sheetRef.current) {
      setTimeout(() => {
        sheetRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const isMoreActive = MORE_ITEMS.some((item) => location.pathname === item.path);

  return (
    <>
      {/* Slide-up "More" Drawer Sheet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden flex flex-col justify-end transition-opacity duration-normal"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="More Navigation Options"
        >
          <div
            ref={sheetRef}
            tabIndex={-1}
            className="bg-surface border-t border-border rounded-t-card p-3 w-full max-h-[80vh] overflow-y-auto space-y-2 outline-none shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-semibold text-sm text-text">More Services & Tools</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-5 h-5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-btn text-textMuted hover:text-text hover:bg-bg"
                aria-label="Close menu"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1 py-1">
              {MORE_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 p-2 rounded-input min-h-[48px] transition-colors ${
                      isActive
                        ? 'bg-accent/10 text-accent font-semibold border-l-2 border-accent'
                        : 'text-text hover:bg-bg'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-input bg-bg border border-border flex items-center justify-center flex-shrink-0 text-accent">
                      <Icon className="w-2.5 h-2.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{item.name}</span>
                      <span className="text-[11px] text-textMuted">{item.desc}</span>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Nav Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border md:hidden flex items-center justify-around px-1 h-7 pb-[env(safe-area-inset-bottom)] shadow-sm"
        role="navigation"
        aria-label="Mobile Bottom Navigation"
      >
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 min-h-[44px] min-w-[44px] text-[11px] transition-colors ${
              isActive ? 'text-accent font-semibold' : 'text-textMuted hover:text-text'
            }`
          }
          aria-label="Dashboard"
        >
          <LayoutDashboard className="w-2.5 h-2.5 mb-0.5" />
          <span>Dashboard</span>
        </NavLink>

        {/* Recommendations */}
        <NavLink
          to="/recommendations"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 min-h-[44px] min-w-[44px] text-[11px] transition-colors ${
              isActive ? 'text-accent font-semibold' : 'text-textMuted hover:text-text'
            }`
          }
          aria-label="Recommendations"
        >
          <Sparkles className="w-2.5 h-2.5 mb-0.5" />
          <span>Optimize</span>
        </NavLink>

        {/* Alerts (Anomalies) */}
        <NavLink
          to="/anomalies"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 min-h-[44px] min-w-[44px] text-[11px] transition-colors ${
              isActive ? 'text-accent font-semibold' : 'text-textMuted hover:text-text'
            }`
          }
          aria-label="Alerts"
        >
          <AlertTriangle className="w-2.5 h-2.5 mb-0.5" />
          <span>Alerts</span>
        </NavLink>

        {/* More Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex flex-col items-center justify-center flex-1 min-h-[44px] min-w-[44px] text-[11px] transition-colors ${
            isMoreActive || isOpen ? 'text-accent font-semibold' : 'text-textMuted hover:text-text'
          }`}
          aria-expanded={isOpen}
          aria-label="Open more menu options"
        >
          <MoreHorizontal className="w-2.5 h-2.5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}

export default MobileNav;

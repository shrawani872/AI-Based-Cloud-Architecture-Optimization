import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

/**
 * ThemeToggle component
 * Renders an accessible button that toggles between light and dark mode.
 */
export function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`inline-flex items-center justify-center w-4 h-4 p-1 rounded-btn border border-border bg-surface text-text hover:bg-bg hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-normal ${className}`}
    >
      {isDark ? (
        <Sun className="w-2 h-2 text-warning transition-transform duration-normal hover:rotate-45" aria-hidden="true" />
      ) : (
        <Moon className="w-2 h-2 text-textMuted transition-transform duration-normal hover:-rotate-12" aria-hidden="true" />
      )}
    </button>
  );
}

export default ThemeToggle;

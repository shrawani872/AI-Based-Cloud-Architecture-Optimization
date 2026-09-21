import { useContext } from 'react';
import { ToastContext } from '../components/feedback/ToastProvider';

/**
 * useToast hook
 * Provides access to triggering toast notifications.
 * @returns {{ showToast: Function, dismissToast: Function, success: Function, error: Function, warning: Function, info: Function }}
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default useToast;

import React, { createContext, useState, useCallback } from 'react';
import { Toast } from './Toast';

export const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast = { id, type, title, message, duration };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const success = useCallback((message, title = 'Success') => {
    return showToast({ type: 'success', title, message });
  }, [showToast]);

  const error = useCallback((message, title = 'Error') => {
    return showToast({ type: 'error', title, message });
  }, [showToast]);

  const warning = useCallback((message, title = 'Warning') => {
    return showToast({ type: 'warning', title, message });
  }, [showToast]);

  const info = useCallback((message, title = 'Info') => {
    return showToast({ type: 'info', title, message });
  }, [showToast]);

  const value = {
    showToast,
    dismissToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Viewport Fixed Container */}
      <div
        className="fixed bottom-3 right-3 z-50 flex flex-col gap-1.5 pointer-events-none max-w-sm w-full"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;

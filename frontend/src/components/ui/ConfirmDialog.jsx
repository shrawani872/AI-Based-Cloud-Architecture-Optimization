import React, { useEffect, useRef } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, X } from 'lucide-react';

/**
 * ConfirmDialog Component
 * Accessible, focus-trapped confirmation modal for human-in-the-loop decisions.
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {() => void} props.onClose - Dismiss/cancel handler
 * @param {() => void | Promise<any>} props.onConfirm - Explicit confirmation handler
 * @param {string} props.title - Modal title
 * @param {string} [props.description] - Detailed explanation of impact
 * @param {string} [props.confirmText='Confirm'] - Confirm button label
 * @param {string} [props.cancelText='Cancel'] - Cancel button label
 * @param {'accent' | 'critical' | 'warning' | 'success'} [props.variant='accent'] - Visual styling
 * @param {boolean} [props.isLoading=false] - Loading state for async confirmation
 * @param {React.ReactNode} [props.children] - Additional slot for custom details / impact diffs
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'accent',
  isLoading = false,
  children,
}) {
  const modalRef = useRef(null);
  const confirmBtnRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
        return;
      }

      // Simple focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
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
  }, [isOpen, onClose, isLoading]);

  // Focus confirm button when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const variantStyles = {
    accent: {
      btn: 'bg-accent hover:bg-accentHover text-white focus-visible:ring-accent',
      icon: CheckCircle2,
      iconColor: 'text-accent bg-accent/10 border-accent/20',
    },
    critical: {
      btn: 'bg-critical hover:bg-critical/90 text-white focus-visible:ring-critical',
      icon: ShieldAlert,
      iconColor: 'text-critical bg-critical/10 border-critical/20',
    },
    warning: {
      btn: 'bg-warning hover:bg-warning/90 text-white focus-visible:ring-warning',
      icon: AlertTriangle,
      iconColor: 'text-warning bg-warning/10 border-warning/20',
    },
    success: {
      btn: 'bg-success hover:bg-success/90 text-white focus-visible:ring-success',
      icon: CheckCircle2,
      iconColor: 'text-success bg-success/10 border-success/20',
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.accent;
  const Icon = currentVariant.icon;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in"
      onClick={!isLoading ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-md bg-surface border border-border rounded-card p-4 shadow-sm outline-none transition-all duration-normal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 pb-2">
          <div className="flex items-start gap-2">
            <div className={`w-4 h-4 rounded-input border flex items-center justify-center flex-shrink-0 ${currentVariant.iconColor}`}>
              <Icon className="w-2.5 h-2.5" />
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="text-sm font-bold text-text">
                {title}
              </h3>
              {description && (
                <p id="confirm-dialog-desc" className="text-xs text-textMuted mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
            className="text-textMuted hover:text-text p-0.5 rounded-btn transition-colors disabled:opacity-50"
          >
            <X className="w-2 h-2" />
          </button>
        </div>

        {/* Custom Body / Diff Content */}
        {children && <div className="my-3 text-xs">{children}</div>}

        {/* Actions */}
        <div className="mt-4 pt-2 border-t border-border flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-btn text-xs font-medium bg-bg text-text border border-border hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-3 py-1 rounded-btn text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 transition-colors disabled:opacity-50 ${currentVariant.btn}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

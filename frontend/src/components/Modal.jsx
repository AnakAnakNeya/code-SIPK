// ============================================================================
// Komponen UI Reusable: Modal Dialog (frontend/src/components/Modal.jsx)
// [UI Modular Component] Dialog overlay interaktif dengan animasi & kontrol ESC
// ============================================================================

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  }[size] || 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 !mt-0 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div
          className={`w-full ${sizeClasses} transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all border border-slate-100`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Tutup modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Content Body */}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">{children}</div>

          {/* Footer Actions */}
          {footer && (
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modal;

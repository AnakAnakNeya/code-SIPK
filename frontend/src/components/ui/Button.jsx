import React from 'react';

const VARIANTS = {
  primary:
    'bg-navy-900 text-white hover:bg-navy-800 focus:ring-navy-500 shadow-sm disabled:bg-slate-300 disabled:text-slate-500',
  secondary:
    'bg-lebak-gold text-white hover:bg-amber-600 focus:ring-amber-400 shadow-sm disabled:bg-slate-300 disabled:text-slate-500',
  outline:
    'bg-white text-navy-900 border border-slate-300 hover:bg-slate-50 focus:ring-navy-500 disabled:bg-slate-100 disabled:text-slate-400',
  ghost:
    'text-slate-700 hover:bg-slate-100 focus:ring-slate-400 disabled:text-slate-400',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm disabled:bg-slate-300',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-base rounded-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

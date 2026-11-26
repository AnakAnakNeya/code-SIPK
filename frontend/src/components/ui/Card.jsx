import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, children, className = '' }) {
  if (children) {
    return (
      <div className={`p-6 border-b border-slate-100 ${className}`}>
        {children}
      </div>
    );
  }
  return (
    <div className={`p-6 border-b border-slate-100 flex items-center justify-between ${className}`}>
      <div>
        {title && <h3 className="text-lg font-bold text-navy-900">{title}</h3>}
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`p-6 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

export default Card;

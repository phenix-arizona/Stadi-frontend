import React from 'react';
import { Loader2 } from 'lucide-react';

// ── Button ────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', loading, disabled, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary:   'bg-stadi-green text-white hover:bg-opacity-90 focus:ring-stadi-green',
    secondary: 'bg-stadi-orange text-white hover:bg-opacity-90 focus:ring-stadi-orange',
    outline:   'border-2 border-stadi-green text-stadi-green hover:bg-stadi-green-light focus:ring-stadi-green',
    ghost:     'text-stadi-gray hover:bg-gray-100 focus:ring-gray-300',
    danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-3 text-sm',
    lg: 'px-7 py-4 text-base',
    xl: 'px-8 py-4 text-lg',
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

// ── Badge ─────────────────────────────────────────────────────
export function Badge({ children, variant = 'green', className = '' }) {
  const variants = {
    green:  'bg-stadi-green-light text-stadi-green',
    orange: 'bg-stadi-orange-light text-stadi-orange',
    gray:   'bg-gray-100 text-gray-600',
    red:    'bg-red-50 text-red-600',
    blue:   'bg-blue-50 text-blue-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

// ── Input ─────────────────────────────────────────────────────
export function Input({ label, error, prefix, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-stadi-dark mb-1.5">{label}</label>}
      <div className="relative">
        {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">{prefix}</span>}
        <input
          className={`w-full px-4 py-3 rounded-xl border transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-stadi-green focus:border-transparent
            placeholder-gray-400
            ${prefix ? 'pl-16' : ''}
            ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}
            ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
export function Skeleton({ className = '', ...props }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} {...props} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex justify-between items-center pt-1">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Star Rating ───────────────────────────────────────────────
export function StarRating({ rating = 0, count, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-yellow-400" style={{ fontSize: size }}>
        {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      </span>
      <span className="text-stadi-gray text-xs font-medium">
        {rating.toFixed(1)}{count !== undefined && <span className="text-gray-400"> ({count})</span>}
      </span>
    </span>
  );
}

// ── Progress Bar ──────────────────────────────────────────────
export function ProgressBar({ value = 0, label, showPct = true, color = 'green' }) {
  const colors = { green: 'bg-stadi-green', orange: 'bg-stadi-orange' };
  return (
    <div className="w-full">
      {(label || showPct) && (
        <div className="flex justify-between text-xs text-stadi-gray mb-1.5">
          {label && <span>{label}</span>}
          {showPct && <span className="font-semibold">{value}%</span>}
        </div>
      )}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} rounded-full transition-all duration-700 progress-animate`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl', full: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${sizes[size]} animate-slide-up max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-stadi-dark">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up max-w-xs
            ${t.type === 'success' ? 'bg-stadi-green text-white' :
              t.type === 'error'   ? 'bg-red-600 text-white' :
              'bg-white text-stadi-dark border border-gray-100 shadow-md'}`}
        >
          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span>{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="ml-auto opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
        </div>
      ))}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────
export function EmptyState({ emoji = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="text-lg font-bold text-stadi-dark mb-2">{title}</h3>
      {description && <p className="text-stadi-gray text-sm mb-6 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────
export function Divider({ label }) {
  if (!label) return <hr className="border-gray-100 my-4" />;
  return (
    <div className="flex items-center gap-3 my-4">
      <hr className="flex-1 border-gray-200" />
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <hr className="flex-1 border-gray-200" />
    </div>
  );
}

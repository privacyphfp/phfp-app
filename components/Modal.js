'use client';

import { useEffect } from 'react';

// Generic popup shell: backdrop, centered card, X close button, and its
// own scrollbar once content gets taller than the viewport allows. Closes
// on backdrop click, the X, or Escape.
export default function Modal({ open, onClose, title, children, maxWidthClass = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`relative max-h-[85vh] w-full ${maxWidthClass} overflow-y-auto rounded-2xl border border-brand-gold/40 bg-white p-6 shadow-xl dark:bg-zinc-900`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-lg leading-none text-brand-ink/40 transition-colors hover:text-brand-ink"
        >
          ✕
        </button>
        {title && <h2 className="pr-6 text-lg font-semibold text-brand-blue-dark">{title}</h2>}
        <div className={title ? 'mt-4' : ''}>{children}</div>
      </div>
    </div>
  );
}

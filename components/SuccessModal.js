'use client';

import { useEffect } from 'react';

// A small centered confirmation dialog — more noticeable than an inline
// "Saved." line for actions the student should be sure landed (profile
// save, enrollment, etc). Closes on backdrop click, Escape, or the button.
export default function SuccessModal({ open, title, message, onClose }) {
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
        className="w-full max-w-sm rounded-2xl border border-brand-gold/40 bg-white p-6 text-center shadow-xl dark:bg-zinc-900"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/10 text-2xl text-brand-blue">
          ✓
        </div>
        <h2 className="mt-3 text-lg font-semibold text-brand-blue-dark">{title}</h2>
        {message && <p className="mt-1 text-sm text-brand-ink/70">{message}</p>}
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-brand-blue px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark"
        >
          Okay
        </button>
      </div>
    </div>
  );
}

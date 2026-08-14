'use client';

import { useState } from 'react';

export default function MobileMenu({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-blue/30 text-brand-ink/70 transition-colors hover:border-brand-blue hover:text-brand-blue"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M2 4H16M2 9H16M2 14H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-brand-gold/40 bg-brand-cream shadow-md dark:bg-[#16233a]">
          <div className="flex flex-col gap-1 p-4" onClick={() => setOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

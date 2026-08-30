'use client';

import { useEffect, useState } from 'react';

// Supabase's confirmation link verifies the token on Supabase's own server,
// then redirects the browser here — as a success, or with an error param
// if the link was already used or has expired. We read that straight off
// window.location (not useSearchParams) so this page needs no Suspense
// boundary. No sign-in happens here; it's just a landing message pointing
// back to /login.
export default function EmailConfirmedPage() {
  const [errorDescription, setErrorDescription] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const message =
      query.get('error_description') || query.get('error') || hash.get('error_description') || hash.get('error');
    // window.location isn't available during SSR, so this can only be read
    // once mounted on the client — an unavoidable one-shot effect, not a
    // value derivable from props/state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (message) setErrorDescription(message.replace(/\+/g, ' '));
  }, []);

  if (errorDescription) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div className="w-full max-w-sm rounded-2xl border border-brand-gold/40 bg-white/70 p-8 shadow-lg shadow-brand-gold/10 backdrop-blur dark:bg-white/5">
          <h1 className="text-2xl font-semibold text-brand-blue-dark">Link expired or invalid</h1>
          <p className="mt-2 text-brand-ink/70">{errorDescription}</p>
          <p className="mt-4 text-sm text-brand-ink/60">
            Try signing up again, or{' '}
            <a href="/login" className="font-medium text-brand-blue underline underline-offset-2">
              log in
            </a>{' '}
            if you already confirmed your email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8 text-center">
      <div className="w-full max-w-sm rounded-2xl border border-brand-gold/40 bg-white/70 p-8 shadow-lg shadow-brand-gold/10 backdrop-blur dark:bg-white/5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/10 text-2xl text-brand-blue">
          ✓
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-brand-blue-dark">Email confirmed</h1>
        <p className="mt-2 text-brand-ink/70">
          Your email address has been confirmed. You can now log in to your PHFP account.
        </p>
        <a
          href="/login"
          className="mt-5 inline-block w-full rounded-full bg-brand-blue py-2.5 font-medium text-white shadow-md shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark"
        >
          Go to Log In
        </a>
      </div>
    </div>
  );
}

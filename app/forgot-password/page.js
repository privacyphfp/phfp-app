'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div className="rounded-2xl border border-brand-gold/40 bg-white/70 p-8 shadow-lg shadow-brand-gold/10 backdrop-blur dark:bg-white/5">
          <h1 className="text-2xl font-semibold text-brand-blue-dark">Check your email</h1>
          <p className="mt-2 text-brand-ink/70">
            If an account exists for {email}, we sent a link to reset your password.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-brand-gold/40 bg-white/70 p-8 shadow-lg shadow-brand-gold/10 backdrop-blur dark:bg-white/5"
      >
        <h1 className="text-2xl font-semibold text-brand-blue-dark">Reset Password</h1>
        <p className="text-sm text-brand-ink/60">Enter your email and we&apos;ll send you a link to reset your password.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-brand-ink/80">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-blue/20 px-3 py-2 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-blue py-2.5 font-medium text-white shadow-md shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
        <p className="text-sm text-brand-ink/60">
          <a href="/login" className="font-medium text-brand-blue underline underline-offset-2">
            ← Back to log in
          </a>
        </p>
      </form>
    </div>
  );
}

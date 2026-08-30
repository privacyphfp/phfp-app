'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PasswordInput from '@/components/PasswordInput';

const DASHBOARD_ROLES = ['admin', 'marketing', 'accounting'];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setResent(false);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/email-confirmed` },
    });
    if (!error) setResent(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setNeedsConfirmation(false);
    setResent(false);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          setNeedsConfirmation(true);
        } else {
          setError(error.message);
        }
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const role = profile?.role ?? 'student';
      router.push(DASHBOARD_ROLES.includes(role) ? `/${role}` : '/student');
      router.refresh();
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-brand-gold/40 bg-white/70 p-8 shadow-lg shadow-brand-gold/10 backdrop-blur dark:bg-white/5"
      >
        <h1 className="text-2xl font-semibold text-brand-blue-dark">Log In</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {needsConfirmation && (
          <div className="rounded-lg border border-brand-flame/30 bg-brand-amber/10 p-3 text-sm text-brand-ink/80">
            <p>
              Please confirm your email before logging in. Check your inbox for the confirmation link — and if you
              don&apos;t see it, check your Spam or Junk folder.
            </p>
            <button
              type="button"
              onClick={handleResend}
              className="mt-2 font-medium text-brand-blue underline underline-offset-2"
            >
              Resend confirmation email
            </button>
            {resent && <p className="mt-1 text-xs text-brand-blue">Sent! Check your inbox (and spam folder).</p>}
          </div>
        )}
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
        <div>
          <div className="flex items-baseline justify-between">
            <label className="block text-sm font-medium text-brand-ink/80">Password</label>
            <a href="/forgot-password" className="text-xs font-medium text-brand-blue underline underline-offset-2">
              Forgot password?
            </a>
          </div>
          <PasswordInput
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-blue/20 px-3 py-2 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-blue py-2.5 font-medium text-white shadow-md shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
        >
          {loading ? 'Logging in…' : 'Log In'}
        </button>
        <p className="text-sm text-brand-ink/60">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="font-medium text-brand-blue underline underline-offset-2">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PasswordInput from '@/components/PasswordInput';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        router.push('/student');
        router.refresh();
      } else {
        setSubmitted(true);
      }
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
            We sent a confirmation link to {email}. Click it to activate your account, then log in.
          </p>
          <p className="mt-3 text-sm text-brand-ink/50">
            Don&apos;t see it in a minute or two? Check your Spam or Junk folder — confirmation emails sometimes land
            there.
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
        <h1 className="text-2xl font-semibold text-brand-blue-dark">Create Account</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-brand-ink/80">Full Name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-blue/20 px-3 py-2 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
          />
        </div>
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
          <label className="block text-sm font-medium text-brand-ink/80">Password</label>
          <PasswordInput
            required
            minLength={6}
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
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
        <p className="text-sm text-brand-ink/60">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-brand-blue underline underline-offset-2">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function TitheAmountForm({ enrollmentId, initialAmount }) {
  const router = useRouter();
  const [amount, setAmount] = useState(initialAmount ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('enrollments')
        .update({ tithe_amount: amount === '' ? null : Number(amount) })
        .eq('id', enrollmentId);

      if (error) {
        setError(error.message);
        return;
      }

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-1 flex items-center gap-2">
      <span className="text-brand-ink/60">Tithe received: ₱</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-24 rounded-lg border border-brand-blue/20 px-2 py-1 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-full border border-brand-blue/30 px-3 py-1 text-xs font-medium text-brand-blue transition-colors hover:bg-brand-blue/10 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save'}
      </button>
      {saved && <span className="text-xs text-brand-blue">Saved.</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}

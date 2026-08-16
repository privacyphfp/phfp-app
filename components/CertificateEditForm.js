'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CertificateEditForm({ certificateId, initialIssuedDate }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [issuedDate, setIssuedDate] = useState(initialIssuedDate ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('certificates')
        .update({ issued_date: issuedDate || null, verified: false })
        .eq('id', certificateId);

      if (error) {
        setError(error.message);
        return;
      }

      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-1 text-xs text-brand-blue underline underline-offset-2"
      >
        Edit date
      </button>
    );
  }

  return (
    <form onSubmit={handleSave} className="mt-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <input
          type="date"
          required
          value={issuedDate}
          onChange={(e) => setIssuedDate(e.target.value)}
          className="rounded-lg border border-brand-blue/20 px-2 py-1 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-brand-blue px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setIssuedDate(initialIssuedDate ?? '');
            setError(null);
          }}
          className="text-xs text-brand-ink/50 underline underline-offset-2"
        >
          Cancel
        </button>
      </div>
      <p className="mt-1 text-xs text-brand-ink/50">Saving a correction sends it back to PHFP staff for re-verification.</p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// The number printed on the physical certificate (e.g. "BPH031-2018") —
// staff fills it in for record-keeping; it feeds the Reports export but
// isn't required for verification.
export default function CertificateNumberForm({ certificateId, initialValue }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function save() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('certificates')
        .update({ certificate_number: value.trim() || null })
        .eq('id', certificateId);

      if (error) {
        setError(error.message);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Certificate #"
        className="w-36 rounded-lg border border-brand-blue/20 px-2 py-1 text-xs outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
      />
      <button
        type="button"
        onClick={save}
        disabled={loading || value.trim() === (initialValue ?? '')}
        className="rounded-full border border-brand-blue/30 px-3 py-1 text-xs font-medium text-brand-blue transition-colors hover:bg-brand-blue/10 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

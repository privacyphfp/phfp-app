'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const STATUS_OPTIONS = [
  { value: 'registered', label: 'Registered (not yet confirmed)' },
  { value: 'completed', label: 'Completed — attended fully' },
  { value: 'no_show', label: 'No Show — enrolled but did not attend' },
  { value: 'waitlisted', label: 'Waitlisted' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AttendanceStatusForm({ enrollmentId, initialStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus ?? 'registered');
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
      const { error } = await supabase.from('enrollments').update({ status }).eq('id', enrollmentId);

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
    <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <span className="text-brand-ink/60">Attendance:</span>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-lg border border-brand-blue/20 px-2 py-1 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
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

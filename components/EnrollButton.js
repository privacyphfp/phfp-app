'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function EnrollButton({ offeringId, studentId, disabled, label }) {
  const router = useRouter();
  const [referredBy, setReferredBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('enrollments')
        .insert({ student_id: studentId, course_offering_id: offeringId, referred_by: referredBy || null });

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
    <div>
      {!disabled && (
        <input
          value={referredBy}
          onChange={(e) => setReferredBy(e.target.value)}
          placeholder="Referred by (optional)"
          className="mb-2 w-full max-w-xs rounded-lg border border-brand-blue/20 px-3 py-1.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
        />
      )}
      <div>
        <button
          onClick={handleClick}
          disabled={disabled || loading}
          className="rounded-full bg-brand-blue px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:bg-brand-ink/20 disabled:text-brand-ink/50 disabled:shadow-none"
        >
          {loading ? 'Enrolling…' : label}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

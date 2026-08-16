'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function EnrollButton({ offeringId, studentId, disabled, label }) {
  const router = useRouter();
  const [referredBy, setReferredBy] = useState('');
  const [enrollmentType, setEnrollmentType] = useState('new');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    if (!referredBy.trim()) {
      setError('Please enter who referred you.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('enrollments').insert({
        student_id: studentId,
        course_offering_id: offeringId,
        referred_by: referredBy.trim(),
        enrollment_type: enrollmentType,
      });

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
        <>
          <div className="mb-2 flex gap-4 text-sm text-brand-ink/80">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name={`enrollment-type-${offeringId}`}
                value="new"
                checked={enrollmentType === 'new'}
                onChange={() => setEnrollmentType('new')}
              />
              New
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name={`enrollment-type-${offeringId}`}
                value="review"
                checked={enrollmentType === 'review'}
                onChange={() => setEnrollmentType('review')}
              />
              Review
            </label>
          </div>
          {enrollmentType === 'review' && (
            <p className="mb-2 text-xs text-brand-ink/50">
              Review students give a tithe based on what they feel the course is worth, instead of the fixed rate.
              Accounting will record the amount once it&apos;s received.
            </p>
          )}
          <label className="mb-1 block text-sm text-brand-ink/80">
            Referred by <span className="text-red-600">*</span>
          </label>
          <input
            value={referredBy}
            onChange={(e) => setReferredBy(e.target.value)}
            placeholder="Who referred you?"
            className="mb-2 w-full max-w-xs rounded-lg border border-brand-blue/20 px-3 py-1.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
          />
        </>
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

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// A suggested match between a legacy "who took what" record and a real
// student account. Staff confirms it — a name match alone isn't reliable
// enough to auto-verify a course completion (shared names, old spelling).
export default function ConfirmLegacyRecordForm({ record, studentId, courseId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(null);

  async function confirm() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: certError } = await supabase.from('certificates').insert({
        student_id: studentId,
        course_id: courseId,
        file_url: null,
        issued_date: record.completed_date,
        verified: true,
      });
      if (certError) {
        setError(certError.message);
        return;
      }

      const { error: resolveError } = await supabase
        .from('legacy_course_records')
        .update({ resolved: true, matched_profile_id: studentId, resolved_by: user.id, resolved_at: new Date().toISOString() })
        .eq('id', record.id);
      if (resolveError) {
        setError(resolveError.message);
        return;
      }

      router.refresh();
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function notAMatch() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: resolveError } = await supabase
        .from('legacy_course_records')
        .update({ resolved: true })
        .eq('id', record.id);
      if (resolveError) {
        setError(resolveError.message);
        return;
      }
      setDismissed(true);
      router.refresh();
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (dismissed) return null;

  return (
    <div className="mt-2 flex items-center gap-3">
      <button
        type="button"
        onClick={confirm}
        disabled={loading || !courseId}
        className="rounded-full border border-brand-blue/30 px-3 py-1 text-xs font-medium text-brand-blue transition-colors hover:bg-brand-blue/10 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Confirm — mark completed'}
      </button>
      <button
        type="button"
        onClick={notAMatch}
        disabled={loading}
        className="rounded-full border border-brand-ink/20 px-3 py-1 text-xs font-medium text-brand-ink/60 transition-colors hover:bg-brand-ink/5 disabled:opacity-50"
      >
        Not a match
      </button>
      {!courseId && <span className="text-xs text-brand-flame">Unknown course code — can&apos;t link</span>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CertificateVerifyButton({ certificateId, verified, declined }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function setStatus(next) {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('certificates').update(next).eq('id', certificateId);

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

  const baseBtn = 'rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50';

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {verified ? (
          <button
            type="button"
            onClick={() => setStatus({ verified: false, declined: false })}
            disabled={loading}
            className={`${baseBtn} border-brand-blue/30 text-brand-blue hover:bg-brand-blue/10`}
          >
            {loading ? 'Saving…' : 'Verified ✓ (unverify)'}
          </button>
        ) : declined ? (
          <>
            <span className="rounded-full border border-brand-ink/20 px-3 py-1 text-xs font-medium text-brand-ink/50">Declined</span>
            <button
              type="button"
              onClick={() => setStatus({ declined: false })}
              disabled={loading}
              className={`${baseBtn} border-brand-ink/20 text-brand-ink/60 hover:bg-brand-ink/5`}
            >
              {loading ? 'Saving…' : 'Undo decline'}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStatus({ verified: true, declined: false })}
              disabled={loading}
              className={`${baseBtn} border-brand-flame/30 text-brand-flame hover:bg-brand-flame/10`}
            >
              {loading ? 'Saving…' : 'Mark Verified'}
            </button>
            <button
              type="button"
              onClick={() => setStatus({ declined: true, verified: false })}
              disabled={loading}
              className={`${baseBtn} border-brand-ink/20 text-brand-ink/60 hover:bg-brand-ink/5`}
            >
              {loading ? 'Saving…' : 'Decline'}
            </button>
          </>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CertificateVerifyButton({ certificateId, verified }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function toggle() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('certificates').update({ verified: !verified }).eq('id', certificateId);

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
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
          verified
            ? 'border-brand-blue/30 text-brand-blue hover:bg-brand-blue/10'
            : 'border-brand-flame/30 text-brand-flame hover:bg-brand-flame/10'
        }`}
      >
        {loading ? 'Saving…' : verified ? 'Verified ✓ (unverify)' : 'Mark Verified'}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

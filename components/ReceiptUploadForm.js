'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ReceiptUploadForm({ enrollmentId, studentId }) {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `${studentId}/${enrollmentId}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('receipts').upload(path, file);
      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const { error: updateError } = await supabase.from('enrollments').update({ receipt_url: path }).eq('id', enrollmentId);
      if (updateError) {
        setError(updateError.message);
        return;
      }

      setFile(null);
      router.refresh();
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const fileInputId = `receipt-file-${enrollmentId}`;

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <label
        htmlFor={fileInputId}
        className="cursor-pointer rounded-full border border-brand-blue/30 bg-brand-blue/5 px-3 py-1 text-xs font-medium text-brand-blue transition-colors hover:border-brand-blue hover:bg-brand-blue/10"
      >
        Choose File to Upload
      </label>
      <span className="truncate text-xs text-brand-ink/50">{file ? file.name : 'No file chosen'}</span>
      <input
        id={fileInputId}
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="sr-only"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-full border border-brand-blue/30 px-3 py-1 text-xs font-medium text-brand-blue transition-colors hover:bg-brand-blue/10 disabled:opacity-50"
      >
        {loading ? 'Uploading…' : 'Upload Receipt'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}

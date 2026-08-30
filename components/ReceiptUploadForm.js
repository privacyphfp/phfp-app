'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { exceedsMaxUploadSize, MAX_UPLOAD_LABEL } from '@/lib/fileUpload';

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
    if (exceedsMaxUploadSize(file)) {
      setError(`File must be ${MAX_UPLOAD_LABEL} or smaller.`);
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
      <span className="whitespace-nowrap text-brand-ink/60">Issue receipt to student:</span>
      <label
        htmlFor={fileInputId}
        className="cursor-pointer text-xs font-medium text-brand-blue underline underline-offset-2 hover:text-brand-blue-dark"
      >
        📎 Choose file
      </label>
      <span className="truncate text-xs text-brand-ink/50">
        {file ? file.name : 'No file chosen'} · Max {MAX_UPLOAD_LABEL}
      </span>
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
        className="rounded-full bg-brand-blue px-3 py-1 text-xs font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
      >
        {loading ? 'Uploading…' : 'Upload Receipt'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}

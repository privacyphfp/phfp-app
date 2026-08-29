'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const OTHER_VALUE = '__other__';

export default function CertificateUploadForm({ studentId, courseId, instructors }) {
  const router = useRouter();
  const [issuedDate, setIssuedDate] = useState('');
  const [file, setFile] = useState(null);
  const [instructorId, setInstructorId] = useState('');
  const [instructorName, setInstructorName] = useState('');
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
      const path = `${studentId}/${courseId}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('certificates').upload(path, file);
      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const { error: insertError } = await supabase.from('certificates').insert({
        student_id: studentId,
        course_id: courseId,
        file_url: path,
        issued_date: issuedDate || null,
        instructor_id: instructorId && instructorId !== OTHER_VALUE ? instructorId : null,
        instructor_name: instructorId === OTHER_VALUE ? instructorName.trim() || null : null,
      });
      if (insertError) {
        setError(insertError.message);
        return;
      }

      setFile(null);
      setIssuedDate('');
      setInstructorId('');
      setInstructorName('');
      router.refresh();
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-brand-blue/20 px-3 py-1.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <label className="text-sm text-brand-ink/80">
        Date Completed
        <input
          type="date"
          value={issuedDate}
          onChange={(e) => setIssuedDate(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="text-sm text-brand-ink/80">
        Instructor
        <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} className={inputClass}>
          <option value="">Select instructor</option>
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label}
            </option>
          ))}
          <option value={OTHER_VALUE}>Other</option>
        </select>
      </label>

      {instructorId === OTHER_VALUE && (
        <label className="text-sm text-brand-ink/80">
          Instructor name
          <input
            type="text"
            value={instructorName}
            onChange={(e) => setInstructorName(e.target.value)}
            placeholder="Type their name"
            className={inputClass}
          />
        </label>
      )}

      <div className="text-sm text-brand-ink/80">
        Certificate File
        <div className="mt-1">
          <label
            htmlFor="certificate-file"
            className="inline-block cursor-pointer rounded-full border border-brand-blue/30 bg-brand-blue/5 px-3 py-1.5 text-xs font-medium text-brand-blue transition-colors hover:border-brand-blue hover:bg-brand-blue/10"
          >
            Choose File to Upload
          </label>
          <p className="mt-1.5 truncate text-xs text-brand-ink/50">{file ? file.name : 'No file chosen'}</p>
        </div>
        <input
          id="certificate-file"
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
      >
        {loading ? 'Uploading…' : 'Submit Certificate'}
      </button>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const COLUMNS = ['Full Name', 'Birthdate', 'Religion', 'Address', 'Profession', 'Phone', 'Email', 'Facebook', 'Referred by'];

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows) {
  const lines = [COLUMNS.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(','));
  }
  return lines.join('\r\n');
}

export default function ExportEnrollmentsButton({ offeringId, fileName }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleExport() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('enrollments')
        .select(
          'referred_by, profiles(first_name, last_name, full_name, birthdate, religion, address, profession, phone, email, fb_link)'
        )
        .eq('course_offering_id', offeringId);

      if (error) {
        setError(error.message);
        return;
      }

      const rows = (data ?? []).map((e) => {
        const p = e.profiles ?? {};
        const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.full_name || '';
        return [fullName, p.birthdate ?? '', p.religion ?? '', p.address ?? '', p.profession ?? '', p.phone ?? '', p.email ?? '', p.fb_link ?? '', e.referred_by ?? ''];
      });

      const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
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
        onClick={handleExport}
        disabled={loading}
        className="rounded-full border border-brand-blue/30 px-3 py-1 text-xs font-medium text-brand-blue transition-colors hover:bg-brand-blue/10 disabled:opacity-50"
      >
        {loading ? 'Exporting…' : 'Export CSV'}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

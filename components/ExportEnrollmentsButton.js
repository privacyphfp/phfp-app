'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PAYMENT_METHOD_LABELS } from '@/lib/paymentMethods';

// Mirrors the on-screen roster table's columns (see
// app/admin/courses/[offeringId]/page.js) — Student splits into three
// (Name/Email/Phone) since a CSV column is naturally one field, and
// Save isn't data so it's dropped; Receipt becomes a plain Yes/No.
const COLUMNS = [
  'Date Enrolled',
  'Full Name',
  'Email',
  'Phone',
  'Type',
  'Referred By',
  'Fee / Tithe',
  'Mode of Payment',
  'Amount Received',
  'Invoice #',
  'Date Paid',
  'Payment Verified',
  'Receipt Issued',
  'Attendance',
];

const STATUS_LABELS = {
  registered: 'Registered',
  completed: 'Completed',
  no_show: 'No Show',
  waitlisted: 'Waitlisted',
  cancelled: 'Cancelled',
};

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
          'enrolled_at, referred_by, enrollment_type, tithe_amount, amount_paid, payment_verified, invoice_number, payment_date, receipt_url, payment_method, status, profiles(first_name, last_name, full_name, email, phone), course_offerings(price)'
        )
        .eq('course_offering_id', offeringId);

      if (error) {
        setError(error.message);
        return;
      }

      const rows = (data ?? []).map((e) => {
        const p = e.profiles ?? {};
        const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.full_name || '';
        const isReview = e.enrollment_type === 'review';
        return [
          e.enrolled_at ? e.enrolled_at.slice(0, 10) : '',
          fullName,
          p.email ?? '',
          p.phone ?? '',
          isReview ? 'Review' : 'New',
          e.referred_by ?? '',
          isReview
            ? e.tithe_amount != null
              ? `Tithe: ₱${e.tithe_amount}`
              : 'Tithe: —'
            : e.course_offerings?.price
              ? `Fee: ₱${e.course_offerings.price}`
              : 'Fee: Free',
          e.payment_method ? (PAYMENT_METHOD_LABELS[e.payment_method] ?? e.payment_method) : '',
          e.amount_paid ?? '',
          e.invoice_number ?? '',
          e.payment_date ?? '',
          e.payment_verified ? 'Yes' : 'No',
          e.receipt_url ? 'Yes' : 'No',
          STATUS_LABELS[e.status] ?? e.status ?? '',
        ];
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

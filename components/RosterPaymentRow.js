'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const STATUS_OPTIONS = [
  { value: 'registered', label: 'Registered' },
  { value: 'completed', label: 'Completed' },
  { value: 'no_show', label: 'No Show' },
  { value: 'waitlisted', label: 'Waitlisted' },
  { value: 'cancelled', label: 'Cancelled' },
];

const inputClass =
  'w-full rounded-lg border border-brand-blue/20 px-2 py-1 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900';

// Renders as a run of <td> cells (a fragment, not a <form> — a form
// element can't validly wrap cells across a <tr>), meant to be dropped
// into a roster row alongside the other plain cells. One shared Save
// button commits amount/invoice/date/verified/attendance together.
export default function RosterPaymentRow({
  enrollmentId,
  initialAmountPaid,
  initialInvoiceNumber,
  initialPaymentDate,
  initialVerified,
  initialStatus,
  receiptCell,
}) {
  const router = useRouter();
  const [amountPaid, setAmountPaid] = useState(initialAmountPaid ?? '');
  const [invoiceNumber, setInvoiceNumber] = useState(initialInvoiceNumber ?? '');
  const [paymentDate, setPaymentDate] = useState(initialPaymentDate ?? '');
  const [verified, setVerified] = useState(initialVerified ?? false);
  const [status, setStatus] = useState(initialStatus ?? 'registered');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setError(null);
    setSaved(false);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('enrollments')
        .update({
          amount_paid: amountPaid === '' ? null : Number(amountPaid),
          invoice_number: invoiceNumber.trim() || null,
          payment_date: paymentDate || null,
          payment_verified: verified,
          status,
        })
        .eq('id', enrollmentId);

      if (error) {
        setError(error.message);
        return;
      }

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <td className="min-w-[110px] p-3">
        <input
          type="number"
          min="0"
          step="0.01"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          placeholder="₱0.00"
          className={inputClass}
        />
      </td>
      <td className="min-w-[110px] p-3">
        <input
          type="text"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          placeholder="Invoice #"
          className={inputClass}
        />
      </td>
      <td className="min-w-[140px] p-3">
        <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className={inputClass} />
      </td>
      <td className="p-3 text-center">
        <input
          type="checkbox"
          checked={verified}
          onChange={(e) => setVerified(e.target.checked)}
          className="h-4 w-4 accent-brand-blue"
        />
      </td>
      <td className="min-w-[220px] p-3">{receiptCell}</td>
      <td className="min-w-[150px] p-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </td>
      <td className="min-w-[90px] p-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="rounded-full bg-brand-blue px-3 py-1 text-xs font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
        {saved && <div className="mt-1 text-xs text-brand-blue">Saved.</div>}
        {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
      </td>
    </>
  );
}

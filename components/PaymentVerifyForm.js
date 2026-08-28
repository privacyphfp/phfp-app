'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function PaymentVerifyForm({
  enrollmentId,
  initialAmountPaid,
  initialVerified,
  initialInvoiceNumber,
  initialPaymentDate,
}) {
  const router = useRouter();
  const [amountPaid, setAmountPaid] = useState(initialAmountPaid ?? '');
  const [verified, setVerified] = useState(initialVerified ?? false);
  const [invoiceNumber, setInvoiceNumber] = useState(initialInvoiceNumber ?? '');
  const [paymentDate, setPaymentDate] = useState(initialPaymentDate ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('enrollments')
        .update({
          amount_paid: amountPaid === '' ? null : Number(amountPaid),
          payment_verified: verified,
          invoice_number: invoiceNumber.trim() || null,
          payment_date: paymentDate || null,
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
    <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <span className="text-brand-ink/60">Amount received: ₱</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={amountPaid}
        onChange={(e) => setAmountPaid(e.target.value)}
        className="w-24 rounded-lg border border-brand-blue/20 px-2 py-1 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
      />
      <input
        type="text"
        placeholder="Invoice #"
        value={invoiceNumber}
        onChange={(e) => setInvoiceNumber(e.target.value)}
        className="w-28 rounded-lg border border-brand-blue/20 px-2 py-1 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
      />
      <input
        type="date"
        value={paymentDate}
        onChange={(e) => setPaymentDate(e.target.value)}
        title="Date paid"
        className="rounded-lg border border-brand-blue/20 px-2 py-1 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
      />
      <label className="flex items-center gap-1.5 text-brand-ink/70">
        <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="accent-brand-blue" />
        Payment verified
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-full border border-brand-blue/30 px-3 py-1 text-xs font-medium text-brand-blue transition-colors hover:bg-brand-blue/10 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save'}
      </button>
      {saved && <span className="text-xs text-brand-blue">Saved.</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}

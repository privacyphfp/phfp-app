'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS_NEEDING_PROOF } from '@/lib/paymentMethods';
import { exceedsMaxUploadSize, MAX_UPLOAD_LABEL } from '@/lib/fileUpload';
import { NDA_PARAGRAPHS } from '@/lib/ndaText';
import SignaturePad from '@/components/SignaturePad';
import SuccessModal from '@/components/SuccessModal';
import Modal from '@/components/Modal';

export default function EnrollButton({
  offeringId,
  studentId,
  courseName,
  startDate,
  endDate,
  location,
  isOnline,
  instructor,
  price,
  disabled,
  label,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [referredBy, setReferredBy] = useState('');
  const [enrollmentType, setEnrollmentType] = useState('new');
  const [titheAmount, setTitheAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [ndaSignature, setNdaSignature] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEnrolled, setShowEnrolled] = useState(false);

  const needsProof = PAYMENT_METHODS_NEEDING_PROOF.includes(paymentMethod);

  async function handleSubmit() {
    if (!referredBy.trim()) {
      setError('Please enter who referred you.');
      return;
    }
    if (!paymentMethod) {
      setError('Please choose how you will pay.');
      return;
    }
    if (enrollmentType === 'review' && (titheAmount === '' || Number(titheAmount) <= 0)) {
      setError('Please enter the amount you will tithe.');
      return;
    }
    if (needsProof) {
      if (!proofFile) {
        setError('Please upload proof of payment.');
        return;
      }
      if (exceedsMaxUploadSize(proofFile)) {
        setError(`Proof of payment must be ${MAX_UPLOAD_LABEL} or smaller.`);
        return;
      }
    }
    if (!ndaSignature) {
      setError('Please sign the Confidentiality and Non-Disclosure Agreement below.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      let paymentProofPath = null;
      if (needsProof && proofFile) {
        const ext = proofFile.name.split('.').pop();
        paymentProofPath = `${studentId}/${offeringId}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('payment_proofs')
          .upload(paymentProofPath, proofFile);
        if (uploadError) {
          setError(uploadError.message);
          return;
        }
      }

      const { error } = await supabase.from('enrollments').insert({
        student_id: studentId,
        course_offering_id: offeringId,
        referred_by: referredBy.trim(),
        enrollment_type: enrollmentType,
        tithe_amount: enrollmentType === 'review' ? Number(titheAmount) : null,
        payment_method: paymentMethod,
        payment_proof_url: paymentProofPath,
        nda_signature: ndaSignature,
        nda_agreed_at: new Date().toISOString(),
      });

      if (error) {
        setError(error.message);
        return;
      }

      setOpen(false);
      setShowEnrolled(true);
      router.refresh();
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'mb-3 w-full rounded-lg border border-brand-blue/20 px-3 py-1.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900';

  const dateRange = startDate ? `${startDate}${endDate && endDate !== startDate ? ` – ${endDate}` : ''}` : null;

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="rounded-full bg-brand-blue px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:bg-brand-ink/20 disabled:text-brand-ink/50 disabled:shadow-none"
      >
        {label}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Enroll" maxWidthClass="max-w-sm">
        {(courseName || dateRange) && (
          <div className="mb-4 rounded-lg bg-brand-blue/5 p-3 text-sm">
            {courseName && <div className="font-medium text-brand-ink">{courseName}</div>}
            {dateRange && (
              <div className="mt-0.5 text-brand-ink/60">
                Date of Course: <span className="font-medium text-brand-blue">{dateRange}</span>
              </div>
            )}
            <div className="mt-0.5 text-brand-ink/60">
              {isOnline ? 'Online' : location || 'TBD'} · {price ? `₱${price}` : 'Free'}
            </div>
            {instructor && (
              <div className="mt-0.5 text-brand-ink/60">
                Instructor/s: <span className="font-medium text-brand-ink">{instructor}</span>
              </div>
            )}
          </div>
        )}

        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

        <div className="mb-3 flex gap-4 text-sm text-brand-ink/80">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name={`enrollment-type-${offeringId}`}
              value="new"
              checked={enrollmentType === 'new'}
              onChange={() => setEnrollmentType('new')}
            />
            New
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name={`enrollment-type-${offeringId}`}
              value="review"
              checked={enrollmentType === 'review'}
              onChange={() => setEnrollmentType('review')}
            />
            Review
          </label>
        </div>

        {enrollmentType === 'review' ? (
          <>
            <label className="mb-1 block text-sm text-brand-ink/80">
              Amount to tithe (₱) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={titheAmount}
              onChange={(e) => setTitheAmount(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </>
        ) : (
          price != null && (
            <p className="mb-3 text-sm text-brand-ink/70">
              Amount to pay: <span className="font-medium text-brand-ink">₱{price}</span>
            </p>
          )
        )}

        <label className="mb-1 block text-sm text-brand-ink/80">
          Referred by <span className="text-red-600">*</span>
        </label>
        <input
          value={referredBy}
          onChange={(e) => setReferredBy(e.target.value)}
          placeholder="Who referred you?"
          className={inputClass}
        />

        <label className="mb-1 block text-sm text-brand-ink/80">
          How will you pay? <span className="text-red-600">*</span>
        </label>
        <div className="mb-3 flex flex-col gap-1.5 text-sm text-brand-ink/80">
          {Object.entries(PAYMENT_METHOD_LABELS).map(([value, methodLabel]) => (
            <label key={value} className="flex items-center gap-1.5">
              <input
                type="radio"
                name={`payment-method-${offeringId}`}
                value={value}
                checked={paymentMethod === value}
                onChange={() => setPaymentMethod(value)}
              />
              {methodLabel}
            </label>
          ))}
        </div>

        {needsProof && (
          <div className="mb-3 text-sm">
            <label
              htmlFor={`proof-file-${offeringId}`}
              className="inline-block cursor-pointer rounded-full border border-brand-blue/30 bg-brand-blue/5 px-3 py-1.5 text-xs font-medium text-brand-blue transition-colors hover:border-brand-blue hover:bg-brand-blue/10"
            >
              Upload Proof of Payment
            </label>
            <p className="mt-1 text-xs text-brand-ink/50">
              {proofFile ? proofFile.name : 'No file chosen'} · Max {MAX_UPLOAD_LABEL}
            </p>
            <input
              id={`proof-file-${offeringId}`}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </div>
        )}

        <p className="mb-1 text-sm text-brand-ink/80">
          Confidentiality and Non-Disclosure Agreement <span className="text-red-600">*</span>
        </p>
        <div className="mb-3 max-h-32 space-y-2 overflow-y-auto rounded-lg border border-brand-gold/40 bg-brand-amber/5 p-3 text-xs leading-relaxed text-brand-ink/80">
          {NDA_PARAGRAPHS.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <SignaturePad value={ndaSignature} onChange={setNdaSignature} height={100} />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 w-full rounded-full bg-brand-blue px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
        >
          {loading ? 'Enrolling…' : 'Confirm Enrollment'}
        </button>
      </Modal>

      <SuccessModal
        open={showEnrolled}
        title="You're enrolled!"
        message="Your enrollment has been submitted. Staff will verify your payment shortly."
        onClose={() => setShowEnrolled(false)}
      />
    </div>
  );
}

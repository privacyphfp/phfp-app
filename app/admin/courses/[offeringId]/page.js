import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { ADMIN_ROLES } from '@/lib/roles';
import { formatInstructorName } from '@/lib/formatInstructor';
import { signReceiptUrls } from '@/lib/receiptUrl';
import { signPaymentProofUrls } from '@/lib/paymentProofUrl';
import { PAYMENT_METHOD_LABELS } from '@/lib/paymentMethods';
import RosterPaymentRow from '@/components/RosterPaymentRow';
import ReceiptUploadForm from '@/components/ReceiptUploadForm';
import ExportEnrollmentsButton from '@/components/ExportEnrollmentsButton';

function formatDateEnrolled(isoTimestamp) {
  if (!isoTimestamp) return '—';
  return new Date(isoTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// One group section (New or Review) — a header row spanning every column,
// then one <tr> per enrollment in that group.
function RosterGroup({ label, rows }) {
  if (!rows.length) return null;
  return (
    <>
      <tr className="bg-brand-blue/5">
        <td colSpan={13} className="p-2 text-xs font-semibold tracking-wide text-brand-blue uppercase">
          {label} ({rows.length})
        </td>
      </tr>
      {rows.map((e) => {
        const name =
          e.profiles?.full_name || [e.profiles?.first_name, e.profiles?.last_name].filter(Boolean).join(' ') || 'Unnamed student';
        return (
          <tr key={e.id} className="border-b border-brand-blue/10 align-top last:border-0">
            <td className="min-w-[110px] p-3 whitespace-nowrap text-brand-ink/60">{formatDateEnrolled(e.enrolled_at)}</td>
            <td className="min-w-[170px] p-3">
              <Link href={`/admin/students/${e.student_id}`} className="font-medium text-brand-ink hover:underline">
                {name}
              </Link>
              <div className="mt-0.5 text-xs text-brand-ink/50">{e.profiles?.email}</div>
              {e.profiles?.phone && <div className="mt-0.5 text-xs text-brand-ink/50">{e.profiles.phone}</div>}
            </td>
            <td className="min-w-[80px] p-3">
              <span className={e.enrollment_type === 'review' ? 'text-brand-flame' : 'text-brand-blue'}>
                {e.enrollment_type === 'review' ? 'Review' : 'New'}
              </span>
            </td>
            <td className="min-w-[120px] p-3 whitespace-nowrap text-brand-ink/60">{e.referred_by || '—'}</td>
            <td className="min-w-[100px] p-3 whitespace-nowrap text-brand-ink/60">
              {e.enrollment_type === 'review'
                ? `Tithe: ${e.tithe_amount != null ? `₱${e.tithe_amount}` : '—'}`
                : `Fee: ${e.course_offerings_price ? `₱${e.course_offerings_price}` : 'Free'}`}
            </td>
            <td className="min-w-[130px] p-3 whitespace-nowrap text-brand-ink/60">
              {e.payment_method ? PAYMENT_METHOD_LABELS[e.payment_method] ?? e.payment_method : '—'}
              {e.paymentProofSignedUrl && (
                <a
                  href={e.paymentProofSignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 block text-xs text-brand-blue underline underline-offset-2"
                >
                  View proof
                </a>
              )}
            </td>
            <RosterPaymentRow
              enrollmentId={e.id}
              initialAmountPaid={e.amount_paid}
              initialInvoiceNumber={e.invoice_number}
              initialPaymentDate={e.payment_date}
              initialVerified={e.payment_verified}
              initialStatus={e.status}
              receiptCell={
                <>
                  {e.receiptSignedUrl && (
                    <a
                      href={e.receiptSignedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-1 block text-xs text-brand-blue underline underline-offset-2"
                    >
                      View current receipt
                    </a>
                  )}
                  <ReceiptUploadForm enrollmentId={e.id} studentId={e.student_id} />
                </>
              }
            />
          </tr>
        );
      })}
    </>
  );
}

export default async function AdminOfferingRosterPage({ params }) {
  const { offeringId } = await params;
  const { supabase } = await requireProfile(ADMIN_ROLES);

  const { data: offering } = await supabase
    .from('course_offerings')
    .select(
      'id, start_date, end_date, location, is_online, price, capacity, status, course_id, region_id, instructor_id, instructor_name, courses(code, name), regions(name)'
    )
    .eq('id', offeringId)
    .single();

  if (!offering) {
    return (
      <div className="mx-auto w-full max-w-3xl p-8">
        <p className="text-brand-ink/60">Offering not found.</p>
        <Link href="/admin/courses" className="mt-2 inline-block text-brand-blue hover:underline">
          ← Back to Manage Course Offerings
        </Link>
      </div>
    );
  }

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(
      'id, status, enrollment_type, enrolled_at, referred_by, tithe_amount, amount_paid, payment_verified, invoice_number, payment_date, receipt_url, payment_method, payment_proof_url, student_id, profiles(first_name, last_name, full_name, email, phone)'
    )
    .eq('course_offering_id', offeringId)
    .order('enrolled_at');

  const enrollmentsWithReceipts = (
    await signPaymentProofUrls(supabase, await signReceiptUrls(supabase, enrollments ?? []))
  ).map((e) => ({ ...e, course_offerings_price: offering.price }));

  // New shown first, Review second — each group internally still sorted
  // by enrolled_at (the base query's order, preserved by filter()).
  const newRows = enrollmentsWithReceipts.filter((e) => e.enrollment_type !== 'review');
  const reviewRows = enrollmentsWithReceipts.filter((e) => e.enrollment_type === 'review');

  let instructor = null;
  if (offering.instructor_id) {
    const { data: p } = await supabase
      .from('profiles')
      .select('full_name, first_name, last_name')
      .eq('id', offering.instructor_id)
      .single();
    instructor = p ? formatInstructorName(p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ')) : null;
  } else if (offering.instructor_name) {
    instructor = formatInstructorName(offering.instructor_name);
  }

  return (
    <div className="w-full p-8">
      <Link href="/admin/courses" className="text-sm text-brand-blue hover:underline">
        ← Back to Manage Course Offerings
      </Link>

      <h1 className="mt-3 text-2xl font-semibold text-brand-blue-dark">
        {offering.courses?.name ?? 'Unknown course'}
      </h1>
      <div className="mt-1 text-sm text-brand-ink/60">
        {offering.start_date}
        {offering.end_date && offering.end_date !== offering.start_date ? ` – ${offering.end_date}` : ''} ·{' '}
        {offering.is_online ? 'Online' : offering.location || 'TBD'} ·{' '}
        {offering.price ? `₱${offering.price}` : 'Free'} · {offering.regions?.name ?? 'Nationwide'}
      </div>
      {instructor && (
        <div className="mt-1 text-sm text-brand-ink/60">
          Instructor/s: <span className="font-medium text-brand-ink">{instructor}</span>
        </div>
      )}

      <div className="mt-6 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-brand-ink/90">
          Enrolled Students ({enrollmentsWithReceipts.length}
          {offering.capacity ? ` / ${offering.capacity}` : ''})
        </h2>
        {enrollmentsWithReceipts.length > 0 && (
          <ExportEnrollmentsButton
            offeringId={offering.id}
            fileName={`${offering.courses?.code ?? 'course'}-${offering.start_date}-roster`}
          />
        )}
      </div>

      {enrollmentsWithReceipts.length > 0 ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-brand-blue/15 bg-white/60 shadow-sm dark:bg-white/5">
          <table className="w-full min-w-[1500px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-brand-blue/15 text-left text-xs font-semibold tracking-wide text-brand-ink/50 uppercase">
                <th className="p-3">Date Enrolled</th>
                <th className="p-3">Student</th>
                <th className="p-3">Type</th>
                <th className="p-3">Referred By</th>
                <th className="p-3">Fee / Tithe</th>
                <th className="p-3">Mode of Payment</th>
                <th className="p-3">Amount Received</th>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Date Paid</th>
                <th className="p-3">Verified</th>
                <th className="p-3">Receipt</th>
                <th className="p-3">Attendance</th>
                <th className="p-3">Save</th>
              </tr>
            </thead>
            <tbody>
              <RosterGroup label="New" rows={newRows} />
              <RosterGroup label="Review" rows={reviewRows} />
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-brand-ink/50">No one has enrolled yet.</p>
      )}
    </div>
  );
}

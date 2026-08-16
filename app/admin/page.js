import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { signCertificateUrls } from '@/lib/certificateUrl';
import CertificateVerifyButton from '@/components/CertificateVerifyButton';
import PaymentVerifyForm from '@/components/PaymentVerifyForm';

function studentName(p) {
  return p?.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ') || 'Unnamed student';
}

export default async function AdminPage() {
  const { supabase } = await requireProfile(['admin']);

  const [
    { count: studentCount },
    { count: offeringCount },
    { count: pendingCount },
    { data: pendingCertificates },
    { data: unverifiedEnrollments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('course_offerings').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'registered'),
    supabase
      .from('certificates')
      .select('id, file_url, issued_date, student_id, courses(code, name), profiles(full_name, first_name, last_name)')
      .eq('verified', false)
      .order('created_at', { ascending: true }),
    supabase
      .from('enrollments')
      .select(
        'id, enrollment_type, amount_paid, tithe_amount, course_offering_id, student_id, course_offerings(start_date, price, courses(code, name)), profiles(full_name, first_name, last_name)'
      )
      .eq('payment_verified', false)
      .order('enrolled_at', { ascending: true }),
  ]);

  const certificatesWithUrls = await signCertificateUrls(supabase, pendingCertificates ?? []);

  // Only surface enrollments that actually involve money — free offerings
  // default to payment_verified = false too, but there's nothing to verify.
  const pendingPayments = (unverifiedEnrollments ?? []).filter(
    (e) => (e.course_offerings?.price ?? 0) > 0 || e.enrollment_type === 'review'
  );

  return (
    <div className="mx-auto w-full max-w-3xl p-8">
      <h1 className="text-2xl font-semibold text-brand-blue-dark">Admin Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="Students" value={studentCount ?? 0} />
        <Stat label="Course Offerings" value={offeringCount ?? 0} />
        <Stat label="Pending Enrollments" value={pendingCount ?? 0} />
        <Stat label="Certificates to Verify" value={certificatesWithUrls.length} />
        <Stat label="Payments to Verify" value={pendingPayments.length} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1 rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark"
        >
          Manage Course Offerings →
        </Link>
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1 rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark"
        >
          Manage Students →
        </Link>
        <Link
          href="/student"
          className="inline-flex items-center gap-1 rounded-full border border-brand-flame/30 bg-brand-amber/10 px-5 py-2 text-sm font-medium text-brand-flame transition-colors hover:bg-brand-amber/20"
        >
          Preview as Student →
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-brand-ink/90">Pending Approvals</h2>

        <h3 className="mt-4 text-sm font-semibold tracking-wide text-brand-ink/50 uppercase">
          Certificates ({certificatesWithUrls.length})
        </h3>
        <ul className="mt-2 space-y-2">
          {certificatesWithUrls.map((c) => (
            <li key={c.id} className="rounded-xl border border-brand-blue/15 bg-white/60 p-3 text-sm shadow-sm dark:bg-white/5">
              <div className="flex items-baseline justify-between">
                <Link href={`/admin/students/${c.student_id}`} className="font-medium text-brand-ink hover:underline">
                  {studentName(c.profiles)}
                </Link>
                <span className="text-brand-ink/50">{c.issued_date}</span>
              </div>
              <div className="mt-1 text-brand-ink/60">{c.courses?.code || c.courses?.name}</div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {c.signedUrl && (
                  <a
                    href={c.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-blue underline underline-offset-2"
                  >
                    View file
                  </a>
                )}
                <CertificateVerifyButton certificateId={c.id} verified={false} />
              </div>
            </li>
          ))}
          {!certificatesWithUrls.length && <p className="text-sm text-brand-ink/50">Nothing pending.</p>}
        </ul>

        <h3 className="mt-6 text-sm font-semibold tracking-wide text-brand-ink/50 uppercase">
          Payments ({pendingPayments.length})
        </h3>
        <ul className="mt-2 space-y-2">
          {pendingPayments.map((e) => (
            <li key={e.id} className="rounded-xl border border-brand-blue/15 bg-white/60 p-3 text-sm shadow-sm dark:bg-white/5">
              <div className="flex items-baseline justify-between">
                <Link href={`/admin/students/${e.student_id}`} className="font-medium text-brand-ink hover:underline">
                  {studentName(e.profiles)}
                </Link>
                <span className="text-brand-ink/50">{e.course_offerings?.start_date}</span>
              </div>
              <div className="mt-1 text-brand-ink/60">
                {e.course_offerings?.courses?.code || e.course_offerings?.courses?.name}
                {' · '}
                {e.enrollment_type === 'review'
                  ? `Tithe${e.tithe_amount != null ? `: ₱${e.tithe_amount}` : ''}`
                  : `Price: ₱${e.course_offerings?.price ?? 0}`}
              </div>
              <PaymentVerifyForm enrollmentId={e.id} initialAmountPaid={e.amount_paid} initialVerified={false} />
              <Link
                href={`/admin/courses/${e.course_offering_id}`}
                className="mt-2 inline-block text-xs text-brand-blue underline underline-offset-2"
              >
                View full roster
              </Link>
            </li>
          ))}
          {!pendingPayments.length && <p className="text-sm text-brand-ink/50">Nothing pending.</p>}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-brand-gold/40 bg-brand-amber/5 p-4">
      <div className="text-3xl font-semibold text-brand-blue-dark">{value}</div>
      <div className="text-sm text-brand-ink/60">{label}</div>
    </div>
  );
}

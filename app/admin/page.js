import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { ADMIN_ROLES } from '@/lib/roles';
import { signCertificateUrls } from '@/lib/certificateUrl';
import { formatInstructorName } from '@/lib/formatInstructor';
import { formatCourseDateRange } from '@/lib/dateRange';
import { isPastOffering, isToday } from '@/lib/offeringStatus';
import CertificateVerifyButton from '@/components/CertificateVerifyButton';
import PaymentVerifyForm from '@/components/PaymentVerifyForm';

function studentName(p) {
  return p?.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ') || 'Unnamed student';
}

const EVENT_TYPE_LABELS = {
  one_time: 'One-time',
  special: 'Special event',
  weekly: 'Weekly event',
};

export default async function AdminPage() {
  const { supabase } = await requireProfile(ADMIN_ROLES);

  const [
    { count: studentCount },
    { count: offeringCount },
    { count: pendingCount },
    { data: pendingCertificates },
    { data: unverifiedEnrollments },
    { data: allOfferings },
    { data: enrollmentCounts },
    { data: allEvents },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('course_offerings').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'registered'),
    supabase
      .from('certificates')
      .select(
        'id, file_url, issued_date, declined, student_id, courses(code, name), profiles!certificates_student_id_fkey(full_name, first_name, last_name)'
      )
      .eq('verified', false)
      .eq('declined', false)
      .order('created_at', { ascending: true }),
    supabase
      .from('enrollments')
      .select(
        'id, enrollment_type, amount_paid, invoice_number, payment_date, tithe_amount, course_offering_id, student_id, course_offerings(start_date, price, course_id, instructor_id, instructor_name, courses(code, name)), profiles(full_name, first_name, last_name)'
      )
      .eq('payment_verified', false)
      .order('enrolled_at', { ascending: true }),
    supabase
      .from('course_offerings')
      .select(
        'id, start_date, end_date, location, is_online, price, capacity, status, instructor_id, instructor_name, courses(code, name)'
      )
      .order('start_date', { ascending: true }),
    supabase.from('enrollments').select('course_offering_id, enrollment_type, status').neq('status', 'cancelled'),
    supabase
      .from('events')
      .select('id, title, event_type, start_date, end_date, location, is_online')
      .order('start_date', { ascending: true }),
  ]);

  const certificatesWithUrls = await signCertificateUrls(supabase, pendingCertificates ?? []);

  // Group by course — same idea as the payments grouping below, so all
  // pending submissions for one course sit under a single header.
  const certificatesByCourse = [];
  const certCourseIndex = new Map();
  for (const c of certificatesWithUrls) {
    const key = c.courses?.code ?? c.courses?.name ?? 'unknown';
    if (!certCourseIndex.has(key)) {
      certCourseIndex.set(key, { course: c.courses, items: [] });
      certificatesByCourse.push(certCourseIndex.get(key));
    }
    certCourseIndex.get(key).items.push(c);
  }

  // Only surface enrollments that actually involve money — free offerings
  // default to payment_verified = false too, but there's nothing to verify.
  const pendingPayments = (unverifiedEnrollments ?? []).filter(
    (e) => (e.course_offerings?.price ?? 0) > 0 || e.enrollment_type === 'review'
  );

  // Past offerings/events drop off this dashboard summary entirely — still
  // visible in Reports and the Calendar, and via "Manage Course Offerings"
  // for anyone who needs to reach an old roster.
  const upcomingOfferings = (allOfferings ?? []).filter((o) => !isPastOffering(o));
  const upcomingEvents = (allEvents ?? []).filter((ev) => !isPastOffering(ev));

  // Merged, date-sorted list for the "Upcoming Courses and Events" grid
  // and the "Today" callout above it.
  const upcomingItems = [
    ...upcomingOfferings.map((o) => ({ kind: 'course', id: o.id, startDate: o.start_date, data: o })),
    ...upcomingEvents.map((ev) => ({ kind: 'event', id: ev.id, startDate: ev.start_date, data: ev })),
  ].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const todayItems = upcomingItems.filter((item) => isToday(item.data));

  const instructorIds = [
    ...new Set([
      ...pendingPayments.map((e) => e.course_offerings?.instructor_id),
      ...upcomingOfferings.map((o) => o.instructor_id),
    ]),
  ].filter(Boolean);
  const { data: instructorProfiles } = instructorIds.length
    ? await supabase.from('profiles').select('id, full_name, first_name, last_name').in('id', instructorIds)
    : { data: [] };
  const instructorById = Object.fromEntries((instructorProfiles ?? []).map((p) => [p.id, p]));

  function offeringInstructorLabel(o) {
    if (o?.instructor_id) {
      const p = instructorById[o.instructor_id];
      return p ? formatInstructorName(p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ')) : null;
    }
    return formatInstructorName(o?.instructor_name) || null;
  }

  // Group by the specific offering (not just the course) — the same
  // course can run multiple times with a different date/instructor, so
  // each of those needs its own header rather than being lumped together.
  const paymentsByOffering = [];
  const offeringIndex = new Map();
  for (const e of pendingPayments) {
    const key = e.course_offering_id ?? 'unknown';
    if (!offeringIndex.has(key)) {
      offeringIndex.set(key, { offering: e.course_offerings, offeringId: e.course_offering_id, items: [] });
      paymentsByOffering.push(offeringIndex.get(key));
    }
    offeringIndex.get(key).items.push(e);
  }

  // New vs Review enrollment counts per offering, for the Course
  // Offerings summary below — excludes cancelled enrollments.
  const countsByOfferingId = new Map();
  for (const e of enrollmentCounts ?? []) {
    const entry = countsByOfferingId.get(e.course_offering_id) ?? { newCount: 0, reviewCount: 0 };
    if (e.enrollment_type === 'review') entry.reviewCount += 1;
    else entry.newCount += 1;
    countsByOfferingId.set(e.course_offering_id, entry);
  }

  function ItemCard({ item }) {
    if (item.kind === 'event') {
      const ev = item.data;
      return (
        <div className="rounded-xl border border-brand-gold/40 bg-brand-amber/5 p-4 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold text-brand-ink">{ev.title}</p>
            <span className="rounded-full bg-brand-flame/10 px-2 py-0.5 text-xs font-medium text-brand-flame">
              {EVENT_TYPE_LABELS[ev.event_type] ?? ev.event_type}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-brand-ink/60">
            📅 <span className="font-medium text-brand-blue">{formatCourseDateRange(ev.start_date, ev.end_date)}</span>
          </p>
          <p className="mt-0.5 text-sm text-brand-ink/60">📍 {ev.is_online ? 'Online' : ev.location || 'TBD'}</p>
        </div>
      );
    }

    const o = item.data;
    const counts = countsByOfferingId.get(o.id) ?? { newCount: 0, reviewCount: 0 };
    const total = counts.newCount + counts.reviewCount;
    return (
      <Link
        href={`/admin/courses/${o.id}`}
        className="block rounded-xl border border-brand-gold/40 bg-brand-amber/5 p-4 shadow-sm transition-colors hover:bg-brand-amber/20"
      >
        <p className="font-semibold text-brand-ink">{o.courses?.code || o.courses?.name || 'Unknown course'}</p>
        <p className="mt-0.5 text-sm text-brand-ink/60">
          📅 <span className="font-medium text-brand-blue">{formatCourseDateRange(o.start_date, o.end_date)}</span>
        </p>
        <p className="mt-0.5 text-sm text-brand-ink/60">
          📍 {o.is_online ? 'Online' : o.location || 'TBD'} · Fee: {o.price ? `₱${o.price}` : 'Free'}
        </p>
        <p className="mt-0.5 text-sm text-brand-ink/60">
          Instructor/s: <span className="font-medium text-brand-ink">{offeringInstructorLabel(o) || 'Not assigned'}</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 font-medium text-brand-blue">New: {counts.newCount}</span>
          <span className="rounded-full bg-brand-flame/10 px-2 py-0.5 font-medium text-brand-flame">
            Review: {counts.reviewCount}
          </span>
          <span className="rounded-full bg-white/70 px-2 py-0.5 font-medium text-brand-ink/50 dark:bg-white/10">
            Total: {total}
            {o.capacity ? ` / ${o.capacity}` : ''}
          </span>
        </div>
        <span className="mt-3 inline-block text-xs font-medium text-brand-blue">View Roster →</span>
      </Link>
    );
  }

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
      </div>

      {todayItems.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-brand-ink/90">Courses and Events Today</h2>
            <span className="rounded-full bg-brand-flame/10 px-2.5 py-0.5 text-xs font-semibold text-brand-flame">
              {todayItems.length}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {todayItems.map((item) => (
              <ItemCard key={`${item.kind}-${item.id}`} item={item} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-brand-ink/90">Upcoming Courses and Events</h2>
        <p className="mt-1 text-sm text-brand-ink/60">Who&apos;s enrolled per offering, at a glance.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {upcomingItems.map((item) => (
            <ItemCard key={`${item.kind}-${item.id}`} item={item} countsByOfferingId={countsByOfferingId} offeringInstructorLabel={offeringInstructorLabel} />
          ))}
          {!upcomingItems.length && (
            <p className="text-sm text-brand-ink/50">Nothing upcoming — see Reports or the Calendar for past ones.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-brand-ink/90">Pending Approvals</h2>
          {certificatesWithUrls.length + pendingPayments.length > 0 && (
            <span className="rounded-full bg-brand-flame/10 px-2.5 py-0.5 text-xs font-semibold text-brand-flame">
              {certificatesWithUrls.length + pendingPayments.length}
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-brand-ink/50 uppercase">Certificates</h3>
          <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs font-medium text-brand-blue">
            {certificatesWithUrls.length}
          </span>
        </div>
        <div className="mt-3 space-y-4">
          {certificatesByCourse.map((group) => (
            <div key={group.course?.code ?? 'unknown'} className="rounded-2xl border border-brand-gold/40 bg-brand-amber/5 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-brand-ink">{group.course?.code || group.course?.name || 'Unknown course'}</p>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-brand-ink/50 dark:bg-white/10">
                  {group.items.length} pending
                </span>
              </div>

              <ul className="mt-3 space-y-2">
                {group.items.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-brand-blue/15 bg-white/70 p-3 text-sm shadow-sm dark:bg-white/10"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link href={`/admin/students/${c.student_id}`} className="font-medium text-brand-ink hover:underline">
                        {studentName(c.profiles)}
                      </Link>
                      {c.issued_date && <span className="text-xs text-brand-ink/50">{c.issued_date}</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {c.signedUrl && (
                        <a
                          href={c.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-brand-blue/30 px-3 py-1 text-xs font-medium text-brand-blue transition-colors hover:bg-brand-blue/10"
                        >
                          View file
                        </a>
                      )}
                      <CertificateVerifyButton certificateId={c.id} verified={false} declined={false} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!certificatesWithUrls.length && <p className="text-sm text-brand-ink/50">Nothing pending. 🎉</p>}
        </div>

        <div className="mt-8 flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-brand-ink/50 uppercase">Payments</h3>
          <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs font-medium text-brand-blue">
            {pendingPayments.length}
          </span>
        </div>
        <div className="mt-3 space-y-4">
          {paymentsByOffering.map((group) => (
            <div key={group.offeringId} className="rounded-2xl border border-brand-gold/40 bg-brand-amber/5 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-brand-ink">
                  {group.offering?.courses?.code || group.offering?.courses?.name || 'Unknown course'}
                </p>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-brand-ink/50 dark:bg-white/10">
                  {group.offering?.start_date}
                </span>
              </div>
              <p className="mt-1 text-sm text-brand-ink/60">
                Instructor/s:{' '}
                <span className="font-medium text-brand-ink">{offeringInstructorLabel(group.offering) || 'Not assigned'}</span>
              </p>

              <ul className="mt-3 space-y-2">
                {group.items.map((e) => (
                  <li key={e.id} className="rounded-xl border border-brand-blue/15 bg-white/70 p-3 text-sm shadow-sm dark:bg-white/10">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link href={`/admin/students/${e.student_id}`} className="font-medium text-brand-ink hover:underline">
                        {studentName(e.profiles)}
                      </Link>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          e.enrollment_type === 'review' ? 'bg-brand-flame/10 text-brand-flame' : 'bg-brand-blue/10 text-brand-blue'
                        }`}
                      >
                        {e.enrollment_type === 'review'
                          ? `Tithe${e.tithe_amount != null ? `: ₱${e.tithe_amount}` : ''}`
                          : `₱${group.offering?.price ?? 0}`}
                      </span>
                    </div>
                    <PaymentVerifyForm
                      enrollmentId={e.id}
                      initialAmountPaid={e.amount_paid}
                      initialVerified={false}
                      initialInvoiceNumber={e.invoice_number}
                      initialPaymentDate={e.payment_date}
                    />
                  </li>
                ))}
              </ul>

              <Link
                href={`/admin/courses/${group.offeringId}`}
                className="mt-3 inline-block rounded-full border border-brand-blue/30 px-3 py-1 text-xs font-medium text-brand-blue transition-colors hover:bg-brand-blue/10"
              >
                View full roster →
              </Link>
            </div>
          ))}
          {!pendingPayments.length && <p className="text-sm text-brand-ink/50">Nothing pending. 🎉</p>}
        </div>
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

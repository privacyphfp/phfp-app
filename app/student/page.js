import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { computeEligibility } from '@/lib/eligibility';
import { isProfileComplete } from '@/lib/profileCompleteness';
import { signReceiptUrls } from '@/lib/receiptUrl';
import { signAvatarUrl } from '@/lib/avatarUrl';
import { ADMIN_ROLES, ROLE_LABELS } from '@/lib/roles';
import EnrollButton from '@/components/EnrollButton';
import CourseBingoBoard from '@/components/CourseBingoBoard';

const STAFF_POSITION_LABELS = { instructor: 'Instructor', center_manager: 'Center Manager' };

export default async function StudentPage() {
  // Every role is also a student here — admin/marketing/accounting/manager
  // are staff permissions layered on top of a real person who takes
  // courses too, not a separate account type. This is their genuine
  // dashboard, not a preview.
  const { supabase, user, profile } = await requireProfile(['student', 'volunteer', ...ADMIN_ROLES]);
  const profileComplete = isProfileComplete(profile);
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: courses }, { data: prereqs }, { data: offerings }, { data: myEnrollments }, { data: myCertificates }] =
    await Promise.all([
      supabase.from('courses').select('id, code, name, series').order('code'),
      supabase.from('course_prerequisites').select('course_id, prerequisite_course_id'),
      supabase
        .from('course_offerings')
        .select('id, start_date, end_date, location, is_online, price, capacity, course_id, courses(name)')
        .order('start_date'),
      supabase
        .from('enrollments')
        .select(
          'id, status, enrollment_type, amount_paid, payment_verified, receipt_url, course_offering_id, course_offerings(id, start_date, course_id, courses(name))'
        )
        .eq('student_id', user.id),
      supabase.from('certificates').select('course_id, verified').eq('student_id', user.id),
    ]);

  const completedCourseIds = new Set([
    ...(myEnrollments ?? []).filter((e) => e.status === 'completed').map((e) => e.course_offerings?.course_id),
    ...(myCertificates ?? []).filter((c) => c.verified).map((c) => c.course_id),
  ]);

  const eligibility = computeEligibility({
    courses: courses ?? [],
    prereqs: prereqs ?? [],
    completedCourseIds,
  });

  const enrolledOfferingIds = new Set((myEnrollments ?? []).map((e) => e.course_offering_id));

  const avatarSignedUrl = await signAvatarUrl(supabase, profile?.avatar_url);

  const upcomingEnrollments = await signReceiptUrls(
    supabase,
    (myEnrollments ?? [])
      .filter((e) => e.status !== 'cancelled' && (e.course_offerings?.start_date ?? '') >= today)
      .sort((a, b) => (a.course_offerings?.start_date ?? '').localeCompare(b.course_offerings?.start_date ?? ''))
  );

  return (
    <div className="mx-auto w-full max-w-3xl p-8">
      {!profileComplete && (
        <div className="mb-6 flex items-center justify-between rounded-full border border-brand-flame/30 bg-brand-amber/15 px-4 py-2 text-sm text-brand-flame">
          <span>Complete your profile to be able to enroll in courses.</span>
          <Link href="/student/profile" className="font-medium underline underline-offset-2">
            Complete profile →
          </Link>
        </div>
      )}
      <div className="flex items-center gap-4">
        {avatarSignedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarSignedUrl}
            alt="Profile photo"
            className="h-14 w-14 rounded-full border border-brand-blue/20 object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-brand-blue/30 bg-brand-blue/5 text-[10px] text-brand-ink/40">
            No photo
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-brand-blue-dark">My Dashboard</h1>
          <p className="mt-1 text-brand-ink/60">Welcome, {profile?.full_name || 'Student'}.</p>
        </div>
      </div>

      <Link
        href="/student/profile"
        className="mt-4 flex items-baseline justify-between rounded-xl border border-brand-blue/15 bg-white/60 p-3 shadow-sm transition-colors hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <span className="font-medium text-brand-ink">My Profile</span>
        <span className="text-brand-blue">Edit →</span>
      </Link>

      {ADMIN_ROLES.includes(profile?.role) && (
        <section className="mt-6 rounded-xl border border-brand-gold/40 bg-brand-amber/5 p-4">
          <h2 className="text-sm font-semibold tracking-wide text-brand-ink/50 uppercase">Employee Information</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium tracking-wide text-brand-ink/40 uppercase">Role</div>
              <div className="text-brand-ink">{ROLE_LABELS[profile.role] ?? profile.role}</div>
            </div>
            {profile.staff_position && (
              <div>
                <div className="text-xs font-medium tracking-wide text-brand-ink/40 uppercase">Position</div>
                <div className="text-brand-ink">{STAFF_POSITION_LABELS[profile.staff_position] ?? profile.staff_position}</div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-brand-ink/90">Upcoming Enrolled Courses</h2>
        <ul className="mt-4 space-y-2">
          {upcomingEnrollments.map((e) => (
            <li
              key={e.id}
              className="rounded-xl border border-brand-blue/15 bg-white/60 p-3 shadow-sm dark:bg-white/5"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-brand-ink">{e.course_offerings?.courses?.name}</span>
                <span className="text-brand-ink/50">
                  {e.course_offerings?.start_date} — {e.status}
                </span>
              </div>
              {(e.amount_paid != null || e.receiptSignedUrl) && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-brand-ink/60">
                  {e.amount_paid != null && (
                    <span>
                      Paid ₱{e.amount_paid} — {e.payment_verified ? 'Verified' : 'Pending verification'}
                    </span>
                  )}
                  {e.receiptSignedUrl && (
                    <a
                      href={e.receiptSignedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue underline underline-offset-2"
                    >
                      View receipt
                    </a>
                  )}
                </div>
              )}
            </li>
          ))}
          {!upcomingEnrollments.length && <p className="text-brand-ink/50">No upcoming enrolled courses.</p>}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-brand-ink/90">My Course Progress</h2>
        <p className="mt-1 text-sm text-brand-ink/60">
          Every course you&apos;ve completed — through the app or a verified certificate — gets checked off. Click a
          course to see when you first took it, any reviews, and upload or view your certificate.
        </p>
        <div className="mt-4 rounded-2xl border border-brand-gold/40 bg-white/70 p-4 shadow-sm dark:bg-white/5">
          <CourseBingoBoard courses={courses ?? []} completedCourseIds={completedCourseIds} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-brand-ink/90">Available Offerings</h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(offerings ?? []).map((o) => {
            const elig = eligibility[o.course_id] ?? { eligible: true, missing: [] };
            const alreadyEnrolled = enrolledOfferingIds.has(o.id);
            return (
              <li
                key={o.id}
                className="rounded-xl border border-brand-gold/40 bg-brand-amber/5 p-4 shadow-sm"
              >
                <div className="flex items-baseline justify-between">
                  <Link href={`/courses/${o.course_id}`} className="font-medium text-brand-ink hover:underline">
                    {o.courses?.name}
                  </Link>
                  <span className="text-sm text-brand-ink/50">{o.start_date}</span>
                </div>
                <div className="mt-1 text-sm text-brand-ink/60">
                  {o.is_online ? 'Online' : o.location || 'TBD'} · {o.price ? `₱${o.price}` : 'Free'}
                </div>
                {!elig.eligible && (
                  <p className="mt-2 text-sm text-brand-flame">Requires: {elig.missing.join(', ')}</p>
                )}
                {!alreadyEnrolled && elig.eligible && !profileComplete && (
                  <p className="mt-2 text-sm text-brand-flame">
                    Please{' '}
                    <Link href="/student/profile" className="underline underline-offset-2">
                      complete your profile
                    </Link>{' '}
                    before enrolling.
                  </p>
                )}
                <div className="mt-3">
                  <EnrollButton
                    offeringId={o.id}
                    studentId={user.id}
                    disabled={alreadyEnrolled || !elig.eligible || !profileComplete}
                    label={alreadyEnrolled ? 'Enrolled' : 'Enroll'}
                  />
                </div>
              </li>
            );
          })}
          {!(offerings ?? []).length && <p className="text-brand-ink/50">No offerings scheduled yet.</p>}
        </ul>
      </section>
    </div>
  );
}

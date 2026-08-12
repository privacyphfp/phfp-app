import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { computeEligibility } from '@/lib/eligibility';
import EnrollButton from './EnrollButton';

export default async function StudentPage() {
  const { supabase, user, profile } = await requireProfile(['student', 'volunteer', 'admin']);
  const isPreview = profile?.role !== 'student' && profile?.role !== 'volunteer';

  const [{ data: courses }, { data: prereqs }, { data: offerings }, { data: myEnrollments }] = await Promise.all([
    supabase.from('courses').select('id, name'),
    supabase.from('course_prerequisites').select('course_id, prerequisite_course_id'),
    supabase
      .from('course_offerings')
      .select('id, start_date, end_date, location, is_online, price, capacity, course_id, courses(name)')
      .order('start_date'),
    supabase
      .from('enrollments')
      .select('id, status, course_offering_id, course_offerings(id, start_date, course_id, courses(name))')
      .eq('student_id', user.id),
  ]);

  const completedCourseIds = new Set(
    (myEnrollments ?? [])
      .filter((e) => e.status === 'completed')
      .map((e) => e.course_offerings?.course_id)
  );

  const eligibility = computeEligibility({
    courses: courses ?? [],
    prereqs: prereqs ?? [],
    completedCourseIds,
  });

  const enrolledOfferingIds = new Set((myEnrollments ?? []).map((e) => e.course_offering_id));

  return (
    <div className="mx-auto w-full max-w-3xl p-8">
      {isPreview && (
        <div className="mb-6 flex items-center justify-between rounded-full border border-brand-flame/30 bg-brand-amber/15 px-4 py-2 text-sm text-brand-flame">
          <span>Previewing the Student portal as {profile?.role}</span>
          <Link href="/admin" className="font-medium underline underline-offset-2">
            ← Back to Admin
          </Link>
        </div>
      )}
      <h1 className="text-2xl font-semibold text-brand-blue-dark">
        Welcome, {profile?.full_name || 'Student'}
      </h1>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-brand-ink/90">My Enrollments</h2>
        <ul className="mt-4 space-y-2">
          {(myEnrollments ?? []).map((e) => (
            <li
              key={e.id}
              className="rounded-xl border border-brand-blue/15 bg-white/60 p-3 shadow-sm dark:bg-white/5"
            >
              <span className="font-medium text-brand-ink">{e.course_offerings?.courses?.name}</span>{' '}
              <span className="text-brand-ink/50">— {e.status}</span>
            </li>
          ))}
          {!(myEnrollments ?? []).length && <p className="text-brand-ink/50">No enrollments yet.</p>}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-brand-ink/90">Upcoming Offerings</h2>
        <ul className="mt-4 space-y-3">
          {(offerings ?? []).map((o) => {
            const elig = eligibility[o.course_id] ?? { eligible: true, missing: [] };
            const alreadyEnrolled = enrolledOfferingIds.has(o.id);
            return (
              <li
                key={o.id}
                className="rounded-xl border border-brand-gold/40 bg-brand-amber/5 p-4 shadow-sm"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-medium text-brand-ink">{o.courses?.name}</span>
                  <span className="text-sm text-brand-ink/50">{o.start_date}</span>
                </div>
                <div className="mt-1 text-sm text-brand-ink/60">
                  {o.is_online ? 'Online' : o.location || 'TBD'} · {o.price ? `₱${o.price}` : 'Free'}
                </div>
                {!elig.eligible && (
                  <p className="mt-2 text-sm text-brand-flame">Requires: {elig.missing.join(', ')}</p>
                )}
                <div className="mt-3">
                  <EnrollButton
                    offeringId={o.id}
                    studentId={user.id}
                    disabled={alreadyEnrolled || !elig.eligible}
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

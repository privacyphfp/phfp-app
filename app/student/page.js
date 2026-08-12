import { requireProfile } from '@/lib/auth';
import { computeEligibility } from '@/lib/eligibility';
import EnrollButton from './EnrollButton';

export default async function StudentPage() {
  const { supabase, user, profile } = await requireProfile(['student', 'volunteer']);

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
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Welcome, {profile?.full_name || 'Student'}</h1>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">My Enrollments</h2>
        <ul className="mt-4 space-y-2">
          {(myEnrollments ?? []).map((e) => (
            <li key={e.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
              {e.course_offerings?.courses?.name} — {e.status}
            </li>
          ))}
          {!(myEnrollments ?? []).length && <p className="text-zinc-500">No enrollments yet.</p>}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Upcoming Offerings</h2>
        <ul className="mt-4 space-y-3">
          {(offerings ?? []).map((o) => {
            const elig = eligibility[o.course_id] ?? { eligible: true, missing: [] };
            const alreadyEnrolled = enrolledOfferingIds.has(o.id);
            return (
              <li key={o.id} className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{o.courses?.name}</span>
                  <span className="text-sm text-zinc-500">{o.start_date}</span>
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {o.is_online ? 'Online' : o.location || 'TBD'} · {o.price ? `₱${o.price}` : 'Free'}
                </div>
                {!elig.eligible && (
                  <p className="mt-2 text-sm text-amber-600">Requires: {elig.missing.join(', ')}</p>
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
          {!(offerings ?? []).length && <p className="text-zinc-500">No offerings scheduled yet.</p>}
        </ul>
      </section>
    </div>
  );
}

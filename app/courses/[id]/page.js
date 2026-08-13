import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SERIES_LABELS } from '@/lib/courseSeries';
import { isProfileComplete } from '@/lib/profileCompleteness';
import EnrollButton from '@/components/EnrollButton';

export default async function CourseDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase.from('courses').select('*').eq('id', id).single();

  if (!course) {
    return (
      <div className="mx-auto w-full max-w-2xl p-8">
        <p className="text-brand-ink/60">Course not found.</p>
        <Link href="/courses" className="mt-2 inline-block text-brand-blue hover:underline">
          ← Back to Course Catalog
        </Link>
      </div>
    );
  }

  const [{ data: prereqRows }, { data: offerings }, { data: allCourses }] = await Promise.all([
    supabase.from('course_prerequisites').select('prerequisite_course_id').eq('course_id', id),
    supabase
      .from('course_offerings')
      .select('id, start_date, end_date, location, is_online, price, capacity')
      .eq('course_id', id)
      .order('start_date'),
    supabase.from('courses').select('id, name'),
  ]);

  const courseNameById = Object.fromEntries((allCourses ?? []).map((c) => [c.id, c.name]));
  const requiredCourseIds = (prereqRows ?? []).map((p) => p.prerequisite_course_id);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let completedCourseIds = new Set();
  let enrolledOfferingIds = new Set();
  let profileComplete = false;

  if (user) {
    const [{ data: myEnrollments }, { data: myProfile }] = await Promise.all([
      supabase
        .from('enrollments')
        .select('status, course_offering_id, course_offerings(course_id)')
        .eq('student_id', user.id),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ]);

    completedCourseIds = new Set(
      (myEnrollments ?? [])
        .filter((e) => e.status === 'completed')
        .map((e) => e.course_offerings?.course_id)
    );
    enrolledOfferingIds = new Set((myEnrollments ?? []).map((e) => e.course_offering_id));
    profileComplete = isProfileComplete(myProfile);
  }

  const missingPrereqs = requiredCourseIds
    .filter((cid) => !completedCourseIds.has(cid))
    .map((cid) => courseNameById[cid]);
  const eligible = missingPrereqs.length === 0;

  return (
    <div className="mx-auto w-full max-w-2xl p-8">
      <Link href="/courses" className="text-sm text-brand-blue hover:underline">
        ← Back to Course Catalog
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <h1 className="text-3xl font-semibold text-brand-blue-dark">{course.name}</h1>
        <span className="rounded-full bg-brand-amber/20 px-3 py-1 text-xs font-medium text-brand-flame">
          {SERIES_LABELS[course.series]}
        </span>
      </div>
      <p className="mt-1 text-brand-ink/60">
        {course.duration_days} day{course.duration_days > 1 ? 's' : ''}
      </p>

      {course.description && <p className="mt-4 text-brand-ink/80">{course.description}</p>}

      {requiredCourseIds.length > 0 && (
        <div className="mt-4 rounded-xl border border-brand-gold/40 bg-brand-amber/5 p-4">
          <p className="text-sm font-medium text-brand-ink/80">Prerequisites</p>
          <ul className="mt-1 text-sm text-brand-ink/70">
            {requiredCourseIds.map((cid) => (
              <li key={cid}>
                {completedCourseIds.has(cid) ? '✓' : '○'} {courseNameById[cid]}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="mt-8 text-xl font-semibold text-brand-ink/90">Upcoming Offerings</h2>
      <ul className="mt-4 space-y-3">
        {(offerings ?? []).map((o) => {
          const alreadyEnrolled = enrolledOfferingIds.has(o.id);
          return (
            <li key={o.id} className="rounded-xl border border-brand-blue/15 bg-white/60 p-4 shadow-sm dark:bg-white/5">
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-brand-ink">{o.start_date}</span>
                <span className="text-sm text-brand-ink/50">{o.price ? `₱${o.price}` : 'Free'}</span>
              </div>
              <div className="mt-1 text-sm text-brand-ink/60">{o.is_online ? 'Online' : o.location || 'TBD'}</div>
              {!eligible && <p className="mt-2 text-sm text-brand-flame">Requires: {missingPrereqs.join(', ')}</p>}
              {user && !alreadyEnrolled && eligible && !profileComplete && (
                <p className="mt-2 text-sm text-brand-flame">
                  Please{' '}
                  <Link href="/student/profile" className="underline underline-offset-2">
                    complete your profile
                  </Link>{' '}
                  before enrolling.
                </p>
              )}
              <div className="mt-3">
                {user ? (
                  <EnrollButton
                    offeringId={o.id}
                    studentId={user.id}
                    disabled={alreadyEnrolled || !eligible || !profileComplete}
                    label={alreadyEnrolled ? 'Enrolled' : 'Enroll'}
                  />
                ) : (
                  <Link
                    href="/login"
                    className="inline-block rounded-full border border-brand-blue/30 px-4 py-2 text-sm font-medium text-brand-blue hover:bg-brand-blue/10"
                  >
                    Log in to enroll
                  </Link>
                )}
              </div>
            </li>
          );
        })}
        {!(offerings ?? []).length && <p className="text-brand-ink/50">No offerings scheduled yet.</p>}
      </ul>
    </div>
  );
}

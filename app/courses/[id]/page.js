import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SERIES_LABELS } from '@/lib/courseSeries';
import { isProfileComplete } from '@/lib/profileCompleteness';
import { formatInstructorName } from '@/lib/formatInstructor';
import { signCertificateUrls } from '@/lib/certificateUrl';
import EnrollButton from '@/components/EnrollButton';
import CertificateUploadForm from '@/components/CertificateUploadForm';
import CertificateEditForm from '@/components/CertificateEditForm';

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
      .select('id, start_date, end_date, location, is_online, price, capacity, instructor_id, instructor_name')
      .eq('course_id', id)
      .order('start_date'),
    supabase.from('courses').select('id, name'),
  ]);

  const courseNameById = Object.fromEntries((allCourses ?? []).map((c) => [c.id, c.name]));
  const requiredCourseIds = (prereqRows ?? []).map((p) => p.prerequisite_course_id);

  const instructorIds = [...new Set((offerings ?? []).map((o) => o.instructor_id).filter(Boolean))];
  const { data: instructorProfiles } = instructorIds.length
    ? await supabase.from('profiles').select('id, full_name, first_name, last_name').in('id', instructorIds)
    : { data: [] };
  const instructorById = Object.fromEntries((instructorProfiles ?? []).map((p) => [p.id, p]));

  function instructorLabel(o) {
    if (o.instructor_id) {
      const p = instructorById[o.instructor_id];
      return p ? formatInstructorName(p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ')) : null;
    }
    return formatInstructorName(o.instructor_name) || null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let completedCourseIds = new Set();
  let enrolledOfferingIds = new Set();
  let profileComplete = false;
  let newEnrollments = [];
  let reviewEnrollments = [];
  let myCertificate = null;

  if (user) {
    const [{ data: myEnrollments }, { data: myProfile }, { data: myCertificates }] = await Promise.all([
      supabase
        .from('enrollments')
        .select('status, enrollment_type, course_offering_id, course_offerings(course_id, start_date)')
        .eq('student_id', user.id),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('certificates').select('id, course_id, file_url, issued_date, verified').eq('student_id', user.id),
    ]);

    completedCourseIds = new Set([
      ...(myEnrollments ?? [])
        .filter((e) => e.status === 'completed')
        .map((e) => e.course_offerings?.course_id),
      ...(myCertificates ?? []).filter((c) => c.verified).map((c) => c.course_id),
    ]);
    enrolledOfferingIds = new Set((myEnrollments ?? []).map((e) => e.course_offering_id));
    profileComplete = isProfileComplete(myProfile);

    const myCourseEnrollments = (myEnrollments ?? [])
      .filter((e) => e.course_offerings?.course_id === id)
      .sort((a, b) => (a.course_offerings?.start_date ?? '').localeCompare(b.course_offerings?.start_date ?? ''));
    newEnrollments = myCourseEnrollments.filter((e) => e.enrollment_type !== 'review');
    reviewEnrollments = myCourseEnrollments.filter((e) => e.enrollment_type === 'review');

    const rawCertificate = (myCertificates ?? []).find((c) => c.course_id === id) ?? null;
    if (rawCertificate) {
      const [signed] = await signCertificateUrls(supabase, [rawCertificate]);
      myCertificate = signed;
    }
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

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold text-brand-blue-dark">{course.name}</h1>
        <span className="rounded-full bg-brand-amber/20 px-3 py-1 text-xs font-medium whitespace-nowrap text-brand-flame">
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

      {user && (
        <div className="mt-6 rounded-xl border border-brand-blue/15 bg-white/60 p-4 dark:bg-white/5">
          <p className="text-sm font-medium text-brand-ink/80">My History with This Course</p>

          <p className="mt-2 text-sm text-brand-ink/70">
            {newEnrollments.length ? (
              <>
                First taken: {newEnrollments[0].course_offerings?.start_date} — {newEnrollments[0].status}
              </>
            ) : myCertificate?.verified ? (
              <>Completed via verified certificate{myCertificate.issued_date ? ` (${myCertificate.issued_date})` : ''}</>
            ) : (
              'You haven’t taken this course yet.'
            )}
          </p>

          {reviewEnrollments.length > 0 && (
            <div className="mt-2 text-sm text-brand-ink/70">
              Reviewed {reviewEnrollments.length} time{reviewEnrollments.length > 1 ? 's' : ''}:
              <ul className="mt-1 list-inside list-disc">
                {reviewEnrollments.map((e, i) => (
                  <li key={i}>
                    {e.course_offerings?.start_date} — {e.status}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 border-t border-brand-blue/10 pt-3">
            <p className="text-sm font-medium text-brand-ink/80">Certificate</p>
            {myCertificate ? (
              <div className="mt-1 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  {myCertificate.issued_date && <span className="text-brand-ink/60">Date: {myCertificate.issued_date}</span>}
                  {myCertificate.signedUrl && (
                    <a
                      href={myCertificate.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue underline underline-offset-2"
                    >
                      View file
                    </a>
                  )}
                  <span className={myCertificate.verified ? 'text-brand-blue' : 'text-brand-flame'}>
                    {myCertificate.verified ? 'Verified' : 'Pending review'}
                  </span>
                </div>
                <CertificateEditForm certificateId={myCertificate.id} initialIssuedDate={myCertificate.issued_date} />
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-brand-ink/60">
                  Already took this course before enrolling here? Upload proof and PHFP staff will verify it.
                </p>
                <div className="mt-2">
                  <CertificateUploadForm studentId={user.id} courseId={id} />
                </div>
              </div>
            )}
          </div>

          <Link href="/student" className="mt-3 inline-block text-sm text-brand-blue hover:underline">
            ← Back to completing courses
          </Link>
        </div>
      )}

      <h2 className="mt-8 text-xl font-semibold text-brand-ink/90">Upcoming Offerings</h2>
      <ul className="mt-4 space-y-3">
        {(offerings ?? []).map((o) => {
          const alreadyEnrolled = enrolledOfferingIds.has(o.id);
          return (
            <li key={o.id} className="rounded-xl border border-brand-blue/15 bg-white/60 p-4 shadow-sm dark:bg-white/5">
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-brand-ink">
                  {o.start_date}
                  {o.end_date && o.end_date !== o.start_date ? ` – ${o.end_date}` : ''}
                </span>
                <span className="text-sm text-brand-ink/50">{o.price ? `₱${o.price}` : 'Free'}</span>
              </div>
              <div className="mt-1 text-sm text-brand-ink/60">{o.is_online ? 'Online' : o.location || 'TBD'}</div>
              {instructorLabel(o) && (
                <div className="mt-1 text-sm text-brand-ink/60">Instructor/s: {instructorLabel(o)}</div>
              )}
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

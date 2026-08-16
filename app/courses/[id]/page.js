import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SERIES_LABELS, SERIES_HEX } from '@/lib/courseSeries';
import { isProfileComplete } from '@/lib/profileCompleteness';
import { formatInstructorName } from '@/lib/formatInstructor';
import { signCertificateUrls } from '@/lib/certificateUrl';
import EnrollButton from '@/components/EnrollButton';
import CertificateUploadForm from '@/components/CertificateUploadForm';

function formatDateLong(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase.from('courses').select('name, tagline, description').eq('id', id).single();

  if (!course) {
    return { title: 'Course Not Found | PHFP App' };
  }

  const title = `${course.name} | PHFP — Pranic Healing Foundation of the Philippines`;
  const description =
    course.tagline || course.description || `Learn ${course.name} with the Pranic Healing Foundation of the Philippines.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

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
    <div className="mx-auto w-full max-w-4xl p-8">
      <Link href="/courses" className="text-sm text-brand-blue hover:underline">
        ← Back to Course Catalog
      </Link>

      <div
        className="mt-3 grid grid-cols-1 gap-6 [grid-template-areas:'main-top''history''offerings'] lg:grid-cols-[280px_1fr] lg:items-start lg:gap-8 lg:[grid-template-areas:'history_main-top''history_offerings']"
      >
        {user && (
          <aside className="[grid-area:history] rounded-xl border border-brand-blue/15 bg-white/60 p-4 lg:sticky lg:top-6 dark:bg-white/5">
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
                  {myCertificate.issued_date && (
                    <p className="text-brand-ink/60">Date Graduated: {formatDateLong(myCertificate.issued_date)}</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-3">
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
          </aside>
        )}

        <div className="min-w-0 [grid-area:main-top]">
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-10 text-center text-white shadow-lg sm:px-10 sm:py-16"
        style={{ background: `linear-gradient(135deg, ${SERIES_HEX[course.series]}, ${SERIES_HEX[course.series]}99)` }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(55% 45% at 20% 15%, rgba(255,255,255,0.25) 0%, transparent 70%), radial-gradient(45% 40% at 85% 90%, rgba(255,255,255,0.18) 0%, transparent 70%)',
          }}
        />
        <div className="relative">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium tracking-wide whitespace-nowrap text-white uppercase backdrop-blur-sm">
            {SERIES_LABELS[course.series]}
          </span>
          <h1 className="mt-4 text-3xl font-semibold drop-shadow-sm sm:text-4xl">{course.name}</h1>
          {course.tagline && <p className="mt-2 text-lg text-white/90 italic">{course.tagline}</p>}
          <p className="mt-3 text-sm font-medium tracking-wide text-white/80 uppercase">
            {course.duration_days} day{course.duration_days > 1 ? 's' : ''} · In-Person &amp; Online
          </p>
          <a
            href="#offerings"
            className="mt-6 inline-block rounded-full bg-white px-7 py-2.5 text-sm font-semibold text-brand-blue-dark shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg"
          >
            Register Here →
          </a>
        </div>
      </div>

      {course.description && (
        <p className="mt-6 text-center text-base leading-relaxed text-brand-ink/80 sm:text-lg">{course.description}</p>
      )}

      {course.highlights?.length > 0 && (
        <div className="mt-6 rounded-2xl border border-brand-gold/40 bg-brand-amber/5 p-6 shadow-sm">
          <p className="text-center text-lg font-semibold text-brand-blue-dark">In This Workshop You Will:</p>
          <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm text-brand-ink/80 sm:grid-cols-2">
            {course.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-blue text-[10px] font-bold text-white">
                  ✓
                </span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {course.testimonial_quote && (
        <blockquote className="relative mt-6 rounded-2xl border border-brand-blue/15 bg-brand-blue/5 p-6 text-sm text-brand-ink/80 shadow-sm">
          <span className="absolute top-3 left-4 font-serif text-5xl leading-none text-brand-blue/20" aria-hidden>
            “
          </span>
          <p className="relative pl-2 text-base italic sm:text-lg">{course.testimonial_quote}</p>
          {course.testimonial_author && (
            <footer className="relative mt-3 pl-2 text-xs font-medium text-brand-ink/50 not-italic">
              — {course.testimonial_author}
            </footer>
          )}
        </blockquote>
      )}

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
        </div>

        <div className="min-w-0 [grid-area:offerings]">
      <h2 id="offerings" className="mt-8 scroll-mt-6 text-xl font-semibold text-brand-ink/90 lg:mt-0">
        Upcoming Offerings
      </h2>
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
      </div>
    </div>
  );
}

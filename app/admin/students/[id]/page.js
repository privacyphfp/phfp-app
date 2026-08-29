import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { signCertificateUrls } from '@/lib/certificateUrl';
import RoleAssignmentForm from '@/components/RoleAssignmentForm';
import TitheAmountForm from '@/components/TitheAmountForm';
import CertificateVerifyButton from '@/components/CertificateVerifyButton';
import ConfirmLegacyRecordForm from '@/components/ConfirmLegacyRecordForm';
import CertificateNumberForm from '@/components/CertificateNumberForm';
import CourseBingoBoard from '@/components/CourseBingoBoard';

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-brand-ink/40">{label}</div>
      <div className="text-brand-ink">{value || <span className="text-brand-ink/30">—</span>}</div>
    </div>
  );
}

export default async function AdminStudentDetailPage({ params }) {
  const { id } = await params;
  const { supabase } = await requireProfile(['admin']);

  const [{ data: student }, { data: enrollments }, { data: regions }, { data: certificates }, { data: courses }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase
        .from('enrollments')
        .select(
          'id, status, enrolled_at, referred_by, enrollment_type, tithe_amount, course_offerings(start_date, course_id, courses(name))'
        )
        .eq('student_id', id)
        .order('enrolled_at', { ascending: false }),
      supabase.from('regions').select('id, name').order('name'),
      supabase
        .from('certificates')
        .select('id, course_id, file_url, issued_date, verified, declined, certificate_number, courses(code, name)')
        .eq('student_id', id)
        .order('created_at', { ascending: false }),
      supabase.from('courses').select('id, code, name, series').order('code'),
    ]);

  const certificatesWithUrls = await signCertificateUrls(supabase, certificates ?? []);

  const completedCourseIds = new Set([
    ...(enrollments ?? []).filter((e) => e.status === 'completed').map((e) => e.course_offerings?.course_id),
    ...(certificates ?? []).filter((c) => c.verified).map((c) => c.course_id),
  ]);

  if (!student) {
    return (
      <div className="mx-auto w-full max-w-2xl p-8">
        <p className="text-brand-ink/60">Student not found.</p>
        <Link href="/admin/students" className="mt-2 inline-block text-brand-blue hover:underline">
          ← Back to Manage Students
        </Link>
      </div>
    );
  }

  let regionName = null;
  if (student.region_id) {
    const { data: r } = await supabase.from('regions').select('name').eq('id', student.region_id).single();
    regionName = r?.name ?? null;
  }

  const courseByCode = Object.fromEntries((courses ?? []).map((c) => [c.code, c]));

  // Suggested matches from imported historical "who took what" records —
  // matched by name only, so staff confirms each one rather than it
  // auto-verifying (see components/ConfirmLegacyRecordForm.js).
  const studentName = (student.full_name || [student.first_name, student.last_name].filter(Boolean).join(' ') || '').trim();
  const { data: legacyMatches } = studentName
    ? await supabase.from('legacy_course_records').select('*').eq('resolved', false).ilike('student_name', studentName)
    : { data: [] };

  return (
    <div className="mx-auto w-full max-w-3xl p-8">
      <Link href="/admin/students" className="text-sm text-brand-blue hover:underline">
        ← Back to Manage Students
      </Link>

      <h1 className="mt-3 text-2xl font-semibold text-brand-blue-dark">
        {student.full_name || [student.first_name, student.last_name].filter(Boolean).join(' ') || 'Unnamed student'}
      </h1>
      <p className="text-sm text-brand-ink/60">{student.email}</p>

      <section className="mt-6 rounded-2xl border border-brand-gold/40 bg-white/70 p-6 shadow-sm dark:bg-white/5">
        <h2 className="text-lg font-semibold text-brand-blue-dark">Role &amp; Permissions</h2>
        <p className="mt-1 text-sm text-brand-ink/60">
          A staff position (Instructor / Center Manager) is layered on top of their role — it doesn&apos;t replace
          it, so they keep their normal student access.
        </p>
        <div className="mt-4">
          <RoleAssignmentForm
            studentId={student.id}
            initialRole={student.role}
            initialStaffPosition={student.staff_position}
            initialManagedRegionId={student.managed_region_id}
            regions={regions ?? []}
          />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-brand-gold/40 bg-white/70 p-6 shadow-sm dark:bg-white/5">
        <h2 className="text-lg font-semibold text-brand-blue-dark">Personal Information</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First Name" value={student.first_name} />
          <Field label="Last Name" value={student.last_name} />
          <Field label="Nickname" value={student.nickname} />
          <Field label="Date of Birth" value={student.birthdate} />
          <Field label="Address" value={student.address} />
          <Field label="City" value={student.city} />
          <Field label="State / Province / Region" value={student.state_region} />
          <Field label="Country" value={student.country} />
          <Field label="Phone" value={student.phone} />
          <Field label="FB Account or Link" value={student.fb_link} />
          <Field label="Religion" value={student.religion} />
          <Field label="Career / Profession" value={student.profession} />
          <Field label="Company / Organization" value={student.company} />
          <Field label="PHFP Region" value={regionName} />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-brand-gold/40 bg-white/70 p-6 shadow-sm dark:bg-white/5">
        <h2 className="text-lg font-semibold text-brand-blue-dark">Communication Preferences</h2>
        <p className="mt-2 text-sm text-brand-ink/70">
          {[
            student.updates_via_text && 'Text',
            student.updates_via_email && 'Email',
            student.updates_via_social && 'Social Media',
          ]
            .filter(Boolean)
            .join(', ') || 'None selected'}
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-brand-gold/40 bg-white/70 p-6 shadow-sm dark:bg-white/5">
        <h2 className="text-lg font-semibold text-brand-blue-dark">Signed Agreements</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-brand-ink/40">
              Confidentiality &amp; NDA
            </div>
            {student.nda_signature ? (
              <>
                <img src={student.nda_signature} alt="NDA signature" className="mt-1 h-20 rounded border border-brand-blue/20 bg-white" />
                <p className="mt-1 text-xs text-brand-ink/50">
                  Signed {student.nda_agreed_at ? new Date(student.nda_agreed_at).toLocaleDateString() : ''}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-brand-flame">Not signed</p>
            )}
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-brand-ink/40">
              Data Protection &amp; Privacy
            </div>
            {student.privacy_signature ? (
              <>
                <img
                  src={student.privacy_signature}
                  alt="Privacy signature"
                  className="mt-1 h-20 rounded border border-brand-blue/20 bg-white"
                />
                <p className="mt-1 text-xs text-brand-ink/50">
                  Signed {student.privacy_agreed_at ? new Date(student.privacy_agreed_at).toLocaleDateString() : ''}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-brand-flame">Not signed</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-brand-gold/40 bg-white/70 p-6 shadow-sm dark:bg-white/5">
        <h2 className="text-lg font-semibold text-brand-blue-dark">Course Progress</h2>
        <div className="mt-4">
          <CourseBingoBoard courses={courses ?? []} completedCourseIds={completedCourseIds} />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-brand-gold/40 bg-white/70 p-6 shadow-sm dark:bg-white/5">
        <h2 className="text-lg font-semibold text-brand-blue-dark">Enrollment History</h2>
        <ul className="mt-4 space-y-2">
          {(enrollments ?? []).map((e) => (
            <li key={e.id} className="rounded-xl border border-brand-blue/15 bg-brand-blue/5 p-3 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-brand-ink">{e.course_offerings?.courses?.name}</span>
                <span className="text-brand-ink/50">{e.course_offerings?.start_date}</span>
              </div>
              <div className="mt-1 text-brand-ink/60">
                {e.status}
                {' · '}
                <span className={e.enrollment_type === 'review' ? 'text-brand-flame' : ''}>
                  {e.enrollment_type === 'review' ? 'Review' : 'New'}
                </span>
                {e.referred_by && ` · Referred by ${e.referred_by}`}
              </div>
              {e.enrollment_type === 'review' && (
                <TitheAmountForm enrollmentId={e.id} initialAmount={e.tithe_amount} />
              )}
            </li>
          ))}
          {!(enrollments ?? []).length && <p className="text-brand-ink/50">No enrollments yet.</p>}
        </ul>
      </section>

      {(legacyMatches ?? []).length > 0 && (
        <section className="mt-6 rounded-2xl border border-brand-flame/40 bg-brand-amber/10 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-blue-dark">Possible Historical Records</h2>
          <p className="mt-1 text-sm text-brand-ink/60">
            Imported records whose name matches this student. Confirm only if you&apos;re sure it&apos;s the same
            person — a name match alone isn&apos;t proof.
          </p>
          <ul className="mt-4 space-y-2">
            {legacyMatches.map((r) => {
              const course = courseByCode[r.course_code];
              return (
                <li key={r.id} className="rounded-xl border border-brand-flame/20 bg-white/60 p-3 text-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium text-brand-ink">{course?.name || r.course_code}</span>
                    <span className="text-brand-ink/50">{r.completed_date}</span>
                  </div>
                  <div className="mt-1 text-brand-ink/60">
                    Recorded as &quot;{r.student_name}&quot;
                    {r.region && ` · ${r.region}`}
                  </div>
                  <ConfirmLegacyRecordForm record={r} studentId={student.id} courseId={course?.id} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-brand-gold/40 bg-white/70 p-6 shadow-sm dark:bg-white/5">
        <h2 className="text-lg font-semibold text-brand-blue-dark">Certificates</h2>
        <p className="mt-1 text-sm text-brand-ink/60">
          Proof of courses taken before this student enrolled through the app. Verifying one counts it as completed
          for prerequisite checks.
        </p>
        <ul className="mt-4 space-y-2">
          {certificatesWithUrls.map((c) => (
            <li key={c.id} className="rounded-xl border border-brand-blue/15 bg-brand-blue/5 p-3 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-brand-ink">{c.courses?.code || c.courses?.name}</span>
                <span className="text-brand-ink/50">{c.issued_date}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                {c.signedUrl && (
                  <a
                    href={c.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue underline underline-offset-2"
                  >
                    View file
                  </a>
                )}
                <CertificateVerifyButton certificateId={c.id} verified={c.verified} declined={c.declined} />
              </div>
              <CertificateNumberForm certificateId={c.id} initialValue={c.certificate_number} />
            </li>
          ))}
          {!certificatesWithUrls.length && <p className="text-brand-ink/50">No certificates submitted yet.</p>}
        </ul>
      </section>
    </div>
  );
}

import Link from 'next/link';
import { requireProfile } from '@/lib/auth';

export default async function AdminPage() {
  const { supabase } = await requireProfile(['admin']);

  const [{ count: studentCount }, { count: offeringCount }, { count: pendingCount }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('course_offerings').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'registered'),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl p-8">
      <h1 className="text-2xl font-semibold text-brand-blue-dark">Admin Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Students" value={studentCount ?? 0} />
        <Stat label="Course Offerings" value={offeringCount ?? 0} />
        <Stat label="Pending Enrollments" value={pendingCount ?? 0} />
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

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
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Stat label="Students" value={studentCount ?? 0} />
        <Stat label="Course Offerings" value={offeringCount ?? 0} />
        <Stat label="Pending Enrollments" value={pendingCount ?? 0} />
      </div>

      <div className="mt-8">
        <Link href="/admin/courses" className="underline">
          Manage Course Offerings →
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="text-3xl font-semibold">{value}</div>
      <div className="text-sm text-zinc-500">{label}</div>
    </div>
  );
}

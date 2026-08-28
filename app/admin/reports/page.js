import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import ReportsPanel from '@/components/ReportsPanel';

// Admin-only — not staff in general. requireProfile checks the role
// server-side before anything here renders.
export default async function AdminReportsPage() {
  const { supabase } = await requireProfile(['admin']);

  const [{ data: courses }, { data: students }] = await Promise.all([
    supabase.from('courses').select('id, code, name').order('code'),
    supabase.from('profiles').select('id, full_name, first_name, last_name, email, regions ( name )').order('full_name'),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl p-8">
      <Link href="/admin" className="text-sm text-brand-blue hover:underline">
        ← Back to Admin Dashboard
      </Link>

      <h1 className="mt-3 text-2xl font-semibold text-brand-blue-dark">Reports</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Build a custom export, or run a summary report. Admin only.
      </p>

      <div className="mt-6 rounded-2xl border border-brand-gold/40 bg-white/70 p-6 shadow-sm dark:bg-white/5">
        <ReportsPanel courses={courses ?? []} students={students ?? []} />
      </div>
    </div>
  );
}

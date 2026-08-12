import { requireProfile } from '@/lib/auth';
import CreateOfferingForm from './CreateOfferingForm';

export default async function AdminCoursesPage() {
  const { supabase } = await requireProfile(['admin']);

  const [{ data: courses }, { data: offerings }, { data: enrollments }] = await Promise.all([
    supabase.from('courses').select('id, code, name').order('name'),
    supabase
      .from('course_offerings')
      .select('id, start_date, end_date, location, is_online, capacity, price, status, course_id')
      .order('start_date', { ascending: false }),
    supabase.from('enrollments').select('course_offering_id'),
  ]);

  const courseById = Object.fromEntries((courses ?? []).map((c) => [c.id, c]));

  const enrollmentCounts = {};
  for (const e of enrollments ?? []) {
    enrollmentCounts[e.course_offering_id] = (enrollmentCounts[e.course_offering_id] ?? 0) + 1;
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-8">
      <h1 className="text-2xl font-semibold text-brand-blue-dark">Manage Course Offerings</h1>

      <div className="mt-6">
        <CreateOfferingForm courses={courses ?? []} />
      </div>

      <div className="mt-8 space-y-3">
        {(offerings ?? []).map((o) => (
          <div key={o.id} className="rounded-xl border border-brand-blue/15 bg-white/60 p-4 shadow-sm dark:bg-white/5">
            <div className="flex items-baseline justify-between">
              <span className="font-medium text-brand-ink">{courseById[o.course_id]?.name ?? 'Unknown course'}</span>
              <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-medium text-brand-blue">
                {enrollmentCounts[o.id] ?? 0}
                {o.capacity ? ` / ${o.capacity}` : ''} enrolled
              </span>
            </div>
            <div className="mt-1 text-sm text-brand-ink/60">
              {o.start_date}
              {o.end_date && o.end_date !== o.start_date ? ` – ${o.end_date}` : ''} ·{' '}
              {o.is_online ? 'Online' : o.location || 'TBD'} · {o.price ? `₱${o.price}` : 'Free'} · {o.status}
            </div>
          </div>
        ))}
        {!(offerings ?? []).length && <p className="text-brand-ink/50">No course offerings yet.</p>}
      </div>
    </div>
  );
}

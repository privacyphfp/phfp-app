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
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-semibold">Manage Course Offerings</h1>

      <div className="mt-6">
        <CreateOfferingForm courses={courses ?? []} />
      </div>

      <div className="mt-8 space-y-3">
        {(offerings ?? []).map((o) => (
          <div key={o.id} className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{courseById[o.course_id]?.name ?? 'Unknown course'}</span>
              <span className="text-sm text-zinc-500">
                {enrollmentCounts[o.id] ?? 0}
                {o.capacity ? ` / ${o.capacity}` : ''} enrolled
              </span>
            </div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {o.start_date}
              {o.end_date && o.end_date !== o.start_date ? ` – ${o.end_date}` : ''} ·{' '}
              {o.is_online ? 'Online' : o.location || 'TBD'} · {o.price ? `₱${o.price}` : 'Free'} · {o.status}
            </div>
          </div>
        ))}
        {!(offerings ?? []).length && <p className="text-zinc-500">No course offerings yet.</p>}
      </div>
    </div>
  );
}

import { requireProfile } from '@/lib/auth';
import CreateOfferingForm from './CreateOfferingForm';
import ExportEnrollmentsButton from '@/components/ExportEnrollmentsButton';

const EVENT_TYPE_LABELS = {
  one_time: 'One-time',
  special: 'Special event',
  weekly: 'Weekly event',
};

export default async function AdminCoursesPage() {
  const { supabase } = await requireProfile(['admin']);

  const [{ data: courses }, { data: offerings }, { data: enrollments }, { data: regions }, { data: events }, { data: instructors }] =
    await Promise.all([
      supabase.from('courses').select('id, code, name').order('name'),
      supabase
        .from('course_offerings')
        .select(
          'id, start_date, end_date, location, is_online, capacity, price, status, course_id, region_id, instructor_id, instructor_name'
        )
        .order('start_date', { ascending: false }),
      supabase.from('enrollments').select('course_offering_id'),
      supabase.from('regions').select('id, name').order('name'),
      supabase
        .from('events')
        .select('id, title, event_type, start_date, end_date, location, is_online, region_id')
        .order('start_date', { ascending: false }),
      supabase.from('profiles').select('id, full_name, first_name, last_name').eq('staff_position', 'instructor').order('full_name'),
    ]);

  const courseById = Object.fromEntries((courses ?? []).map((c) => [c.id, c]));
  const regionById = Object.fromEntries((regions ?? []).map((r) => [r.id, r]));
  const instructorById = Object.fromEntries((instructors ?? []).map((i) => [i.id, i]));

  function instructorLabel(o) {
    if (o.instructor_id) {
      const i = instructorById[o.instructor_id];
      return i ? i.full_name || [i.first_name, i.last_name].filter(Boolean).join(' ') : null;
    }
    return o.instructor_name || null;
  }

  const enrollmentCounts = {};
  for (const e of enrollments ?? []) {
    enrollmentCounts[e.course_offering_id] = (enrollmentCounts[e.course_offering_id] ?? 0) + 1;
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-8">
      <h1 className="text-2xl font-semibold text-brand-blue-dark">Manage Course Offerings &amp; Events</h1>

      <div className="mt-6">
        <CreateOfferingForm courses={courses ?? []} regions={regions ?? []} instructors={instructors ?? []} />
      </div>

      <h2 className="mt-10 text-lg font-semibold text-brand-ink/90">Course Offerings</h2>
      <div className="mt-4 space-y-3">
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
              {o.is_online ? 'Online' : o.location || 'TBD'} · {o.price ? `₱${o.price}` : 'Free'} · {o.status} ·{' '}
              {regionById[o.region_id]?.name ?? 'Nationwide'}
            </div>
            <div className="mt-1 text-sm text-brand-ink/60">Instructor: {instructorLabel(o) || 'Not assigned'}</div>
            {(enrollmentCounts[o.id] ?? 0) > 0 && (
              <div className="mt-3">
                <ExportEnrollmentsButton
                  offeringId={o.id}
                  fileName={`${courseById[o.course_id]?.code ?? 'course'}-${o.start_date}-roster`}
                />
              </div>
            )}
          </div>
        ))}
        {!(offerings ?? []).length && <p className="text-brand-ink/50">No course offerings yet.</p>}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-brand-ink/90">Events</h2>
      <div className="mt-4 space-y-3">
        {(events ?? []).map((ev) => (
          <div key={ev.id} className="rounded-xl border border-brand-gold/40 bg-brand-amber/5 p-4 shadow-sm">
            <div className="flex items-baseline justify-between">
              <span className="font-medium text-brand-ink">{ev.title}</span>
              <span className="rounded-full bg-brand-flame/10 px-2.5 py-0.5 text-xs font-medium text-brand-flame">
                {EVENT_TYPE_LABELS[ev.event_type] ?? ev.event_type}
              </span>
            </div>
            <div className="mt-1 text-sm text-brand-ink/60">
              {ev.start_date}
              {ev.end_date && ev.end_date !== ev.start_date ? ` – ${ev.end_date}` : ''} ·{' '}
              {ev.is_online ? 'Online' : ev.location || 'TBD'} · {regionById[ev.region_id]?.name ?? 'Nationwide'}
            </div>
          </div>
        ))}
        {!(events ?? []).length && <p className="text-brand-ink/50">No events yet.</p>}
      </div>
    </div>
  );
}

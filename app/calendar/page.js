import { createClient } from '@/lib/supabase/server';
import { SERIES_HEX } from '@/lib/courseSeries';
import { formatInstructorName } from '@/lib/formatInstructor';
import CalendarFilterView from '@/components/CalendarFilterView';

const EVENT_COLOR = '#c0600c';

function exclusiveEnd(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default async function CalendarPage() {
  const supabase = await createClient();

  const [{ data: offerings }, { data: events }, { data: regions }] = await Promise.all([
    supabase
      .from('course_offerings')
      .select('id, start_date, end_date, course_id, region_id, instructor_id, instructor_name, courses(code, name, series)')
      .order('start_date'),
    supabase.from('events').select('id, title, start_date, end_date, region_id').order('start_date'),
    supabase.from('regions').select('id, name, code').order('name'),
  ]);

  const regionById = Object.fromEntries((regions ?? []).map((r) => [r.id, r]));

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

  let enrolledOfferingIds = new Set();
  if (user) {
    const { data: myEnrollments } = await supabase
      .from('enrollments')
      .select('course_offering_id')
      .eq('student_id', user.id);
    enrolledOfferingIds = new Set((myEnrollments ?? []).map((e) => e.course_offering_id));
  }

  const offeringItems = (offerings ?? []).map((o) => {
    const regionCode = regionById[o.region_id]?.code;
    const label = o.courses?.code || o.courses?.name || 'Course';
    return {
      title: `${regionCode ? regionCode + ' - ' : ''}${label}${enrolledOfferingIds.has(o.id) ? ' ✓' : ''}`,
      start: o.start_date,
      end: exclusiveEnd(o.end_date || o.start_date),
      color: SERIES_HEX[o.courses?.series] ?? '#00549c',
      classNames: ['fc-event-clickable'],
      extendedProps: { href: `/courses/${o.course_id}`, regionId: o.region_id ?? null, instructor: instructorLabel(o) },
    };
  });

  const eventItems = (events ?? []).map((ev) => {
    const regionCode = regionById[ev.region_id]?.code;
    return {
      title: `📅 ${regionCode ? regionCode + ' · ' : ''}${ev.title}`,
      start: ev.start_date,
      end: exclusiveEnd(ev.end_date || ev.start_date),
      color: EVENT_COLOR,
      extendedProps: { href: null, regionId: ev.region_id ?? null },
    };
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-2 py-8 sm:p-8">
      <h1 className="text-2xl font-semibold text-brand-blue-dark">Calendar</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        All scheduled courses and events. {user && 'Your enrollments are marked with a ✓.'}
      </p>
      <div className="mt-6">
        <CalendarFilterView items={[...offeringItems, ...eventItems]} regions={regions ?? []} />
      </div>
    </div>
  );
}

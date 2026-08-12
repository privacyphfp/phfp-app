import { createClient } from '@/lib/supabase/server';
import { SERIES_HEX } from '@/lib/courseSeries';
import CalendarView from '@/components/CalendarView';

function exclusiveEnd(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default async function CalendarPage() {
  const supabase = await createClient();

  const { data: offerings } = await supabase
    .from('course_offerings')
    .select('id, start_date, end_date, course_id, courses(name, series)')
    .order('start_date');

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

  const events = (offerings ?? []).map((o) => ({
    title: `${o.courses?.name ?? 'Course'}${enrolledOfferingIds.has(o.id) ? ' ✓' : ''}`,
    start: o.start_date,
    end: exclusiveEnd(o.end_date || o.start_date),
    color: SERIES_HEX[o.courses?.series] ?? '#00549c',
    extendedProps: { href: `/courses/${o.course_id}` },
  }));

  return (
    <div className="mx-auto w-full max-w-4xl p-8">
      <h1 className="text-2xl font-semibold text-brand-blue-dark">Calendar</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        All scheduled courses and events. {user && 'Your enrollments are marked with a ✓.'}
      </p>
      <div className="mt-6">
        <CalendarView events={events} />
      </div>
    </div>
  );
}

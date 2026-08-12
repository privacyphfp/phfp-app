import { createClient } from '@/lib/supabase/server';

const SERIES_LABELS = {
  healing: 'Healing Series',
  spirituality: 'Spirituality Series',
  prosperity: 'Prosperity Series',
  arhatic_yoga: 'Arhatic Yoga Series',
};

const SERIES_ORDER = ['spirituality', 'healing', 'prosperity', 'arhatic_yoga'];

export default async function CoursesPage() {
  const supabase = await createClient();

  const [{ data: courses }, { data: prereqs }] = await Promise.all([
    supabase.from('courses').select('id, code, name, series, duration_days').order('name'),
    supabase.from('course_prerequisites').select('course_id, prerequisite_course_id'),
  ]);

  const courseById = Object.fromEntries((courses ?? []).map((c) => [c.id, c]));

  const prereqNamesByCourse = {};
  for (const p of prereqs ?? []) {
    (prereqNamesByCourse[p.course_id] ??= []).push(courseById[p.prerequisite_course_id]?.name);
  }

  const grouped = {};
  for (const c of courses ?? []) {
    (grouped[c.series] ??= []).push(c);
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold">Course Catalog</h1>

      {SERIES_ORDER.filter((series) => grouped[series]?.length).map((series) => (
        <section key={series} className="mt-8">
          <h2 className="text-xl font-semibold">{SERIES_LABELS[series]}</h2>
          <ul className="mt-4 space-y-3">
            {grouped[series].map((course) => (
              <li key={course.id} className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">{course.name}</span>
                  <span className="shrink-0 text-sm text-zinc-500">
                    {course.duration_days} day{course.duration_days > 1 ? 's' : ''}
                  </span>
                </div>
                {prereqNamesByCourse[course.id]?.length > 0 && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Requires: {prereqNamesByCourse[course.id].join(', ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

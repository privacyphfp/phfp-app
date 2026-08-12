import { createClient } from '@/lib/supabase/server';

const SERIES_LABELS = {
  healing: 'Healing Series',
  spirituality: 'Spirituality Series',
  prosperity: 'Prosperity Series',
  arhatic_yoga: 'Arhatic Yoga Series',
};

const SERIES_ACCENTS = {
  spirituality: 'border-brand-indigo/30 bg-brand-indigo/5 text-brand-indigo',
  healing: 'border-brand-blue/30 bg-brand-blue/5 text-brand-blue',
  prosperity: 'border-brand-flame/30 bg-brand-flame/5 text-brand-flame',
  arhatic_yoga: 'border-brand-gold/50 bg-brand-amber/10 text-brand-flame',
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
    <div className="mx-auto w-full max-w-3xl p-8">
      <h1 className="text-3xl font-semibold text-brand-blue-dark">Course Catalog</h1>

      {SERIES_ORDER.filter((series) => grouped[series]?.length).map((series) => (
        <section key={series} className="mt-10">
          <h2 className="text-xl font-semibold text-brand-ink/90">{SERIES_LABELS[series]}</h2>
          <ul className="mt-4 space-y-3">
            {grouped[series].map((course) => (
              <li
                key={course.id}
                className={`rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md ${SERIES_ACCENTS[series]}`}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium text-brand-ink">{course.name}</span>
                  <span className="shrink-0 rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-medium">
                    {course.duration_days} day{course.duration_days > 1 ? 's' : ''}
                  </span>
                </div>
                {prereqNamesByCourse[course.id]?.length > 0 && (
                  <p className="mt-1.5 text-sm text-brand-ink/60">
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

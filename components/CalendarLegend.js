import { SERIES_LABELS } from '@/lib/courseSeries';

// Same custom ordering as the dashboard's course-progress board: Healing
// first, curriculum order within Healing and Arhatic Yoga, and Higher
// Clairvoyance pulled into its own group at the very end.
const HIGHER_LEVEL_CODES = new Set(['HC']);
const ARHATIC_ORDER = ['AYP', 'AY1', 'AY2'];
const HEALING_ORDER = ['BPH', 'APH', 'PSY', 'PCH', 'PSD'];
const LEGEND_SERIES_ORDER = ['healing', 'spirituality', 'arhatic_yoga', 'prosperity'];

// Reference key for the calendar: what each center code and course code
// stands for, since the calendar tiles themselves only show the codes.
export default function CalendarLegend({ regions, courses }) {
  const coursesBySeries = LEGEND_SERIES_ORDER.map((series) => {
    let items = courses.filter((c) => c.series === series && !HIGHER_LEVEL_CODES.has(c.code));
    if (series === 'arhatic_yoga') {
      items = items.slice().sort((a, b) => ARHATIC_ORDER.indexOf(a.code) - ARHATIC_ORDER.indexOf(b.code));
    }
    if (series === 'healing') {
      items = items.slice().sort((a, b) => HEALING_ORDER.indexOf(a.code) - HEALING_ORDER.indexOf(b.code));
    }
    return { series, label: SERIES_LABELS[series], items };
  }).filter((group) => group.items.length);

  const higherLevelCourses = courses.filter((c) => HIGHER_LEVEL_CODES.has(c.code));
  if (higherLevelCourses.length) {
    coursesBySeries.push({ series: 'higher_level', label: 'Higher Level Courses', items: higherLevelCourses });
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <section className="rounded-2xl border border-brand-gold/40 bg-white/70 p-4 shadow-sm dark:bg-white/5">
        <h2 className="text-sm font-semibold text-brand-blue-dark">Center Codes</h2>
        <ul className="mt-2 space-y-1 text-sm text-brand-ink/70">
          {regions.map((r) => (
            <li key={r.id}>
              <span className="font-medium text-brand-ink">{r.code}</span> — {r.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-brand-gold/40 bg-white/70 p-4 shadow-sm dark:bg-white/5">
        <h2 className="text-sm font-semibold text-brand-blue-dark">Course Codes</h2>
        <div className="mt-2 space-y-3">
          {coursesBySeries.map((group) => (
            <div key={group.series}>
              <p className="text-xs font-medium tracking-wide text-brand-ink/40 uppercase">{group.label}</p>
              <ul className="mt-1 space-y-1 text-sm text-brand-ink/70">
                {group.items.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium text-brand-ink">{c.code}</span> — {c.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

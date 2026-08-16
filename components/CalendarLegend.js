import { SERIES_LABELS, SERIES_ORDER } from '@/lib/courseSeries';

// Reference key for the calendar: what each center code and course code
// stands for, since the calendar tiles themselves only show the codes.
export default function CalendarLegend({ regions, courses }) {
  const coursesBySeries = SERIES_ORDER.map((series) => ({
    series,
    items: courses.filter((c) => c.series === series),
  })).filter((group) => group.items.length);

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
              <p className="text-xs font-medium tracking-wide text-brand-ink/40 uppercase">{SERIES_LABELS[group.series]}</p>
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

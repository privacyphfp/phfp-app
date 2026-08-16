import Link from 'next/link';
import { SERIES_LABELS, SERIES_ORDER } from '@/lib/courseSeries';

// A "collect them all" progress board: every course in the catalog as a
// tile, checked off once the student has completed it (via a completed
// enrollment or a verified certificate).
export default function CourseBingoBoard({ courses, completedCourseIds }) {
  const groups = SERIES_ORDER.map((series) => ({
    series,
    items: courses.filter((c) => c.series === series),
  })).filter((g) => g.items.length);

  const doneCount = courses.filter((c) => completedCourseIds.has(c.id)).length;

  return (
    <div>
      <p className="text-sm text-brand-ink/60">
        {doneCount} / {courses.length} courses completed
      </p>
      <div className="mt-3 space-y-4">
        {groups.map((group) => (
          <div key={group.series}>
            <p className="text-xs font-medium tracking-wide text-brand-ink/40 uppercase">{SERIES_LABELS[group.series]}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {group.items.map((c) => {
                const done = completedCourseIds.has(c.id);
                return (
                  <Link
                    key={c.id}
                    href={`/courses/${c.id}`}
                    className={`relative rounded-xl border p-3 text-center shadow-sm transition-transform hover:-translate-y-0.5 ${
                      done
                        ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                        : 'border-brand-ink/10 bg-white/40 text-brand-ink/40 dark:bg-white/5'
                    }`}
                  >
                    {done && (
                      <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue text-[10px] font-bold text-white">
                        ✓
                      </span>
                    )}
                    <div className="text-xs font-semibold">{c.code}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

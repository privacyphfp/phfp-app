import Link from 'next/link';
import { SERIES_LABELS } from '@/lib/courseSeries';

// Higher Clairvoyance reads better as its own "Higher Level Courses" tile
// group than lumped in with the rest of the Arhatic Yoga series, and the
// Arhatic Yoga courses read better in curriculum order (Preparatory ->
// Level 1 -> Level 2) than alphabetical-by-code order.
const HIGHER_LEVEL_CODES = new Set(['HC']);
const ARHATIC_ORDER = ['AYP', 'AY1', 'AY2'];

// Healing-first reads better here than the default series order used
// elsewhere (e.g. the public course-path diagram).
const BINGO_SERIES_ORDER = ['healing', 'spirituality', 'prosperity', 'arhatic_yoga'];

// A "collect them all" progress board: every course in the catalog as a
// tile, checked off once the student has completed it (via a completed
// enrollment or a verified certificate).
export default function CourseBingoBoard({ courses, completedCourseIds }) {
  const groups = BINGO_SERIES_ORDER.map((series) => {
    let items = courses.filter((c) => c.series === series && !HIGHER_LEVEL_CODES.has(c.code));
    if (series === 'arhatic_yoga') {
      items = items.slice().sort((a, b) => ARHATIC_ORDER.indexOf(a.code) - ARHATIC_ORDER.indexOf(b.code));
    }
    return { key: series, label: SERIES_LABELS[series], items };
  }).filter((g) => g.items.length);

  const higherLevelCourses = courses.filter((c) => HIGHER_LEVEL_CODES.has(c.code));
  if (higherLevelCourses.length) {
    groups.push({ key: 'higher_level', label: 'Higher Level Courses', items: higherLevelCourses });
  }

  const doneCount = courses.filter((c) => completedCourseIds.has(c.id)).length;

  return (
    <div>
      <p className="text-sm text-brand-ink/60">
        {doneCount} / {courses.length} courses completed
      </p>
      <div className="mt-3 space-y-4">
        {groups.map((group) => (
          <div key={group.key}>
            <p className="text-xs font-medium tracking-wide text-brand-ink/40 uppercase">{group.label}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {group.items.map((c) => {
                const done = completedCourseIds.has(c.id);
                return (
                  <Link
                    key={c.id}
                    href={`/courses/${c.id}`}
                    title={c.name}
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

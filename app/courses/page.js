import { createClient } from '@/lib/supabase/server';
import { SERIES_LABELS, SERIES_ORDER, SERIES_PATH_STYLE } from '@/lib/courseSeries';
import { buildCoursePath } from '@/lib/coursePath';
import { CourseBox } from '@/components/CoursePathNode';
import CoursePathDiagram from '@/components/CoursePathDiagram';

export default async function CoursesPage() {
  const supabase = await createClient();

  const [{ data: courses }, { data: prereqs }] = await Promise.all([
    supabase.from('courses').select('id, code, name, series, duration_days').order('name'),
    supabase.from('course_prerequisites').select('course_id, prerequisite_course_id'),
  ]);

  const {
    foundational,
    healingPath,
    arhaticPath,
    branchesByAnchor,
    other,
    prereqIdsOf,
    courseById,
    crossLink,
    codeVisibleIds,
  } = buildCoursePath(courses ?? [], prereqs ?? []);

  return (
    <div className="mx-auto w-full max-w-7xl p-6 sm:p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-blue-dark sm:text-4xl">Course Catalog</h1>
        <p className="mt-1 text-brand-ink/60">Course Path &amp; Next Steps</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_260px] lg:items-start">
        <CoursePathDiagram
          foundational={foundational}
          healingPath={healingPath}
          arhaticPath={arhaticPath}
          branchesByAnchor={branchesByAnchor}
          prereqIdsOf={prereqIdsOf}
          courseById={courseById}
          crossLink={crossLink}
          codeVisibleIds={codeVisibleIds}
        />

        <aside className="flex flex-col gap-6">
          <div className="rounded-xl border border-brand-blue-dark/20 bg-brand-blue/5 p-4">
            <h3 className="rounded-full bg-brand-blue-dark px-3 py-1 text-center text-xs font-semibold text-white">
              What&apos;s Next
            </h3>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-brand-ink/70">
              {healingPath[0] && <li>Start with {healingPath[0].name}</li>}
              {arhaticPath[0] && <li>{arhaticPath[0].name} can be taken before or after that</li>}
              <li>Follow the core healing path in order</li>
              <li>Complete the healing path to unlock the Arhatic Yoga path</li>
              <li>Advance through the Arhatic Yoga path in order</li>
              <li>Take all courses to deepen your mastery and serve others</li>
            </ol>
          </div>
          <div className="rounded-xl border border-brand-blue-dark/20 bg-brand-blue/5 p-4">
            <h3 className="rounded-full bg-brand-blue-dark px-3 py-1 text-center text-xs font-semibold text-white">
              Notes
            </h3>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-brand-ink/70">
              <li>Prerequisite = the previous course in that path</li>
              <li>Foundational courses can be taken anytime</li>
            </ul>
          </div>
        </aside>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3 border-t border-brand-ink/10 pt-6">
        <span className="text-xs font-semibold tracking-wide text-brand-ink/40 uppercase">Legend</span>
        {SERIES_ORDER.map((s) => (
          <span key={s} className={`rounded-full px-3 py-1 text-xs font-medium ${SERIES_PATH_STYLE[s]}`}>
            {SERIES_LABELS[s]}
          </span>
        ))}
      </div>

      {other.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-brand-ink/80">Other Courses</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {other.map((c) => (
              <CourseBox key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import Link from 'next/link';
import { SERIES_PATH_STYLE } from '@/lib/courseSeries';

export function CourseBox({ course, prereqNames, badge }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className={`block rounded-xl px-4 py-3 text-center shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md ${SERIES_PATH_STYLE[course.series] ?? 'border border-brand-ink/20 bg-white/40'}`}
    >
      {badge && (
        <span className="mb-1 block text-[10px] font-bold tracking-wide text-brand-ink/50 uppercase">
          {badge}
        </span>
      )}
      <div className="text-sm font-medium text-brand-ink">{course.name}</div>
      <div className="mt-0.5 text-xs text-brand-ink/50">
        {course.duration_days} day{course.duration_days > 1 ? 's' : ''}
      </div>
      {prereqNames?.length > 0 && (
        <div className="mt-1 text-[11px] text-brand-ink/40">Requires: {prereqNames.join(', ')}</div>
      )}
    </Link>
  );
}

function DownArrow() {
  return (
    <div className="flex justify-center py-1 text-brand-ink/25">
      <svg width="16" height="18" viewBox="0 0 16 18" fill="none" aria-hidden="true">
        <path
          d="M8 0V14M8 14L2 8M8 14L14 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function PathChain({ chain, branchesByAnchor, prereqIdsOf, courseById }) {
  return (
    <div className="flex flex-col">
      {chain.map((course, i) => {
        const branches = branchesByAnchor[course.id] ?? [];
        const prereqIds = prereqIdsOf[course.id] ?? [];
        const prereqNames = prereqIds.length > 1 ? prereqIds.map((id) => courseById[id]?.name).filter(Boolean) : [];

        return (
          <div key={course.id}>
            {branches.length > 0 ? (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <CourseBox course={course} prereqNames={prereqNames} badge={i === 0 ? 'Start here' : undefined} />
                </div>
                <span className="shrink-0 text-brand-ink/25" aria-hidden="true">
                  →
                </span>
                <div className="flex flex-1 flex-col gap-2">
                  {branches.map((b) => (
                    <CourseBox
                      key={b.id}
                      course={b}
                      prereqNames={(prereqIdsOf[b.id] ?? []).map((id) => courseById[id]?.name).filter(Boolean)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <CourseBox course={course} prereqNames={prereqNames} badge={i === 0 ? 'Start here' : undefined} />
            )}
            {i < chain.length - 1 && <DownArrow />}
          </div>
        );
      })}
    </div>
  );
}

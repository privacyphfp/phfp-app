import Link from 'next/link';
import { SERIES_PATH_STYLE } from '@/lib/courseSeries';
import CourseIcon from '@/components/CourseIcon';

// Shared by every arrow on the course-path diagram so they all read as one
// visual language: a thin line into a small filled triangle head.
export const ARROW_COLOR = 'text-brand-ink/35';

export function CourseBox({ course, prereqNames, badge, showCode }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className={`relative block rounded-xl px-4 py-3 text-center shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md ${SERIES_PATH_STYLE[course.series] ?? 'border border-brand-ink/20 bg-white/40'}`}
    >
      <CourseIcon code={course.code} size={13} className="absolute bottom-1.5 left-2.5 text-brand-ink/40" />
      {badge && (
        <span className="mb-1 block text-[10px] font-bold tracking-wide text-brand-ink/50 uppercase">
          {badge}
        </span>
      )}
      <div className="text-sm font-medium text-brand-ink">
        {course.name}
        {showCode && course.code && <> ({course.code})</>}
      </div>
      <div className="mt-0.5 text-xs text-brand-ink/50">
        {course.duration_days} day{course.duration_days > 1 ? 's' : ''}
      </div>
      {prereqNames?.length > 0 && (
        <div className="mt-1 text-[11px] text-brand-ink/40">Requires: {prereqNames.join(', ')}</div>
      )}
    </Link>
  );
}

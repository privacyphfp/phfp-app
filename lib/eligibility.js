export function computeEligibility({ courses, prereqs, completedCourseIds }) {
  const courseById = Object.fromEntries(courses.map((c) => [c.id, c]));

  const prereqsByCourse = {};
  for (const p of prereqs) {
    (prereqsByCourse[p.course_id] ??= []).push(p.prerequisite_course_id);
  }

  const result = {};
  for (const c of courses) {
    const required = prereqsByCourse[c.id] ?? [];
    const missing = required.filter((id) => !completedCourseIds.has(id)).map((id) => courseById[id]?.name);
    result[c.id] = { eligible: missing.length === 0, missing };
  }
  return result;
}

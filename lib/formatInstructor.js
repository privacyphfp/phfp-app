// Shortens "and" to "&" in instructor names so multi-instructor labels take
// less room on the calendar and other compact views. Word-boundary match
// avoids touching "and" inside another word (e.g. "Sandra").
export function formatInstructorName(name) {
  return name ? name.replace(/\band\b/gi, '&') : name;
}

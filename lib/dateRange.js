// "August 29, 2026" for a single day, "August 29-30, 2026" spanning one
// month, "August 29 - September 1, 2026" across months, "December 30,
// 2026 - January 2, 2027" across years. Always includes the year — for
// student-facing display. (components/ReportsPanel.js has its own
// export-only variant that omits the year when it doesn't change.)
export function formatCourseDateRange(start, end) {
  if (!start) return '';
  const s = new Date(`${start}T00:00:00`);
  if (!end || end === start) {
    return s.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  const e = new Date(`${end}T00:00:00`);
  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();
  if (sameMonth) {
    return `${s.toLocaleDateString('en-US', { month: 'long' })} ${s.getDate()}-${e.getDate()}, ${s.getFullYear()}`;
  }
  const opts = { month: 'long', day: 'numeric', year: 'numeric' };
  return `${s.toLocaleDateString('en-US', opts)} - ${e.toLocaleDateString('en-US', opts)}`;
}

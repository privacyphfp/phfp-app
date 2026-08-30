// A course offering counts as "past" once its last scheduled day has gone
// by. Past offerings drop out of the default student enroll lists and the
// admin dashboard/course-management views to keep things uncluttered —
// Reports and the Calendar still show everything, past or future.
export function isPastOffering(offering) {
  const today = new Date().toISOString().slice(0, 10);
  const lastDay = offering?.end_date || offering?.start_date;
  return !!lastDay && lastDay < today;
}

// Works for anything with start_date/end_date — course offerings and
// events alike — true when today falls within that range.
export function isToday(item) {
  const today = new Date().toISOString().slice(0, 10);
  const start = item?.start_date;
  if (!start) return false;
  const end = item?.end_date || start;
  return start <= today && today <= end;
}

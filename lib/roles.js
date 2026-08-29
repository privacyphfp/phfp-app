// Marketing, Accounting, and Manager are all "flavors" of admin — same
// full access as the plain 'admin' role everywhere (mirrors is_admin()
// in the database, see migration 0028). Student and Volunteer are not
// admin-tier.
export const ADMIN_ROLES = ['admin', 'marketing', 'accounting', 'manager'];

// The top tier within admin: only Admin and Manager can see or change
// another staff/admin member's role, position, or managed region — never
// Marketing or Accounting, even though those two have full operational
// admin access otherwise (courses, students, certificates, payments,
// reports). Mirrors is_ultimate_admin() in the database (migration 0029).
export const ULTIMATE_ROLES = ['admin', 'manager'];

export const ROLE_LABELS = {
  student: 'Student',
  volunteer: 'Volunteer',
  admin: 'Admin',
  marketing: 'Admin / Marketing',
  accounting: 'Admin / Accounting',
  manager: 'Admin / Manager',
};

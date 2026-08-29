// Marketing, Accounting, and Manager are all "flavors" of admin — same
// full access as the plain 'admin' role everywhere (mirrors is_admin()
// in the database, see migration 0028). Student and Volunteer are not
// admin-tier.
export const ADMIN_ROLES = ['admin', 'marketing', 'accounting', 'manager'];

export const ROLE_LABELS = {
  student: 'Student',
  volunteer: 'Volunteer',
  admin: 'Admin',
  marketing: 'Admin / Marketing',
  accounting: 'Admin / Accounting',
  manager: 'Admin / Manager',
};

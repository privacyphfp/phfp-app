import { requireProfile } from '@/lib/auth';
import { isProfileComplete } from '@/lib/profileCompleteness';
import StudentSearchList from '@/components/StudentSearchList';

const ROLE_LABELS = {
  admin: 'Admin',
  marketing: 'Admin / Marketing',
  accounting: 'Admin / Accounting',
  student: 'Student',
  volunteer: 'Volunteer',
};

const STAFF_POSITION_LABELS = {
  instructor: 'Instructor',
  center_manager: 'Center Manager',
};

export default async function AdminStudentsPage() {
  const { supabase } = await requireProfile(['admin']);

  const [{ data: students }, { data: regions }] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('regions').select('id, name'),
  ]);

  const regionNameById = Object.fromEntries((regions ?? []).map((r) => [r.id, r.name]));

  const rows = (students ?? []).map((s) => ({
    id: s.id,
    name: s.full_name || [s.first_name, s.last_name].filter(Boolean).join(' '),
    email: s.email,
    regionName: regionNameById[s.region_id] ?? null,
    roleLabel: ROLE_LABELS[s.role] ?? s.role,
    staffPositionLabel: STAFF_POSITION_LABELS[s.staff_position] ?? null,
    managedRegionName: regionNameById[s.managed_region_id] ?? null,
    complete: s.role === 'student' || s.role === 'volunteer' ? isProfileComplete(s) : null,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl p-8">
      <h1 className="text-2xl font-semibold text-brand-blue-dark">Manage Students</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        {rows.length} account{rows.length === 1 ? '' : 's'}. Click anyone to view their profile, change their role,
        or assign them as an instructor or center manager.
      </p>
      <div className="mt-6">
        <StudentSearchList students={rows} />
      </div>
    </div>
  );
}

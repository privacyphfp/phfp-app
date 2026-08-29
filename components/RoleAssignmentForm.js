'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'admin', label: 'Admin' },
  { value: 'marketing', label: 'Admin / Marketing' },
  { value: 'accounting', label: 'Admin / Accounting' },
  { value: 'manager', label: 'Admin / Manager' },
];

const STAFF_POSITIONS = [
  { value: '', label: 'None' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'center_manager', label: 'Center Manager' },
];

export default function RoleAssignmentForm({ studentId, initialRole, initialStaffPosition, initialManagedRegionId, regions }) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole ?? 'student');
  const [staffPosition, setStaffPosition] = useState(initialStaffPosition ?? '');
  const [managedRegionId, setManagedRegionId] = useState(initialManagedRegionId ?? '');
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (staffPosition && !managedRegionId) {
      setError('Pick a region for this staff position.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          role,
          staff_position: staffPosition || null,
          managed_region_id: staffPosition ? managedRegionId : null,
        })
        .eq('id', studentId);

      if (error) {
        setError(error.message);
        return;
      }

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const selectClass =
    'mt-1 w-full rounded-lg border border-brand-blue/20 px-3 py-2 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900';

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {error && <p className="sm:col-span-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="sm:col-span-3 text-sm text-brand-blue">Saved.</p>}

      <label className="text-sm text-brand-ink/80">
        Role
        <select value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm text-brand-ink/80">
        Position
        <select value={staffPosition} onChange={(e) => setStaffPosition(e.target.value)} className={selectClass}>
          {STAFF_POSITIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm text-brand-ink/80">
        Region they manage
        <select
          value={managedRegionId}
          onChange={(e) => setManagedRegionId(e.target.value)}
          disabled={!staffPosition}
          className={`${selectClass} disabled:opacity-50`}
        >
          <option value="">Select a region</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="sm:col-span-3 w-fit rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save Role & Permissions'}
      </button>
    </form>
  );
}

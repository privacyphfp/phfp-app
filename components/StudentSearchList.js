'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export default function StudentSearchList({ students }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.name, s.email, s.regionName, s.roleLabel, s.staffPositionLabel]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [students, query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, email, or region…"
        className="w-full rounded-lg border border-brand-blue/20 px-3 py-2 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900"
      />

      <div className="mt-4 space-y-2">
        {filtered.map((s) => (
          <Link
            key={s.id}
            href={`/admin/students/${s.id}`}
            className="flex items-center justify-between rounded-xl border border-brand-blue/15 bg-white/60 p-4 shadow-sm transition-colors hover:border-brand-blue/40 dark:bg-white/5"
          >
            <div>
              <div className="font-medium text-brand-ink">{s.name || 'Unnamed student'}</div>
              <div className="text-sm text-brand-ink/60">{s.email}</div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {s.roleLabel && (
                <span className="rounded-full bg-brand-ink/10 px-2.5 py-0.5 text-xs font-medium text-brand-ink/70">
                  {s.roleLabel}
                </span>
              )}
              {s.staffPositionLabel && (
                <span className="rounded-full bg-brand-flame/10 px-2.5 py-0.5 text-xs font-medium text-brand-flame">
                  {s.staffPositionLabel}
                  {s.managedRegionName ? ` · ${s.managedRegionName}` : ''}
                </span>
              )}
              {s.regionName && (
                <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-medium text-brand-blue">
                  {s.regionName}
                </span>
              )}
              {s.complete !== null && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    s.complete ? 'bg-green-600/10 text-green-700' : 'bg-brand-flame/10 text-brand-flame'
                  }`}
                >
                  {s.complete ? 'Profile complete' : 'Profile incomplete'}
                </span>
              )}
            </div>
          </Link>
        ))}
        {!filtered.length && <p className="text-brand-ink/50">No students match your search.</p>}
      </div>
    </div>
  );
}

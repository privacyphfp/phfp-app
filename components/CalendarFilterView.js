'use client';

import { useMemo, useState } from 'react';
import CalendarView from './CalendarView';

// Wraps CalendarView with a Nationwide/per-region dropdown. Nationwide items
// (regionId === null) always show regardless of which region is selected,
// since they're relevant to everyone.
export default function CalendarFilterView({ items, regions }) {
  const [regionId, setRegionId] = useState('all');

  const filtered = useMemo(() => {
    if (regionId === 'all') return items;
    return items.filter((item) => item.extendedProps.regionId === null || item.extendedProps.regionId === regionId);
  }, [items, regionId]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
        <label htmlFor="region-filter" className="text-sm font-medium text-brand-ink/70">
          Region
        </label>
        <select
          id="region-filter"
          value={regionId}
          onChange={(e) => setRegionId(e.target.value)}
          className="w-full min-w-0 rounded-lg border border-brand-blue/20 px-3 py-1.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900 sm:w-auto"
        >
          <option value="all">Nationwide (all regions)</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <CalendarView events={filtered} />
    </div>
  );
}

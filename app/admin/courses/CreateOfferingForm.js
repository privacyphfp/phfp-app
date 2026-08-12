'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CreateOfferingForm({ courses }) {
  const router = useRouter();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('course_offerings').insert({
        course_id: courseId,
        start_date: startDate,
        end_date: endDate || null,
        location: location || null,
        is_online: isOnline,
        capacity: capacity ? Number(capacity) : null,
        price: price ? Number(price) : null,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setStartDate('');
      setEndDate('');
      setLocation('');
      setCapacity('');
      setPrice('');
      router.refresh();
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-brand-blue/20 px-2 py-1.5 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900';

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-brand-gold/40 bg-brand-amber/5 p-5"
    >
      <h2 className="font-medium text-brand-blue-dark">Schedule a New Offering</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-brand-ink/80">
          Course
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputClass}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-brand-ink/80">
          Start Date
          <input
            required
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm text-brand-ink/80">
          End Date
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
        </label>
        <label className="text-sm text-brand-ink/80">
          Location
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isOnline}
            className={`${inputClass} disabled:opacity-50`}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-brand-ink/80">
          <input
            type="checkbox"
            checked={isOnline}
            onChange={(e) => setIsOnline(e.target.checked)}
            className="accent-brand-blue"
          />
          Online
        </label>
        <label className="text-sm text-brand-ink/80">
          Capacity
          <input
            type="number"
            min="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm text-brand-ink/80">
          Price (₱)
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-brand-blue px-5 py-2 font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Create Offering'}
      </button>
    </form>
  );
}

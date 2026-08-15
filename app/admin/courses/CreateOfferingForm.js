'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const EVENT_TYPES = [
  { value: 'one_time', label: 'One-time' },
  { value: 'special', label: 'Special event' },
  { value: 'weekly', label: 'Weekly event' },
];

function instructorName(profile) {
  return profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unnamed';
}

export default function CreateOfferingForm({ courses, regions, instructors }) {
  const router = useRouter();
  const [type, setType] = useState('offering'); // 'offering' | 'event'

  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('one_time');
  const [regionId, setRegionId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState('');
  const [instructorMode, setInstructorMode] = useState('existing'); // 'existing' | 'manual'
  const [instructorId, setInstructorId] = useState('');
  const [instructorNameInput, setInstructorNameInput] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function resetCommon() {
    setStartDate('');
    setEndDate('');
    setLocation('');
    setCapacity('');
    setPrice('');
    setTitle('');
    setDescription('');
    setInstructorId('');
    setInstructorNameInput('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } =
        type === 'offering'
          ? await supabase.from('course_offerings').insert({
              course_id: courseId,
              start_date: startDate,
              end_date: endDate || null,
              location: location || null,
              is_online: isOnline,
              capacity: capacity ? Number(capacity) : null,
              price: price ? Number(price) : null,
              region_id: regionId || null,
              created_by: user?.id ?? null,
              instructor_id: instructorMode === 'existing' ? instructorId || null : null,
              instructor_name: instructorMode === 'manual' ? instructorNameInput.trim() || null : null,
            })
          : await supabase.from('events').insert({
              title,
              description: description || null,
              event_type: eventType,
              start_date: startDate,
              end_date: endDate || null,
              location: location || null,
              is_online: isOnline,
              region_id: regionId || null,
              created_by: user?.id ?? null,
            });

      if (error) {
        setError(error.message);
        return;
      }

      resetCommon();
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
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-brand-blue-dark">
          {type === 'offering' ? 'Schedule a New Offering' : 'Add a New Event'}
        </h2>
        <div className="flex gap-1 rounded-full border border-brand-blue/20 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setType('offering')}
            className={`rounded-full px-3 py-1 transition-colors ${type === 'offering' ? 'bg-brand-blue text-white' : 'text-brand-ink/60'}`}
          >
            Course Offering
          </button>
          <button
            type="button"
            onClick={() => setType('event')}
            className={`rounded-full px-3 py-1 transition-colors ${type === 'event' ? 'bg-brand-blue text-white' : 'text-brand-ink/60'}`}
          >
            Event
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {type === 'offering' ? (
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
        ) : (
          <>
            <label className="text-sm text-brand-ink/80">
              Title
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </label>
            <label className="text-sm text-brand-ink/80">
              Event Type
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} className={inputClass}>
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-2 text-sm text-brand-ink/80">
              Description
              <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
            </label>
          </>
        )}

        <label className="text-sm text-brand-ink/80">
          Region
          <select value={regionId} onChange={(e) => setRegionId(e.target.value)} className={inputClass}>
            <option value="">Nationwide</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
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

        {type === 'offering' && (
          <>
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

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-brand-ink/80">Instructor</span>
                <div className="flex gap-1 rounded-full border border-brand-blue/20 p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setInstructorMode('existing')}
                    className={`rounded-full px-3 py-1 transition-colors ${instructorMode === 'existing' ? 'bg-brand-blue text-white' : 'text-brand-ink/60'}`}
                  >
                    Existing profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstructorMode('manual')}
                    className={`rounded-full px-3 py-1 transition-colors ${instructorMode === 'manual' ? 'bg-brand-blue text-white' : 'text-brand-ink/60'}`}
                  >
                    Type name
                  </button>
                </div>
              </div>
              {instructorMode === 'existing' ? (
                <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} className={inputClass}>
                  <option value="">Select an instructor</option>
                  {instructors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {instructorName(i)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={instructorNameInput}
                  onChange={(e) => setInstructorNameInput(e.target.value)}
                  placeholder="Instructor's name"
                  className={inputClass}
                />
              )}
            </div>
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-brand-blue px-5 py-2 font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
      >
        {loading ? 'Saving…' : type === 'offering' ? 'Create Offering' : 'Create Event'}
      </button>
    </form>
  );
}

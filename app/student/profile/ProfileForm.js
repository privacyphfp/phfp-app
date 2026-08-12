'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ProfileForm({ profile }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [birthdate, setBirthdate] = useState(profile?.birthdate ?? '');
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          address: address || null,
          birthdate: birthdate || null,
        })
        .eq('id', profile.id);

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

  const inputClass =
    'mt-1 w-full rounded-lg border border-brand-blue/20 px-3 py-2 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 dark:bg-zinc-900';

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-brand-gold/40 bg-white/70 p-6 shadow-sm dark:bg-white/5"
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-brand-blue">Profile saved.</p>}

      <div>
        <label className="block text-sm font-medium text-brand-ink/80">Full Name</label>
        <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-ink/80">Email</label>
        <input value={profile?.email ?? ''} disabled className={`${inputClass} opacity-60`} />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-ink/80">Phone</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-ink/80">Address</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-ink/80">Birthdate</label>
        <input
          type="date"
          value={birthdate ?? ''}
          onChange={(e) => setBirthdate(e.target.value)}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-brand-blue px-5 py-2 font-medium text-white shadow-sm shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save Profile'}
      </button>
    </form>
  );
}

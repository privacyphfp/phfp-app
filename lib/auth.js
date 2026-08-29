import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// SiteHeader (every page, via the root layout) and each page's own auth
// check were both independently calling supabase.auth.getUser() + fetching
// the profile — two full round trips to Supabase, duplicated on every
// single request. React's cache() memoizes this per-request: whichever
// caller runs first does the real fetch, everyone else in the same
// request reuses that result instead of re-querying.
export const getAuthedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return { supabase, user, profile };
});

export async function requireProfile(allowedRoles) {
  const { supabase, user, profile } = await getAuthedUser();

  if (!user) {
    redirect('/login');
  }

  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    redirect('/login');
  }

  return { supabase, user, profile };
}

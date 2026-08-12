import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requireProfile(allowedRoles) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    redirect('/login');
  }

  return { supabase, user, profile };
}

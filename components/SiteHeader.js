import Image from 'next/image';
import Link from 'next/link';
import logo from '@/public/logo.png';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';

export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = null;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    role = profile?.role ?? null;
  }

  const navPillClass =
    'flex items-center justify-center rounded-full border border-brand-blue/30 px-4 py-1.5 text-brand-ink/70 transition-colors hover:border-brand-blue hover:text-brand-blue';

  return (
    <header className="border-b border-brand-gold/40 bg-brand-cream/80 backdrop-blur supports-[backdrop-filter]:bg-brand-cream/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src={logo} alt="PHFP" width={36} height={36} className="rounded-full" />
          <span className="text-lg font-semibold tracking-tight text-brand-blue-dark">
            PHFP App
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium">
          {user &&
            (role === 'admin' ? (
              <Link href="/admin" className={navPillClass}>
                Admin Dashboard
              </Link>
            ) : (
              <Link href="/student/profile" className={navPillClass}>
                My Profile
              </Link>
            ))}
          <Link href="/courses" className={navPillClass}>
            Courses
          </Link>
          <Link href="/calendar" className={navPillClass}>
            Calendar
          </Link>
          {user ? (
            <SignOutButton className={navPillClass} />
          ) : (
            <>
              <Link href="/login" className={navPillClass}>
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-brand-blue px-4 py-1.5 text-white shadow-sm transition-colors hover:bg-brand-blue-dark"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import logo from '@/public/logo.png';
import { getAuthedUser } from '@/lib/auth';
import SignOutButton from './SignOutButton';
import MobileMenu from './MobileMenu';

export default async function SiteHeader() {
  // Reuses whatever the current page already fetched for auth (same
  // request, memoized) instead of re-querying Supabase from scratch.
  const { user, profile } = await getAuthedUser();
  const role = profile?.role ?? null;

  const navPillClass =
    'flex items-center justify-center rounded-full border border-brand-blue/30 px-4 py-1.5 text-brand-ink/70 transition-colors hover:border-brand-blue hover:text-brand-blue';
  const mobilePillClass =
    'flex items-center justify-center rounded-full border border-brand-blue/30 px-4 py-2.5 text-brand-ink/70 transition-colors hover:border-brand-blue hover:text-brand-blue';

  // Everyone is also a student here — admin (and any other staff role) is
  // a permission layered on top of a real person who takes courses too,
  // so admins get both links instead of My Dashboard being hidden behind
  // their staff role.
  const roleLinks = user
    ? [
        ...(role === 'admin' ? [{ href: '/admin', label: 'Admin Dashboard' }] : []),
        { href: '/student', label: 'My Profile' },
      ]
    : [];

  return (
    <header className="relative z-50 border-b border-brand-gold/40 bg-brand-cream/80 backdrop-blur supports-[backdrop-filter]:bg-brand-cream/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src={logo} alt="PHFP" width={36} height={36} className="rounded-full" />
          <span className="text-lg font-semibold tracking-tight text-brand-blue-dark">
            PHFP App
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-3 text-sm font-medium sm:flex">
          {roleLinks.map((link) => (
            <Link key={link.href} href={link.href} className={navPillClass}>
              {link.label}
            </Link>
          ))}
          <Link href="/courses" className={navPillClass}>
            Courses
          </Link>
          <Link href="/calendar" className={navPillClass}>
            Calendar
          </Link>
          {role === 'admin' && (
            <Link href="/admin/reports" className={navPillClass}>
              Reports
            </Link>
          )}
          {user ? (
            <SignOutButton className={navPillClass} />
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-brand-blue px-4 py-1.5 text-white shadow-sm transition-colors hover:bg-brand-blue-dark"
            >
              Log In / Sign Up
            </Link>
          )}
        </nav>

        {/* Mobile nav */}
        <MobileMenu>
          {roleLinks.map((link) => (
            <Link key={link.href} href={link.href} className={mobilePillClass}>
              {link.label}
            </Link>
          ))}
          <Link href="/courses" className={mobilePillClass}>
            Courses
          </Link>
          <Link href="/calendar" className={mobilePillClass}>
            Calendar
          </Link>
          {role === 'admin' && (
            <Link href="/admin/reports" className={mobilePillClass}>
              Reports
            </Link>
          )}
          {user ? (
            <SignOutButton className={mobilePillClass} />
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center rounded-full bg-brand-blue px-4 py-2.5 text-white shadow-sm transition-colors hover:bg-brand-blue-dark"
            >
              Log In / Sign Up
            </Link>
          )}
        </MobileMenu>
      </div>
    </header>
  );
}

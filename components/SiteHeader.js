import Image from 'next/image';
import Link from 'next/link';
import logo from '@/public/logo.png';

export default function SiteHeader() {
  return (
    <header className="border-b border-brand-gold/40 bg-brand-cream/80 backdrop-blur supports-[backdrop-filter]:bg-brand-cream/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src={logo} alt="PHFP" width={36} height={36} className="rounded-full" />
          <span className="text-lg font-semibold tracking-tight text-brand-blue-dark">
            PHFP App
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/courses" className="text-brand-ink/70 transition-colors hover:text-brand-blue">
            Courses
          </Link>
          <Link href="/calendar" className="text-brand-ink/70 transition-colors hover:text-brand-blue">
            Calendar
          </Link>
          <Link href="/login" className="text-brand-ink/70 transition-colors hover:text-brand-blue">
            Log In
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-brand-blue px-4 py-1.5 text-white shadow-sm transition-colors hover:bg-brand-blue-dark"
          >
            Sign Up
          </Link>
        </nav>
      </div>
    </header>
  );
}

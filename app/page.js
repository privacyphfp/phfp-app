import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import logo from "@/public/logo.png";
import { getAuthedUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/roles";

export default async function Home() {
  // Logged-in visitors (including clicking the logo/"PHFP App" in the
  // header, which just links here) go straight to their dashboard
  // instead of this logged-out landing page — landing here while signed
  // in reads as "did I just get logged out?".
  const { user, profile } = await getAuthedUser();
  if (user) {
    redirect(ADMIN_ROLES.includes(profile?.role) ? "/admin" : "/student");
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 20%, color-mix(in srgb, var(--brand-gold) 35%, transparent) 0%, transparent 70%), radial-gradient(50% 40% at 85% 90%, color-mix(in srgb, var(--brand-blue) 18%, transparent) 0%, transparent 70%)",
        }}
      />

      <Image
        src={logo}
        alt="Pranic Healing Foundation of the Philippines"
        width={140}
        height={140}
        priority
        className="drop-shadow-[0_8px_24px_rgba(240,204,96,0.45)]"
      />

      <h1 className="mt-6 text-4xl font-semibold tracking-tight text-brand-blue-dark sm:text-5xl">
        PHFP App
      </h1>
      <p className="mt-4 max-w-md text-balance text-brand-ink/70">
        Pranic Healing Foundation of the Philippines — student portal, courses,
        certificates, and events, all in one place.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="rounded-full bg-brand-blue px-6 py-2.5 font-medium text-white shadow-md shadow-brand-blue/20 transition-colors hover:bg-brand-blue-dark"
        >
          Log In / Sign Up
        </Link>
        <Link
          href="/courses"
          className="rounded-full border border-brand-flame/40 bg-brand-amber/20 px-6 py-2.5 font-medium text-brand-flame transition-colors hover:bg-brand-amber/35"
        >
          Browse Courses
        </Link>
      </div>
    </div>
  );
}

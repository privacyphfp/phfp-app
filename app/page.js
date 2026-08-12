import Image from "next/image";
import logo from "@/public/logo.png";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <Image src={logo} alt="Pranic Healing Foundation of the Philippines" width={120} height={120} priority />
      <h1 className="text-4xl font-semibold">PHFP App</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Pranic Healing Foundation of the Philippines — student portal, courses,
        and events.
      </p>
      <div className="mt-2 flex gap-3">
        <a href="/courses" className="rounded border border-zinc-300 px-4 py-2 dark:border-zinc-700">
          Browse Courses
        </a>
        <a href="/signup" className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black">
          Sign Up
        </a>
        <a href="/login" className="rounded border border-zinc-300 px-4 py-2 dark:border-zinc-700">
          Log In
        </a>
      </div>
    </div>
  );
}

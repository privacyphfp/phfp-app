import Image from "next/image";
import logo from "@/public/logo.png";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <Image src={logo} alt="Pranic Healing Foundation of the Philippines" width={120} height={120} priority />
      <h1 className="text-4xl font-semibold">PHFP App</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Pranic Healing Foundation of the Philippines — student portal, courses,
        and events. Scaffold in progress.
      </p>
    </div>
  );
}

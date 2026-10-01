import Link from "next/link";
import { Sparkles } from "lucide-react";

export function PublicSiteHeader() {
  return (
    <header className="border-b border-[#1f212d] bg-[#0d0e14]">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3 sm:px-10 lg:px-16"
      >
        <Link href="/" className="inline-flex items-center gap-2.5 text-white">
          <span className="flex size-8 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-600/10 text-blue-300">
            <Sparkles className="size-4" />
          </span>
          <span className="text-sm font-bold">JobHunter</span>
        </Link>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link
            href="/about"
            className="text-slate-300 transition-colors hover:text-blue-300"
          >
            About
          </Link>
          <Link
            href="/guide"
            className="text-slate-300 transition-colors hover:text-blue-300"
          >
            Guide
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-[#2b2e3b] px-3 py-2 font-medium text-white transition-colors hover:border-blue-500/40 hover:bg-blue-600/10"
          >
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}

import Link from "next/link";
import { Sparkles } from "lucide-react";

export function PublicSiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0d0e14]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 sm:px-10 md:flex-row md:items-center md:justify-between lg:px-16">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white"
          >
            <span className="flex size-7 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-600/10 text-blue-300">
              <Sparkles className="size-3.5" aria-hidden="true" />
            </span>
            JobHunter
          </Link>
          <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
            A focused workspace for making your next career move with more
            clarity. Your application decisions stay yours.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
          <Link
            href="/guide"
            className="text-slate-400 transition-colors hover:text-white"
          >
            How it works
          </Link>
          <Link
            href="/about"
            className="text-slate-400 transition-colors hover:text-white"
          >
            About
          </Link>
          <Link
            href="/login"
            className="text-slate-400 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-blue-300 transition-colors hover:text-blue-200"
          >
            Create an account
          </Link>
        </nav>
      </div>
    </footer>
  );
}

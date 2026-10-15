import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ActionHint } from "@/components/action-hint";

export function PublicSiteHeader() {
  return (
    <header className="border-b border-[#1f212d] bg-[#0d0e14]">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-10 lg:px-16"
      >
        <Link
          href="/"
          aria-label="JobHunter home"
          className="inline-flex items-center gap-3 text-white"
        >
          {/* show full wordmark on small+ screens, compact mark on very small screens */}
          <BrandLogo className="hidden sm:block" alt="JobHunter" />
          <BrandLogo compact className="sm:hidden" alt="JobHunter" />
          <span className="text-base font-bold sm:text-lg">JobHunter</span>
        </Link>

        <div className="flex items-center gap-2 text-xs sm:gap-4 sm:text-sm">
          <ActionHint label="See key features" className="hidden md:inline">
            <Link href="/#features" className="text-slate-300 transition-colors hover:text-blue-300">Features</Link>
          </ActionHint>

          <ActionHint label="Read the guide" className="inline-flex">
            <Link href="/guide" className="text-slate-300 transition-colors hover:text-blue-300">Guide</Link>
          </ActionHint>

          <ActionHint label="Learn more about JobHunter" className="hidden md:inline">
            <Link href="/about" className="text-slate-300 transition-colors hover:text-blue-300">About</Link>
          </ActionHint>

          <ActionHint label="Sign in to your account" className="inline-flex">
            <Link
              href="/login"
              className="rounded-lg border border-[#2b2e3b] px-2.5 py-2 font-medium text-white transition-colors hover:border-blue-500/40 hover:bg-blue-600/10 sm:px-3"
            >
              Sign in
            </Link>
          </ActionHint>

          <ActionHint label="Create a new account — get started" className="inline-flex">
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-2.5 py-2 font-semibold text-white transition-colors hover:bg-blue-500 sm:px-3"
            >
              Get started
            </Link>
          </ActionHint>
        </div>
      </nav>
    </header>
  );
}

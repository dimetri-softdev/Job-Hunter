import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export function PublicSiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0d0e14]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 sm:px-10 md:flex-row md:items-center md:justify-between lg:px-16">
        <div>
          <Link
            href="/"
            aria-label="JobHunter home"
            className="inline-flex items-center"
          >
            <BrandLogo className="h-12 w-[216px]" alt="" />
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

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#090a0f] px-6 py-16 text-slate-100">
      <div className="w-full max-w-lg space-y-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
          Page not found
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          This page isn’t here
        </h1>
        <p className="text-sm leading-6 text-slate-400">
          The link may be outdated, or the page may have moved. Head back and
          we’ll help you find your way.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/"
            className="rounded-xl border border-[#2b2e3b] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-blue-500/50 hover:bg-white/5"
          >
            Go to home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

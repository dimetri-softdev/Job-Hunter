"use client";

export default function ErrorPage({
  unstable_retry,
}: {
  unstable_retry: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#090a0f] px-6 py-16 text-slate-100">
      <div
        aria-labelledby="error-title"
        className="w-full max-w-lg space-y-5 text-center"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
          Something went wrong
        </p>
        <h1
          id="error-title"
          className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          Let’s try that again
        </h1>
        <p className="text-sm leading-6 text-slate-400">
          We couldn’t load this page just now. Please try again or come back in
          a moment.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090a0f]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}

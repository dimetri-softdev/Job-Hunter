"use client";

import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { user, signOut, loading } = useAuth();

  const initial = user?.email ? user.email[0].toUpperCase() : "U";

  return (
    <header className="h-16 shrink-0 border-b border-[#1f212d] bg-[#0d0e14] px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-full w-full max-w-[1600px] items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Career Co-Pilot</span>
        </div>

        <div className="flex min-w-0 items-center gap-3 text-xs text-slate-400 sm:gap-4">
          <button className="hidden transition-colors hover:text-white sm:inline-flex">
            Feedback
          </button>

          {loading ? (
            <div className="h-8 w-28 animate-pulse rounded-full border border-[#1f212d] bg-[#141620]" />
          ) : user ? (
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="flex min-w-0 items-center gap-2 rounded-full border border-[#1f212d] bg-[#141620] px-2 py-1 sm:px-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {initial}
                </div>
                <span className="hidden max-w-56 truncate font-mono text-slate-200 sm:inline">
                  {user.email}
                </span>
              </div>

              <button
                onClick={signOut}
                className="rounded-lg border border-[#1f212d] bg-[#141620] px-2.5 py-1.5 text-[11px] text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
              >
                Sign Out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

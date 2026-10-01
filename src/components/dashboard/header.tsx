"use client";

import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { user, signOut, loading } = useAuth();

  const initial = user?.email ? user.email[0].toUpperCase() : "U";

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#1f212d] bg-[#0d0e14] px-6">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white">Career Co-Pilot</span>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-400">
        <button className="hover:text-white transition-colors">Feedback</button>

        {loading ? (
          <div className="h-8 w-28 animate-pulse rounded-full bg-[#141620] border border-[#1f212d]" />
        ) : user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#141620] border border-[#1f212d] px-2.5 py-1 rounded-full">
              <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                {initial}
              </div>
              <span className="text-slate-200 font-mono">{user.email}</span>
            </div>

            {user && (
              <button
                onClick={signOut}
                className="rounded-lg bg-[#141620] border border-[#1f212d] px-2.5 py-1 text-[11px] text-slate-400 hover:text-white hover:border-slate-700 transition"
              >
                Sign Out
              </button>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}

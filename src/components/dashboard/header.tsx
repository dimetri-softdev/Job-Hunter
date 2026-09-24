"use client";

import { useEffect, useState } from "react";
import { fetcher } from "@/lib/api";

interface UserProfile {
  email: string;
  name: string;
}

export function Header() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await fetcher<UserProfile>("/user");
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    }
    loadUser();
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#1f212d] bg-[#0d0e14] px-6">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white">Career Co-Pilot</span>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-400">
        <button className="hover:text-white transition-colors">Feedback</button>
        <div className="flex items-center gap-2 bg-[#141620] border border-[#1f212d] px-2.5 py-1 rounded-full">
          <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
            {user?.email ? user.email[0].toUpperCase() : "U"}
          </div>
          <span className="text-slate-200 font-mono">
            {user?.email || "Loading..."}
          </span>
        </div>
      </div>
    </header>
  );
}

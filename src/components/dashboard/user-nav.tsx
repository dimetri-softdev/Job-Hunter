import React from "react";

export function UserNav() {
  return (
    <header className="h-16 border-b border-[#1f212d] bg-[#090a0f]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
          ⚡
        </div>
        <span className="font-semibold text-white tracking-tight">
          Career Co-Pilot
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-xs text-slate-400 hover:text-slate-200 transition">
          Feedback
        </button>
        <div className="flex items-center gap-2.5 bg-[#12131a] px-3 py-1.5 rounded-full border border-[#1f212d] cursor-pointer hover:border-slate-700 transition">
          <div className="w-6 h-6 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-full flex items-center justify-center font-bold text-[10px] text-white">
            A
          </div>
          <span className="text-xs font-medium text-slate-300">
            alex@dev.io
          </span>
        </div>
      </div>
    </header>
  );
}

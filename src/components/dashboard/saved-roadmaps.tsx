import React from "react";

interface SavedRoadmap {
  id: string;
  title: string;
  date: string;
  progress: number;
  active: boolean;
  indicatorColor: string;
}

const mockRoadmaps: SavedRoadmap[] = [
  {
    id: "1",
    title: "Junior Full-Stack Engineer",
    date: "Sep 2026",
    progress: 45,
    active: true,
    indicatorColor: "bg-amber-400",
  },
  {
    id: "2",
    title: "Frontend Engineer — React",
    date: "Aug 2026",
    progress: 72,
    active: false,
    indicatorColor: "bg-emerald-400",
  },
  {
    id: "3",
    title: "DevOps / Platform Engineer",
    date: "Aug 2026",
    progress: 18,
    active: false,
    indicatorColor: "bg-rose-500",
  },
];

export function SavedRoadmaps() {
  return (
    <div className="bg-[#12131a] border border-[#1f212d] rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-[#1f212d]">
        <h3 className="font-semibold text-white text-sm">Saved Roadmaps</h3>
        <span className="text-xs bg-[#1f212d] text-slate-400 px-2 py-0.5 rounded-full font-mono">
          {mockRoadmaps.length}
        </span>
      </div>

      <div className="space-y-2.5">
        {mockRoadmaps.map((item) => (
          <div
            key={item.id}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              item.active
                ? "bg-[#181a24] border-blue-500/50 shadow-lg shadow-blue-500/5"
                : "bg-[#090a0f] border-[#1f212d] hover:border-slate-700 hover:bg-[#0e0f17]"
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${item.indicatorColor}`}
                />
                <h4 className="text-xs font-semibold text-slate-100 truncate">
                  {item.title}
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                {item.date}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#1f212d] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono w-7 text-right">
                {item.progress}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

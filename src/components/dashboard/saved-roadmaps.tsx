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
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-white text-sm">Saved Roadmaps</h3>
        <span className="text-xs bg-[#1f212d] text-slate-400 px-2 py-0.5 rounded-full font-mono">
          {mockRoadmaps.length}
        </span>
      </div>

      <div className="space-y-3">
        {mockRoadmaps.map((item) => (
          <div
            key={item.id}
            className={`p-3.5 rounded-xl border transition cursor-pointer ${
              item.active
                ? "bg-[#181a24] border-blue-500/50"
                : "bg-[#090a0f] border-[#1f212d] hover:border-slate-700"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${item.indicatorColor}`} />
                <h4 className="text-xs font-medium text-white truncate max-w-[150px]">
                  {item.title}
                </h4>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {item.date}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#1f212d] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {item.progress}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
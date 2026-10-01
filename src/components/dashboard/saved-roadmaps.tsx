interface SavedRoadmap {
  id: string;
  title: string;
  createdAt: string;
  projects: { tasks: { completed: boolean }[] }[];
}

interface SavedRoadmapsProps {
  roadmaps: SavedRoadmap[];
  activeRoadmapId: string | null;
  onSelect: (roadmapId: string) => void;
}

export function SavedRoadmaps({
  roadmaps,
  activeRoadmapId,
  onSelect,
}: SavedRoadmapsProps) {
  return (
    <div className="bg-[#12131a] border border-[#1f212d] rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-[#1f212d]">
        <h3 className="font-semibold text-white text-sm">Saved Roadmaps</h3>
        <span className="text-xs bg-[#1f212d] text-slate-400 px-2 py-0.5 rounded-full font-mono">
          {roadmaps.length}
        </span>
      </div>

      {roadmaps.length === 0 ? (
        <p className="py-5 text-center text-xs text-slate-500">
          No saved roadmaps yet.
        </p>
      ) : (
        <div className="space-y-2.5">
          {roadmaps.map((item) => {
            const tasks = item.projects.flatMap((project) => project.tasks);
            const completed = tasks.filter((task) => task.completed).length;
            const progress = tasks.length
              ? Math.round((completed / tasks.length) * 100)
              : 0;
            const isActive = item.id === activeRoadmapId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                aria-pressed={isActive}
                className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                  isActive
                    ? "border-blue-500/50 bg-[#181a24] shadow-lg shadow-blue-500/5"
                    : "border-[#1f212d] bg-[#090a0f] hover:border-slate-700 hover:bg-[#0e0f17]"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h4 className="truncate text-xs font-semibold text-slate-100">
                    {item.title}
                  </h4>
                  <span className="shrink-0 text-[10px] text-slate-400 font-mono">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1f212d]">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="w-7 text-right text-[10px] text-slate-400 font-mono">
                    {progress}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

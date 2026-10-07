"use client";

import React, { useEffect, useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { fetcher } from "@/lib/api";
import { GeneratorModal } from "@/components/dashboard/generator-modal";
import { DashboardPageHeader } from "@/components/dashboard/page-header";

interface Task {
  id: string;
  completed: boolean;
}

interface ProjectTrack {
  tasks: Task[];
}

interface Roadmap {
  id: string;
  title: string;
  readinessScore: number;
  createdAt: string;
  projects: ProjectTrack[];
}

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getRoadmaps() {
      try {
        const data = await fetcher<Roadmap[]>("/roadmaps");
        setRoadmaps(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load roadmaps:", err);
      } finally {
        setLoading(false);
      }
    }
    getRoadmaps();
  }, []);

  useEffect(() => {
    if (loading || !window.location.hash) return;
    const roadmapId = decodeURIComponent(window.location.hash.slice(1));
    document.getElementById(roadmapId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [loading, roadmaps]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Fetching career roadmaps...</span>
      </div>
    );
  }

  const handleRoadmapGenerated = (roadmap: Roadmap) => {
    setRoadmaps((currentRoadmaps) => [roadmap, ...currentRoadmaps]);
  };

  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="Career Roadmaps"
        description="Manage your tailored AI pathways and track targeted role readiness."
      >
        <GeneratorModal
          buttonLabel="New Roadmap"
          onRoadmapGenerated={handleRoadmapGenerated}
        />
      </DashboardPageHeader>

      <div className="flex items-center gap-2">
        {["all", "active", "completed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === tab
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:bg-[#12131a]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {roadmaps
          .filter((roadmap) => {
            if (filter === "all") return true;
            const tasks = roadmap.projects.flatMap((project) => project.tasks);
            const completed = tasks.filter((task) => task.completed).length;
            const isCompleted = tasks.length > 0 && completed === tasks.length;
            return filter === "completed" ? isCompleted : !isCompleted;
          })
          .map((item) => {
            const tasks = item.projects.flatMap((project) => project.tasks);
            const completedTasks = tasks.filter(
              (task) => task.completed,
            ).length;
            const progress = tasks.length
              ? Math.round((completedTasks / tasks.length) * 100)
              : 0;

            return (
              <div
                key={item.id}
                id={`roadmap-${item.id}`}
                className="scroll-mt-6 bg-[#12131a] border border-[#1f212d] hover:border-slate-700 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all group cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1f212d] text-slate-400">
                      Score {item.readinessScore}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      Created {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#1f212d]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 text-[11px] font-mono">
                      {completedTasks}/{tasks.length} tasks completed
                    </span>
                    <span className="text-blue-400 font-bold font-mono">
                      {progress}%
                    </span>
                  </div>

                  <div className="w-full bg-[#1f212d] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
      </div>
      {roadmaps.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">
          No roadmaps have been created for this account yet.
        </p>
      )}
    </div>
  );
}

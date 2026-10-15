"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getRoadmaps() {
      try {
        const data = await fetcher<Roadmap[]>("/roadmaps");
        setRoadmaps(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        console.error("Failed to load roadmaps:", err);
        setError(
          err instanceof Error ? err.message : "Unable to load roadmaps.",
        );
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

  async function handleDeleteRoadmap(roadmap: Roadmap) {
    const confirmed = window.confirm(
      `Delete "${roadmap.title}"? Its projects and tasks will also be permanently deleted. Any linked application will remain.`,
    );
    if (!confirmed) return;

    setDeletingId(roadmap.id);
    setError(null);
    try {
      await fetcher<{ id: string; deleted: boolean }>(
        `/roadmaps/${encodeURIComponent(roadmap.id)}`,
        { method: "DELETE" },
      );
      setRoadmaps((current) =>
        current.filter((item) => item.id !== roadmap.id),
      );
    } catch (deleteError: unknown) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete this roadmap.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="Career Roadmaps"
        description="Manage your tailored AI pathways, track role readiness, and delete generated plans you no longer need."
      >
        <GeneratorModal
          buttonLabel="Create learning roadmap"
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
                className="scroll-mt-6 bg-[#12131a] border border-[#1f212d] rounded-2xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1f212d] text-slate-400">
                      {item.title.startsWith("Proof Sprint:")
                        ? "Proof sprint · not scored"
                        : `Score ${item.readinessScore}`}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white text-sm">
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
                  <button
                    type="button"
                    onClick={() => void handleDeleteRoadmap(item)}
                    disabled={deletingId !== null}
                    aria-label={`Delete roadmap ${item.title}`}
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-rose-500/25 px-3 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="size-4" aria-hidden="true" />
                    )}
                    {deletingId === item.id ? "Deleting..." : "Delete roadmap"}
                  </button>
                </div>
              </div>
            );
          })}
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-rose-500/20 bg-rose-500/[0.05] p-3 text-sm text-rose-300">
          {error}
        </p>
      )}
      {roadmaps.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">
          No roadmaps have been created for this account yet.
        </p>
      )}
    </div>
  );
}

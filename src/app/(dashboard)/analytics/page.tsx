"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Loader2,
  Target,
  ListChecks,
} from "lucide-react";
import { fetcher } from "@/lib/api";
import { DashboardPageHeader } from "@/components/dashboard/page-header";

interface Roadmap {
  id: string;
  title: string;
  readinessScore: number;
  projects: {
    id: string;
    title: string;
    tasks: { id: string; completed: boolean }[];
  }[];
}

export default function AnalyticsPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoadmaps() {
      try {
        const data = await fetcher<Roadmap[]>("/roadmaps");
        setRoadmaps(Array.isArray(data) ? data : []);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load roadmap analytics.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadRoadmaps();
  }, []);

  const projects = roadmaps.flatMap((roadmap) =>
    roadmap.projects.map((project) => ({
      ...project,
      roadmapTitle: roadmap.title,
    })),
  );
  const tasks = projects.flatMap((project) => project.tasks);
  const completedTasks = tasks.filter((task) => task.completed).length;
  const completedRoadmaps = roadmaps.filter((roadmap) => {
    const roadmapTasks = roadmap.projects.flatMap((project) => project.tasks);
    return (
      roadmapTasks.length > 0 && roadmapTasks.every((task) => task.completed)
    );
  }).length;
  const averageReadiness = roadmaps.length
    ? Math.round(
        roadmaps.reduce((total, roadmap) => total + roadmap.readinessScore, 0) /
          roadmaps.length,
      )
    : null;

  const stats = [
    {
      label: "Roadmaps",
      value: String(roadmaps.length),
      icon: ClipboardList,
      color: "text-blue-400",
    },
    {
      label: "Completed Roadmaps",
      value: `${completedRoadmaps}/${roadmaps.length}`,
      icon: CheckCircle2,
      color: "text-emerald-400",
    },
    {
      label: "Tasks Completed",
      value: `${completedTasks}/${tasks.length}`,
      icon: ListChecks,
      color: "text-amber-400",
    },
    {
      label: "Average Readiness",
      value: averageReadiness === null ? "--" : `${averageReadiness}/100`,
      icon: Target,
      color: "text-rose-400",
    },
  ];

  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="Analytics & Insights"
        description="Progress calculated from your roadmaps and completed tasks."
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading your analytics...</span>
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-rose-400">
          {error}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-[#1f212d] bg-[#12131a] p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                      {item.label}
                    </span>
                    <Icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white">
                    {item.value}
                  </div>
                </div>
              );
            })}
          </div>

          <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-6">
            <div className="mb-5 border-b border-[#1f212d] pb-3">
              <h2 className="text-sm font-semibold text-white">
                Project Progress
              </h2>
            </div>
            {projects.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                Your project progress will appear here when you have a roadmap.
              </p>
            ) : (
              <div className="space-y-5">
                {projects.map((project) => {
                  const completed = project.tasks.filter(
                    (task) => task.completed,
                  ).length;
                  const progress = project.tasks.length
                    ? Math.round((completed / project.tasks.length) * 100)
                    : 0;

                  return (
                    <div
                      key={`${project.roadmapTitle}-${project.id}`}
                      className="space-y-2"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-xs font-medium text-slate-200">
                            {project.title}
                          </h3>
                          <p className="mt-1 truncate text-[10px] text-slate-500">
                            {project.roadmapTitle}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-mono text-slate-400">
                          {completed}/{project.tasks.length} · {progress}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#1f212d]">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

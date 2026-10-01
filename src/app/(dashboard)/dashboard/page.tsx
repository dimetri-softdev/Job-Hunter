"use client";

import React, { useState, useEffect } from "react";
import { ProjectCard } from "@/components/dashboard/project-card";
import { SavedRoadmaps } from "@/components/dashboard/saved-roadmaps";
import { GeneratorModal } from "@/components/dashboard/generator-modal";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import type { GeneratedRoadmap } from "@/components/RoadmapGenerator";
import { fetcher } from "@/lib/api";

export default function DashboardPage() {
  const [roadmaps, setRoadmaps] = useState<GeneratedRoadmap[]>([]);
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);
  const activeRoadmap =
    roadmaps.find((roadmap) => roadmap.id === activeRoadmapId) ?? null;

  useEffect(() => {
    async function loadRoadmaps() {
      try {
        const data = await fetcher<GeneratedRoadmap[]>("/roadmaps");
        const roadmapList = Array.isArray(data) ? data : [];
        setRoadmaps(roadmapList);
        setActiveRoadmapId(roadmapList[0]?.id ?? null);
      } catch (err) {
        console.error("Failed to load roadmaps:", err);
      }
    }

    loadRoadmaps();
  }, []);

  const handleRoadmapGenerated = (newRoadmap: GeneratedRoadmap) => {
    setRoadmaps((currentRoadmaps) => [
      newRoadmap,
      ...currentRoadmaps.filter((roadmap) => roadmap.id !== newRoadmap.id),
    ]);
    setActiveRoadmapId(newRoadmap.id);
  };

  const handleToggleTask = async (
    taskId: string,
    currentCompleted: boolean,
  ) => {
    if (!activeRoadmap) return;

    const nextCompleted = !currentCompleted;

    const updatedProjects = activeRoadmap.projects.map((project) => ({
      ...project,
      tasks: project.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: nextCompleted } : task,
      ),
    }));

    setRoadmaps((currentRoadmaps) =>
      currentRoadmaps.map((roadmap) =>
        roadmap.id === activeRoadmap.id
          ? { ...roadmap, projects: updatedProjects }
          : roadmap,
      ),
    );

    try {
      // Updated to toggle task status via FastAPI helper
      await fetcher(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: nextCompleted }),
      });
    } catch (err) {
      console.error("Failed to update task state:", err);
    }
  };

  const allTasks = activeRoadmap?.projects?.flatMap((p) => p.tasks) || [];
  const completedTasksCount = allTasks.filter((t) => t.completed).length;
  const totalTasksCount = allTasks.length;
  const progressPercentage =
    totalTasksCount > 0
      ? Math.round((completedTasksCount / totalTasksCount) * 100)
      : 0;

  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="Career Dashboard"
        description="Track your active skills roadmap, learning tracks, and project tasks."
      >
        <GeneratorModal
          buttonLabel="Generate New Roadmap"
          onRoadmapGenerated={handleRoadmapGenerated}
        />
      </DashboardPageHeader>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left / Active Roadmap Column */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#12131a] border border-[#1f212d] rounded-2xl p-5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Overall Progress
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-white">
                  {activeRoadmap ? `${progressPercentage}%` : "--"}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {activeRoadmap
                    ? `(${completedTasksCount}/${totalTasksCount} tasks completed)`
                    : "No roadmap selected"}
                </span>
              </div>
              <div className="w-full bg-[#1f212d] h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="bg-[#12131a] border border-[#1f212d] rounded-2xl p-5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Skill Readiness Score
              </span>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-3xl font-bold text-amber-400">
                  {activeRoadmap ? (
                    <>
                      {activeRoadmap.readinessScore}
                      <span className="text-sm text-slate-500 font-normal">
                        /100
                      </span>
                    </>
                  ) : (
                    "--"
                  )}
                </span>
                <span className="text-[10px] text-slate-500">
                  {activeRoadmap ? "Current roadmap" : "No roadmap selected"}
                </span>
              </div>
            </div>
          </div>

          {/* Active Projects List */}
          {activeRoadmap?.projects.length ? (
            activeRoadmap.projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                title={project.title}
                description={project.description}
                level={project.level}
                tasks={project.tasks}
                onToggleTask={handleToggleTask}
              />
            ))
          ) : activeRoadmap ? (
            <div className="p-12 text-center bg-[#12131a] border border-[#1f212d] rounded-2xl text-slate-500 text-sm">
              This roadmap has no project tasks yet.
            </div>
          ) : (
            <div className="p-12 text-center bg-[#12131a] border border-[#1f212d] rounded-2xl text-slate-500 text-sm">
              No active tasks found. Click <strong>Generate New Roadmap</strong>{" "}
              above to get started.
            </div>
          )}
        </div>

        {/* Right / Saved Roadmaps Sidebar Column */}
        <div className="col-span-12 xl:col-span-4">
          <SavedRoadmaps
            roadmaps={roadmaps}
            activeRoadmapId={activeRoadmapId}
            onSelect={setActiveRoadmapId}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { UserNav } from "@/components/dashboard/user-nav";
import { GeneratorForm } from "@/components/dashboard/generator-form";
import { ProjectCard } from "@/components/dashboard/project-card";
import { SavedRoadmaps } from "@/components/dashboard/saved-roadmaps";

interface Task {
  id: string;
  label: string;
  completed: boolean;
}

interface ProjectTrack {
  id: string;
  title: string;
  description: string;
  level: string;
  tasks: Task[];
}

interface Roadmap {
  id: string;
  title: string;
  readinessScore: number;
  projects: ProjectTrack[];
}

export default function DashboardPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);

  // Fetch initial roadmap on load
  useEffect(() => {
    async function loadRoadmaps() {
      try {
        const res = await fetch("/api/roadmap");

        if (!res.ok) {
          throw new Error(`API responded with status ${res.status}`);
        }

        const data = await res.json();
        if (data.success && data.roadmaps?.length > 0) {
          setRoadmaps(data.roadmaps);
          setActiveRoadmap(data.roadmaps[0]);
        }
      } catch (err) {
        console.error("Failed to load roadmaps:", err);
      }
    }

    loadRoadmaps();
  }, []);

  // Handler when a new roadmap is created
  const handleRoadmapGenerated = (newRoadmap: Roadmap) => {
    setActiveRoadmap(newRoadmap);
    setRoadmaps((prev) => [newRoadmap, ...prev]);
  };

  const handleToggleTask = async (
    taskId: string,
    currentCompleted: boolean,
  ) => {
    if (!activeRoadmap) return;

    const nextCompleted = !currentCompleted;

    // Optimistic UI Update
    const updatedProjects = activeRoadmap.projects.map((project) => ({
      ...project,
      tasks: project.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: nextCompleted } : task,
      ),
    }));

    setActiveRoadmap({
      ...activeRoadmap,
      projects: updatedProjects,
    });

    // Send API update
    try {
      await fetch("/api/task", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, completed: nextCompleted }),
      });
    } catch (err) {
      console.error("Failed to update task state:", err);
    }
  };

  // Safely handle missing or empty projects array
  // src/app/page.tsx
const allTasks = activeRoadmap?.projects?.flatMap((p) => p.tasks) || [];
  const completedTasksCount = allTasks.filter((t) => t.completed).length;
  const totalTasksCount = allTasks.length;
  const progressPercentage =
    totalTasksCount > 0
      ? Math.round((completedTasksCount / totalTasksCount) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-200 flex flex-col">
      <UserNav />

      <div className="flex-1 grid grid-cols-12 gap-6 p-6 max-w-[1800px] w-full mx-auto">
        {/* Left Column: Form Controls */}
        <aside className="col-span-12 lg:col-span-3">
          <GeneratorForm onRoadmapGenerated={handleRoadmapGenerated} />
        </aside>

        {/* Center Column: Overview Stats & Project Tracks */}
        <main className="col-span-12 lg:col-span-6 space-y-6">
          {/* Header Metric Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#12131a] border border-[#1f212d] rounded-2xl p-5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                Overall Progress
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-white">
                  {progressPercentage}%
                </span>
                <span className="text-xs text-slate-400">
                  {completedTasksCount} of {totalTasksCount} tasks
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
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                Skill Readiness Score
              </span>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-3xl font-bold text-amber-400">
                  {activeRoadmap?.readinessScore || 0}
                  <span className="text-sm text-slate-500 font-normal">
                    /100
                  </span>
                </span>
                <span className="text-[10px] px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-medium">
                  • Moderate Gap
                </span>
              </div>
            </div>
          </div>

          {/* Project Tracks */}
          {activeRoadmap?.projects && activeRoadmap.projects.length > 0 ? (
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
          ) : (
            <div className="p-8 text-center bg-[#12131a] border border-[#1f212d] rounded-2xl text-slate-500 text-sm">
              No project tracks loaded yet. Use the generator on the left to
              create your first roadmap!
            </div>
          )}
        </main>

        {/* Right Column: Saved Tracks */}
        <aside className="col-span-12 lg:col-span-3">
          <SavedRoadmaps />
        </aside>
      </div>
    </div>
  );
}

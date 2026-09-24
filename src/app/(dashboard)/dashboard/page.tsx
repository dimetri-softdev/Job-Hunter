"use client";

import React, { useState, useEffect } from "react";
import { ProjectCard } from "@/components/dashboard/project-card";
import { SavedRoadmaps } from "@/components/dashboard/saved-roadmaps";
import { GeneratorModal } from "@/components/dashboard/generator-modal";
import { fetcher } from "@/lib/api";

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

  useEffect(() => {
    async function loadRoadmaps() {
      try {
        const data = await fetcher<any>("/roadmaps");

        // Support both array and object responses
        const roadmapList = Array.isArray(data) ? data : data?.roadmaps || [];

        if (roadmapList.length > 0) {
          setRoadmaps(roadmapList);
          setActiveRoadmap(roadmapList[0]);
        }
      } catch (err) {
        console.error("Failed to load roadmaps:", err);
      }
    }

    loadRoadmaps();
  }, []);

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f212d]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Career Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your active skills roadmap, learning tracks, and project
            tasks.
          </p>
        </div>

        <GeneratorModal onRoadmapGenerated={handleRoadmapGenerated} />
      </div>

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
                  {progressPercentage}%
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({completedTasksCount}/{totalTasksCount} tasks completed)
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
                  {activeRoadmap?.readinessScore || 75}
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

          {/* Active Projects List */}
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
            <div className="p-12 text-center bg-[#12131a] border border-[#1f212d] rounded-2xl text-slate-500 text-sm">
              No active tasks found. Click <strong>Generate New Roadmap</strong>{" "}
              above to get started.
            </div>
          )}
        </div>

        {/* Right / Saved Roadmaps Sidebar Column */}
        <div className="col-span-12 xl:col-span-4">
          <SavedRoadmaps />
        </div>
      </div>
    </div>
  );
}

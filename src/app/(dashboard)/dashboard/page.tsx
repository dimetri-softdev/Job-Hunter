"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Loader2 } from "lucide-react";
import { ProjectCard } from "@/components/dashboard/project-card";
import { SavedRoadmaps } from "@/components/dashboard/saved-roadmaps";
import { GeneratorModal } from "@/components/dashboard/generator-modal";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import type { GeneratedRoadmap } from "@/components/RoadmapGenerator";
import { fetcher } from "@/lib/api";

interface ApplicationFollowUp {
  id: string;
  company: string;
  position: string;
  nextAction?: string | null;
  followUpAt?: string | null;
  fitAssessment?: object | null;
}

function getDaysUntilFollowUp(followUpAt?: string | null) {
  if (!followUpAt) return null;
  const followUpDate = new Date(`${followUpAt.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(followUpDate.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((followUpDate.getTime() - today.getTime()) / 86_400_000);
}

function getFollowUpLabel(daysUntil: number) {
  if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
  if (daysUntil === 0) return "Due today";
  if (daysUntil === 1) return "Due tomorrow";
  return `Due in ${daysUntil} days`;
}

export default function DashboardPage() {
  const [roadmaps, setRoadmaps] = useState<GeneratedRoadmap[]>([]);
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);
  const [roadmapsLoading, setRoadmapsLoading] = useState(true);
  const [roadmapsError, setRoadmapsError] = useState<string | null>(null);
  const [followUpApplications, setFollowUpApplications] = useState<
    ApplicationFollowUp[]
  >([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(true);
  const [followUpsError, setFollowUpsError] = useState<string | null>(null);
  const activeRoadmap =
    roadmaps.find((roadmap) => roadmap.id === activeRoadmapId) ?? null;

  useEffect(() => {
    async function loadRoadmaps() {
      try {
        const data = await fetcher<GeneratedRoadmap[]>("/roadmaps");
        if (!Array.isArray(data)) {
          throw new Error("Unexpected roadmaps response.");
        }
        setRoadmaps(data);
        setActiveRoadmapId(data[0]?.id ?? null);
      } catch (err) {
        console.error("Failed to load roadmaps:", err);
        setRoadmapsError(
          err instanceof Error ? err.message : "Unable to load roadmaps.",
        );
      } finally {
        setRoadmapsLoading(false);
      }
    }

    loadRoadmaps();
  }, []);

  useEffect(() => {
    async function loadFollowUps() {
      try {
        const data = await fetcher<ApplicationFollowUp[]>("/applications");
        if (!Array.isArray(data)) {
          throw new Error("Unexpected applications response.");
        }
        setFollowUpApplications(data);
      } catch (loadError) {
        setFollowUpsError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load application follow-ups.",
        );
      } finally {
        setFollowUpsLoading(false);
      }
    }

    loadFollowUps();
  }, []);

  const dueFollowUps = followUpApplications
    .flatMap((application) => {
      const daysUntil = getDaysUntilFollowUp(application.followUpAt);
      return daysUntil !== null && daysUntil <= 7
        ? [{ ...application, daysUntil }]
        : [];
    })
    .sort((left, right) => left.daysUntil - right.daysUntil);
  const overdueFollowUps = dueFollowUps.filter(
    (application) => application.daysUntil < 0,
  ).length;
  const upcomingFollowUps = dueFollowUps.filter(
    (application) => application.daysUntil >= 0,
  ).length;
  const gettingStartedSteps = [
    {
      title: "Save a job application",
      description: "Keep the role, company, and next step together.",
      href: "/applications",
      completed: followUpApplications.length > 0,
    },
    {
      title: "Check your job fit",
      description: "Review strengths, gaps, and questions for a role.",
      href: "/applications",
      completed: followUpApplications.some(
        (application) => Boolean(application.fitAssessment),
      ),
    },
    {
      title: "Build a learning roadmap",
      description: "Turn your career goals or fit gaps into a plan.",
      href: "/roadmaps",
      completed: roadmaps.length > 0,
    },
  ];
  const showGettingStarted =
    !roadmapsLoading &&
    !followUpsLoading &&
    !roadmapsError &&
    !followUpsError &&
    gettingStartedSteps.some((step) => !step.completed);

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

      {roadmapsError && (
        <p role="alert" className="text-xs text-rose-400">
          {roadmapsError}
        </p>
      )}

      {showGettingStarted && (
        <section
          aria-labelledby="getting-started-heading"
          className="space-y-4 rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-5"
        >
          <div>
            <h2
              id="getting-started-heading"
              className="text-sm font-semibold text-white"
            >
              Getting started
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Complete these steps to get more from JobHunter.
            </p>
          </div>
          <ol className="grid gap-3 md:grid-cols-3">
            {gettingStartedSteps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-xl border border-[#252836] bg-[#101119] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">
                    STEP {index + 1}
                  </span>
                  {step.completed && (
                    <CheckCircle2
                      aria-label="Completed"
                      className="h-4 w-4 text-emerald-400"
                    />
                  )}
                </div>
                <h3 className="mt-3 text-xs font-semibold text-slate-200">
                  {step.title}
                </h3>
                <p className="mt-1 min-h-8 text-[11px] leading-4 text-slate-500">
                  {step.description}
                </p>
                {!step.completed && (
                  <Link
                    href={step.href}
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-blue-300 hover:text-blue-200"
                  >
                    Get started
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section
        aria-labelledby="follow-ups-heading"
        className="space-y-4 rounded-2xl border border-[#1f212d] bg-[#12131a] p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="follow-ups-heading"
              className="text-sm font-semibold text-white"
            >
              Application follow-ups
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Overdue and due within the next 7 days
            </p>
          </div>
          <Link
            href="/applications"
            className="text-xs font-medium text-blue-300 hover:text-blue-200"
          >
            Manage applications
          </Link>
        </div>

        {followUpsLoading ? (
          <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading follow-ups...
          </div>
        ) : followUpsError ? (
          <p role="alert" className="text-xs text-rose-400">
            {followUpsError}
          </p>
        ) : dueFollowUps.length === 0 ? (
          <p className="py-3 text-xs text-slate-500">
            Nothing is due this week. Your scheduled follow-ups remain available
            in Applications.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-rose-300">
                {overdueFollowUps} overdue
              </span>
              <span className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-amber-200">
                {upcomingFollowUps} due this week
              </span>
            </div>
            <ul className="divide-y divide-[#1f212d]">
              {dueFollowUps.slice(0, 5).map((application) => (
                <li
                  key={application.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Link
                    href={`/applications#application-${application.id}`}
                    className="min-w-0 hover:text-blue-300"
                  >
                    <p className="truncate text-xs font-medium text-slate-200">
                      {application.company} · {application.position}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-slate-500">
                      {application.nextAction || "Follow up on this application"}
                    </p>
                  </Link>
                  <span
                    className={`shrink-0 text-[11px] ${
                      application.daysUntil < 0
                        ? "text-rose-300"
                        : application.daysUntil === 0
                          ? "text-amber-200"
                          : "text-slate-400"
                    }`}
                  >
                    {getFollowUpLabel(application.daysUntil)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

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

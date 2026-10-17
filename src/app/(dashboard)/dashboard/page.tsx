"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { CareerMomentum } from "@/components/dashboard/career-momentum";
import { DashboardSectionToggle } from "@/components/dashboard/dashboard-section-toggle";
import { FirstSteps } from "@/components/dashboard/first-steps";
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

interface CareerProfile {
  careerSummary?: string | null;
  skills?: string | null;
  workHistory?: string | null;
  education?: string | null;
  accomplishments?: string | null;
  experienceLevel?: string | null;
  targetRoles?: string | null;
  preferredLocation?: string | null;
}

const DASHBOARD_VISIBILITY_KEY = "jobhunter:dashboard-visibility:v1";

const DASHBOARD_SECTIONS = [
  "firstSteps",
  "careerMomentum",
  "followUps",
  "learningWorkspace",
] as const;

type DashboardSection = (typeof DASHBOARD_SECTIONS)[number];
type DashboardVisibility = Record<DashboardSection, boolean>;

const DEFAULT_DASHBOARD_VISIBILITY: DashboardVisibility = {
  firstSteps: true,
  careerMomentum: true,
  followUps: true,
  learningWorkspace: true,
};

function parseDashboardVisibility(value: unknown): DashboardVisibility {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Saved dashboard visibility is not a valid object.");
  }

  const saved = value as Record<string, unknown>;
  return DASHBOARD_SECTIONS.reduce(
    (visibility, section) => {
      const savedValue = saved[section];
      visibility[section] =
        typeof savedValue === "boolean"
          ? savedValue
          : DEFAULT_DASHBOARD_VISIBILITY[section];
      return visibility;
    },
    { ...DEFAULT_DASHBOARD_VISIBILITY },
  );
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
  const [careerProfileStarted, setCareerProfileStarted] = useState(false);
  const [careerProfileLoading, setCareerProfileLoading] = useState(true);
  const [careerProfileError, setCareerProfileError] = useState<string | null>(
    null,
  );
  const [dashboardVisibility, setDashboardVisibility] =
    useState<DashboardVisibility>(DEFAULT_DASHBOARD_VISIBILITY);
  const [visibilityLoaded, setVisibilityLoaded] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const activeRoadmap =
    roadmaps.find((roadmap) => roadmap.id === activeRoadmapId) ?? null;

  useEffect(() => {
    window.queueMicrotask(() => {
      try {
        const savedPreferences = window.localStorage.getItem(
          DASHBOARD_VISIBILITY_KEY,
        );
        if (savedPreferences) {
          setDashboardVisibility(
            parseDashboardVisibility(JSON.parse(savedPreferences)),
          );
        }
      } catch (loadError: unknown) {
        console.error(
          "Failed to load dashboard visibility preferences:",
          loadError,
        );
        setVisibilityError(
          "Saved section visibility could not be loaded. All sections are shown.",
        );
      } finally {
        setVisibilityLoaded(true);
      }
    });
  }, []);

  function saveDashboardVisibility(nextVisibility: DashboardVisibility) {
    try {
      window.localStorage.setItem(
        DASHBOARD_VISIBILITY_KEY,
        JSON.stringify(nextVisibility),
      );
      setVisibilityError(null);
    } catch (saveError: unknown) {
      console.error("Failed to save dashboard visibility preferences:", saveError);
      setVisibilityError(
        "Your visibility change is active for now but could not be saved.",
      );
    }
  }

  function toggleDashboardSection(section: DashboardSection) {
    const nextVisibility = {
      ...dashboardVisibility,
      [section]: !dashboardVisibility[section],
    };
    setDashboardVisibility(nextVisibility);
    saveDashboardVisibility(nextVisibility);
  }

  function setAllDashboardSections(visible: boolean) {
    const nextVisibility = DASHBOARD_SECTIONS.reduce(
      (next, section) => {
        next[section] = visible;
        return next;
      },
      { ...DEFAULT_DASHBOARD_VISIBILITY },
    );
    setDashboardVisibility(nextVisibility);
    saveDashboardVisibility(nextVisibility);
  }

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
    async function loadCareerProfile() {
      try {
        const data = await fetcher<CareerProfile>("/career-profile");
        if (!data || typeof data !== "object") {
          throw new Error("Unexpected career profile response.");
        }
        setCareerProfileStarted(
          [
            data.careerSummary,
            data.skills,
            data.workHistory,
            data.education,
            data.accomplishments,
            data.experienceLevel,
            data.targetRoles,
            data.preferredLocation,
          ].some((value) => Boolean(value?.trim())),
        );
      } catch (loadError) {
        setCareerProfileError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load career profile.",
        );
      } finally {
        setCareerProfileLoading(false);
      }
    }

    loadCareerProfile();
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
  const hasCompletedTask = roadmaps.some((roadmap) =>
    roadmap.projects.some((project) =>
      project.tasks.some((task) => task.completed),
    ),
  );
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
          buttonLabel="Create learning roadmap"
          onRoadmapGenerated={handleRoadmapGenerated}
        />
      </DashboardPageHeader>

      <section
        aria-label="Dashboard visibility controls"
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1f212d] bg-[#12131a] px-4 py-3"
      >
        <div>
          <h2 className="text-xs font-semibold text-slate-200">
            Dashboard sections
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Show or hide sections. Your choices are saved on this device.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAllDashboardSections(true)}
            disabled={
              !visibilityLoaded ||
              DASHBOARD_SECTIONS.every(
                (section) => dashboardVisibility[section],
              )
            }
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#303342] px-3 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Eye className="size-3.5" aria-hidden="true" />
            Show all
          </button>
          <button
            type="button"
            onClick={() => setAllDashboardSections(false)}
            disabled={
              !visibilityLoaded ||
              DASHBOARD_SECTIONS.every(
                (section) => !dashboardVisibility[section],
              )
            }
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#303342] px-3 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <EyeOff className="size-3.5" aria-hidden="true" />
            Hide all
          </button>
        </div>
      </section>

      {visibilityError && (
        <p role="status" className="text-xs text-amber-300">
          {visibilityError}
        </p>
      )}

      {roadmapsError && (
        <p role="alert" className="text-xs text-rose-400">
          {roadmapsError}
        </p>
      )}

      {careerProfileError && (
        <p role="alert" className="text-xs text-rose-400">
          Unable to load your first-step checklist: {careerProfileError}
        </p>
      )}

      {!roadmapsLoading &&
        !followUpsLoading &&
        !careerProfileLoading &&
        !roadmapsError &&
        !followUpsError &&
        !careerProfileError && (
          <FirstSteps
            completed={[
              careerProfileStarted,
              followUpApplications.length > 0,
              roadmaps.length > 0,
              hasCompletedTask,
            ]}
            collapsed={!dashboardVisibility.firstSteps}
            onToggle={() => toggleDashboardSection("firstSteps")}
            disabled={!visibilityLoaded}
          />
        )}

      {!roadmapsLoading &&
        !followUpsLoading &&
        !roadmapsError &&
        !followUpsError && (
          <CareerMomentum
            applications={followUpApplications}
            roadmaps={roadmaps}
            collapsed={!dashboardVisibility.careerMomentum}
            onToggle={() => toggleDashboardSection("careerMomentum")}
            disabled={!visibilityLoaded}
          />
        )}

      <section
        aria-labelledby="follow-ups-heading"
        className="rounded-2xl border border-[#1f212d] bg-[#12131a] p-5"
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
          <div className="flex items-center gap-3">
            <Link
              href="/applications"
              className="text-xs font-medium text-blue-300 hover:text-blue-200"
            >
              Manage applications
            </Link>
            <DashboardSectionToggle
              collapsed={!dashboardVisibility.followUps}
              onToggle={() => toggleDashboardSection("followUps")}
              sectionLabel="application follow-ups"
              disabled={!visibilityLoaded}
            />
          </div>
        </div>

        {dashboardVisibility.followUps && (
          <div className="mt-4 space-y-4">
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
                Nothing is due this week. Your scheduled follow-ups remain
                available in Applications.
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
                          {application.nextAction ||
                            "Follow up on this application"}
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
          </div>
        )}
      </section>

      <section
        aria-labelledby="learning-workspace-heading"
        className="overflow-hidden rounded-2xl border border-[#1f212d] bg-[#12131a]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1f212d] px-5 py-4">
          <div>
            <h2
              id="learning-workspace-heading"
              className="text-sm font-semibold text-white"
            >
              Learning workspace
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Roadmap progress, active projects, and saved learning plans
            </p>
          </div>
          <DashboardSectionToggle
            collapsed={!dashboardVisibility.learningWorkspace}
            onToggle={() => toggleDashboardSection("learningWorkspace")}
            sectionLabel="learning workspace"
            disabled={!visibilityLoaded}
          />
        </div>

        {dashboardVisibility.learningWorkspace && (
          <div className="grid grid-cols-12 items-start gap-6 p-5">
            <div
              id="active-roadmap"
              className="col-span-12 space-y-6 xl:col-span-8"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#1f212d] bg-[#12131a] p-5">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Overall Progress
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">
                      {activeRoadmap ? `${progressPercentage}%` : "--"}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {activeRoadmap
                        ? `(${completedTasksCount}/${totalTasksCount} tasks completed)`
                        : "No roadmap selected"}
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#1f212d]">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#1f212d] bg-[#12131a] p-5">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Skill Readiness Score
                  </span>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-3xl font-bold text-amber-400">
                      {activeRoadmap ? (
                        activeRoadmap.title.startsWith("Proof Sprint:") ? (
                          <span className="text-sm font-normal text-slate-400">
                            Not scored
                          </span>
                        ) : (
                          <>
                            {activeRoadmap.readinessScore}
                            <span className="text-sm font-normal text-slate-500">
                              /100
                            </span>
                          </>
                        )
                      ) : (
                        "--"
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {activeRoadmap
                        ? activeRoadmap.title.startsWith("Proof Sprint:")
                          ? "Proof sprint"
                          : "Current roadmap"
                        : "No roadmap selected"}
                    </span>
                  </div>
                </div>
              </div>

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
                <div className="rounded-2xl border border-[#1f212d] bg-[#12131a] p-12 text-center text-sm text-slate-500">
                  This roadmap has no project tasks yet.
                </div>
              ) : (
                <div className="rounded-2xl border border-[#1f212d] bg-[#12131a] p-12 text-center text-sm text-slate-500">
                  No active tasks found. Click{" "}
                  <strong>Create learning roadmap</strong> above to get
                  started.
                </div>
              )}
            </div>

            <div className="col-span-12 xl:col-span-4">
              <SavedRoadmaps
                roadmaps={roadmaps}
                activeRoadmapId={activeRoadmapId}
                onSelect={setActiveRoadmapId}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

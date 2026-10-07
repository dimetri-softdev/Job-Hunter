"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  Loader2,
  Target,
  ListChecks,
} from "lucide-react";
import { fetcher } from "@/lib/api";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { OfferTradeoffSimulator } from "@/components/dashboard/offer-tradeoff-simulator";
import type {
  FitAssessment,
  FitVerdict,
  OfferDetails,
} from "@/lib/application-types";

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

interface ApplicationOutcome {
  id: string;
  company: string;
  position: string;
  status: string;
  fitAssessment?: FitAssessment | null;
  offerDetails?: OfferDetails | null;
}

const SUBMITTED_STATUSES = new Set([
  "APPLIED",
  "PHONE_SCREEN",
  "INTERVIEWING",
  "OFFERED",
  "REJECTED",
]);

const PROGRESSED_STATUSES = new Set([
  "PHONE_SCREEN",
  "INTERVIEWING",
  "OFFERED",
]);

const FIT_VERDICTS: { value: FitVerdict; label: string }[] = [
  { value: "STRONG_MATCH", label: "Strong match" },
  { value: "POSSIBLE_MATCH", label: "Possible match" },
  { value: "STRETCH", label: "Stretch" },
  { value: "LOW_MATCH", label: "Low match" },
  { value: "INSUFFICIENT_INFO", label: "Insufficient info" },
];

export default function AnalyticsPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationOutcome[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState<string | null>(
    null,
  );

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

  useEffect(() => {
    async function loadApplications() {
      try {
        const data = await fetcher<ApplicationOutcome[]>("/applications");
        if (!Array.isArray(data)) {
          throw new Error("Unexpected applications response.");
        }
        setApplications(data);
      } catch (loadError) {
        setApplicationsError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load your application outcomes.",
        );
      } finally {
        setApplicationsLoading(false);
      }
    }

    loadApplications();
  }, []);

  const submittedAssessments = applications.filter(
    (application) =>
      application.fitAssessment &&
      SUBMITTED_STATUSES.has(application.status),
  );
  const fitOutcomeRows = FIT_VERDICTS.map((verdict) => {
    const matchingApplications = submittedAssessments.filter(
      (application) => application.fitAssessment?.verdict === verdict.value,
    );
    const progressed = matchingApplications.filter((application) =>
      PROGRESSED_STATUSES.has(application.status),
    ).length;
    return {
      ...verdict,
      submitted: matchingApplications.length,
      progressed,
      rate: matchingApplications.length
        ? Math.round((progressed / matchingApplications.length) * 100)
        : 0,
    };
  })
    .filter((row) => row.submitted > 0)
    .sort((left, right) => right.rate - left.rate);
  const establishedFitPatterns = fitOutcomeRows.filter(
    (row) => row.submitted >= 3,
  );

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
  const readinessRoadmaps = roadmaps.filter(
    (roadmap) => !roadmap.title.startsWith("Proof Sprint:"),
  );
  const averageReadiness = readinessRoadmaps.length
    ? Math.round(
        readinessRoadmaps.reduce(
          (total, roadmap) => total + roadmap.readinessScore,
          0,
        ) / readinessRoadmaps.length,
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
        description="See your roadmap progress and learn from your own application outcomes."
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

          <section className="space-y-5 rounded-xl border border-[#1f212d] bg-[#12131a] p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#1f212d] pb-3">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Your job-search playbook
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  How your saved fit assessments relate to your application
                  progress.
                </p>
              </div>
              <Link
                href="/applications"
                className="text-xs font-medium text-blue-300 hover:text-blue-200"
              >
                View applications
              </Link>
            </div>

            {applicationsLoading ? (
              <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading your application history...
              </div>
            ) : applicationsError ? (
              <p role="alert" className="text-xs text-rose-400">
                {applicationsError}
              </p>
            ) : fitOutcomeRows.length === 0 ? (
              <p className="py-3 text-xs leading-5 text-slate-400">
                As you save fit assessments and move applications beyond Saved,
                this will show which fit categories have reached a phone screen,
                interview, or offer in your own history.
              </p>
            ) : (
              <>
                <p className="text-[11px] leading-5 text-slate-500">
                  Progress means reaching phone screen, interviewing, or offered.
                  Saved and withdrawn roles are excluded. These are patterns in
                  your tracker, not proof that a fit score caused an outcome.
                </p>
                {establishedFitPatterns.length > 0 && (
                  <p className="rounded-lg border border-blue-500/20 bg-blue-500/[0.04] px-3 py-2 text-xs leading-5 text-blue-100">
                    So far, your highest observed progression is for{" "}
                    <strong>{establishedFitPatterns[0].label}</strong> roles:{" "}
                    {establishedFitPatterns[0].progressed}/
                    {establishedFitPatterns[0].submitted} reached a phone
                    screen, interview, or offer. This is a personal pattern,
                    not a guarantee.
                  </p>
                )}
                <div className="space-y-4">
                  {fitOutcomeRows.map((row) => (
                    <div key={row.value} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-medium text-slate-200">
                          {row.label}
                        </span>
                        <span className="shrink-0 font-mono text-slate-400">
                          {row.progressed}/{row.submitted} progressed ·{" "}
                          {row.rate}%
                          {row.submitted < 3 && " · early signal"}
                        </span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-full bg-[#1f212d]"
                        role="img"
                        aria-label={`${row.label}: ${row.progressed} of ${row.submitted} progressed`}
                      >
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${row.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <OfferTradeoffSimulator
            applications={applications}
            loading={applicationsLoading}
            error={applicationsError}
            onOfferDetailsSaved={(applicationId, offerDetails) => {
              setApplications((current) =>
                current.map((application) =>
                  application.id === applicationId
                    ? { ...application, offerDetails }
                    : application,
                ),
              );
            }}
          />

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

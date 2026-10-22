"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
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
  ApplicationSource,
  FitAssessment,
  FitVerdict,
  OfferDetails,
} from "@/lib/application-types";
import { APPLICATION_SOURCES } from "@/lib/application-types";

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
  createdAt: string;
  source?: ApplicationSource | null;
  followUpAt?: string | null;
  fitAssessment?: FitAssessment | null;
  offerDetails?: OfferDetails | null;
}

const APPLICATION_STAGES = [
  { value: "SAVED", label: "Saved" },
  { value: "APPLIED", label: "Applied" },
  { value: "PHONE_SCREEN", label: "Phone screen" },
  { value: "INTERVIEWING", label: "Interviewing" },
  { value: "OFFERED", label: "Offered" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

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

  const activeApplications = applications.filter((application) =>
    ["SAVED", "APPLIED", "PHONE_SCREEN", "INTERVIEWING"].includes(
      application.status,
    ),
  );
  const interviewStageApplications = applications.filter((application) =>
    ["PHONE_SCREEN", "INTERVIEWING"].includes(application.status),
  );
  const offeredApplications = applications.filter(
    (application) => application.status === "OFFERED",
  );
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentlyAddedApplications = applications.filter((application) => {
    const createdAt = new Date(application.createdAt);
    return (
      !Number.isNaN(createdAt.getTime()) &&
      createdAt >= thirtyDaysAgo &&
      createdAt <= new Date()
    );
  }).length;
  const stageCounts = APPLICATION_STAGES.map((stage) => ({
    ...stage,
    count: applications.filter(
      (application) => application.status === stage.value,
    ).length,
  }));
  const maximumStageCount = Math.max(1, ...stageCounts.map((stage) => stage.count));
  const sourceCounts = APPLICATION_SOURCES.map((source) => ({
    source,
    count: applications.filter((application) => application.source === source)
      .length,
  }))
    .filter((item) => item.count > 0)
    .sort((left, right) => right.count - left.count);
  const sourceProgressRows = APPLICATION_SOURCES.map((source) => {
    const submitted = applications.filter(
      (application) =>
        application.source === source &&
        SUBMITTED_STATUSES.has(application.status),
    );
    const progressed = submitted.filter((application) =>
      PROGRESSED_STATUSES.has(application.status),
    ).length;
    return {
      source,
      submitted: submitted.length,
      progressed,
      rate: submitted.length
        ? Math.round((progressed / submitted.length) * 100)
        : 0,
    };
  })
    .filter((item) => item.submitted > 0)
    .sort(
      (left, right) =>
        right.rate - left.rate || right.submitted - left.submitted,
    );
  const maximumSourceCount = Math.max(
    1,
    ...sourceCounts.map((item) => item.count),
  );
  const applicationsWithoutSource = applications.filter(
    (application) => !application.source,
  ).length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followUpsNeedingAttention = applications
    .flatMap((application) => {
      if (!application.followUpAt) return [];
      const followUpDate = new Date(
        `${application.followUpAt.slice(0, 10)}T00:00:00`,
      );
      if (Number.isNaN(followUpDate.getTime())) return [];
      const daysUntil = Math.round(
        (followUpDate.getTime() - today.getTime()) / 86_400_000,
      );
      return daysUntil <= 7
        ? [{ ...application, followUpDate, daysUntil }]
        : [];
    })
    .sort((left, right) => left.followUpDate.getTime() - right.followUpDate.getTime())
    .slice(0, 5);

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
        description="Spot patterns in your application pipeline, follow-ups, and roadmap progress."
      />

      <section className="space-y-5 rounded-xl border border-[#1f212d] bg-[#12131a] p-6">
        <div className="border-b border-[#1f212d] pb-3">
          <h2 className="text-sm font-semibold text-white">
            Job-search pulse
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            A snapshot of your current tracker stages and upcoming follow-ups.
          </p>
        </div>
        {applicationsLoading ? (
          <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your job-search pulse...
          </div>
        ) : applicationsError ? (
          <p role="alert" className="text-xs text-rose-400">
            {applicationsError}
          </p>
        ) : applications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#2b2e3b] px-4 py-6 text-center">
            <BriefcaseBusiness className="mx-auto h-5 w-5 text-slate-500" />
            <p className="mt-2 text-xs text-slate-300">
              Add or import applications to see your pipeline and follow-up
              insights here.
            </p>
            <Link
              href="/applications"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-300 hover:text-blue-200"
            >
              Open applications <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Active pipeline",
                  value: activeApplications.length,
                  detail: "Saved, applied, and interview stages",
                  icon: BriefcaseBusiness,
                },
                {
                  label: "At interview stage",
                  value: interviewStageApplications.length,
                  detail: "Phone screens and interviews",
                  icon: CalendarDays,
                },
                {
                  label: "Offers",
                  value: offeredApplications.length,
                  detail: "Currently marked as offered",
                  icon: CheckCircle2,
                },
                {
                  label: "Added in 30 days",
                  value: recentlyAddedApplications,
                  detail: "Roles added to your tracker",
                  icon: ClipboardList,
                },
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className="rounded-lg border border-[#1f212d] bg-[#0d0e14] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {metric.label}
                      </span>
                      <Icon className="h-4 w-4 text-blue-300" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {metric.detail}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">
                    Current pipeline
                  </h3>
                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    Each application is counted once at its current tracker
                    stage; these are not historical conversion rates.
                  </p>
                </div>
                {stageCounts.some((stage) => stage.count > 0) ? (
                  <div className="space-y-3">
                    {stageCounts
                      .filter((stage) => stage.count > 0)
                      .map((stage) => (
                        <div key={stage.value} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-300">{stage.label}</span>
                            <span className="font-mono text-slate-400">
                              {stage.count}
                            </span>
                          </div>
                          <div
                            className="h-1.5 overflow-hidden rounded-full bg-[#1f212d]"
                            role="img"
                            aria-label={`${stage.label}: ${stage.count} applications`}
                          >
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{
                                width: `${(stage.count / maximumStageCount) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No applications have a recognized tracker status yet.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">
                    Follow-ups to review
                  </h3>
                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    Overdue reminders and follow-ups due in the next 7 days.
                  </p>
                </div>
                {followUpsNeedingAttention.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[#2b2e3b] px-3 py-4 text-xs text-slate-500">
                    No overdue or upcoming follow-ups. Add a follow-up date to
                    an application to see it here.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {followUpsNeedingAttention.map((application) => (
                      <li key={application.id}>
                        <Link
                          href={`/applications#${encodeURIComponent(application.id)}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-[#1f212d] bg-[#0d0e14] px-3 py-2.5 transition hover:border-blue-500/30"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-medium text-slate-200">
                              {application.position} · {application.company}
                            </span>
                            <span className="mt-1 block text-[10px] text-slate-500">
                              {application.followUpDate.toLocaleDateString()}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 text-[10px] font-medium ${
                              application.daysUntil < 0
                                ? "text-rose-300"
                                : application.daysUntil === 0
                                  ? "text-amber-300"
                                  : "text-slate-400"
                            }`}
                          >
                            {application.daysUntil < 0
                              ? `${Math.abs(application.daysUntil)}d overdue`
                              : application.daysUntil === 0
                                ? "Due today"
                                : `In ${application.daysUntil}d`}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {followUpsNeedingAttention.length > 0 && (
                  <Link
                    href="/applications"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-300 hover:text-blue-200"
                  >
                    Review all applications{" "}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>

            <div className="border-t border-[#1f212d] pt-5">
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-slate-200">
                  Where roles came from
                </h3>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                  A count of the sources you chose to record, not a measure of
                  hiring success.
                </p>
              </div>
              {sourceCounts.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Record a source on an application to start seeing your search
                  mix here.
                </p>
              ) : (
                <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {sourceCounts.map((item) => (
                    <div key={item.source} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300">{item.source}</span>
                        <span className="font-mono text-slate-400">
                          {item.count}
                        </span>
                      </div>
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-[#1f212d]"
                        role="img"
                        aria-label={`${item.source}: ${item.count} applications`}
                      >
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{
                            width: `${(item.count / maximumSourceCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {applicationsWithoutSource > 0 && (
                <p className="mt-3 text-[10px] text-slate-500">
                  {applicationsWithoutSource}{" "}
                  {applicationsWithoutSource === 1 ? "role has" : "roles have"}{" "}
                  no source recorded.
                </p>
              )}
              <div className="mt-6 border-t border-[#1f212d] pt-5">
                <h3 className="text-xs font-semibold text-slate-200">
                  Source progression signals
                </h3>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                  Of submitted applications, how many are currently at phone
                  screen, interview, or offer stage. This is a small-sample
                  snapshot, not proof that a source caused an outcome.
                </p>
                {sourceProgressRows.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Add a source to submitted applications to compare these
                    early signals.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {sourceProgressRows.map((row) => (
                      <div key={row.source} className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="text-slate-300">{row.source}</span>
                          <span className="font-mono text-slate-400">
                            {row.progressed}/{row.submitted} progressed ·{" "}
                            {row.rate}%
                            {row.submitted < 3 ? " · early signal" : ""}
                          </span>
                        </div>
                        <div
                          className="h-1.5 overflow-hidden rounded-full bg-[#1f212d]"
                          role="img"
                          aria-label={`${row.source}: ${row.progressed} of ${row.submitted} submitted applications progressed`}
                        >
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${row.rate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>

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

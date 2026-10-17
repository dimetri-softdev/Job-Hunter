import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  BriefcaseBusiness,
  Check,
  FileCheck2,
  Map,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import type { GeneratedRoadmap } from "@/components/RoadmapGenerator";
import { DashboardSectionToggle } from "@/components/dashboard/dashboard-section-toggle";

interface CareerApplication {
  fitAssessment?: object | null;
}

const milestoneStyles = {
  emerald: {
    icon: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    unlocked: "border-emerald-500/25 bg-emerald-500/[0.04]",
  },
  blue: {
    icon: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    unlocked: "border-blue-500/25 bg-blue-500/[0.04]",
  },
  violet: {
    icon: "border-violet-500/20 bg-violet-500/10 text-violet-300",
    unlocked: "border-violet-500/25 bg-violet-500/[0.04]",
  },
  amber: {
    icon: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    unlocked: "border-amber-500/25 bg-amber-500/[0.04]",
  },
  fuchsia: {
    icon: "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300",
    unlocked: "border-fuchsia-500/25 bg-fuchsia-500/[0.04]",
  },
} as const;

export function CareerMomentum({
  applications,
  roadmaps,
  collapsed,
  onToggle,
  disabled,
}: {
  applications: CareerApplication[];
  roadmaps: GeneratedRoadmap[];
  collapsed: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const tasks = roadmaps.flatMap((roadmap) =>
    roadmap.projects.flatMap((project) => project.tasks),
  );
  const finishedProofSprint = roadmaps.some((roadmap) => {
    if (!roadmap.title.startsWith("Proof Sprint:")) return false;
    const sprintTasks = roadmap.projects.flatMap((project) => project.tasks);
    return sprintTasks.length > 0 && sprintTasks.every((task) => task.completed);
  });
  const milestones = [
    {
      title: "First role tracked",
      description: "You’ve started organizing your search.",
      earned: applications.length > 0,
      href: "/applications",
      action: "Track a role",
      icon: BriefcaseBusiness,
      style: milestoneStyles.emerald,
    },
    {
      title: "Fit checked",
      description: "You compared your experience with a role.",
      earned: applications.some((application) =>
        Boolean(application.fitAssessment),
      ),
      href: "/applications",
      action: "Check job fit",
      icon: Target,
      style: milestoneStyles.blue,
    },
    {
      title: "A plan in place",
      description: "You turned a career goal into a learning plan.",
      earned: roadmaps.length > 0,
      href: "/roadmaps",
      action: "Build a roadmap",
      icon: Map,
      style: milestoneStyles.violet,
    },
    {
      title: "First task done",
      description: "You’ve made progress on a skill-building task.",
      earned: tasks.some((task) => task.completed),
      href: "/dashboard",
      action: "Complete a task",
      icon: FileCheck2,
      style: milestoneStyles.amber,
    },
    {
      title: "Proof sprint complete",
      description: "You finished the tasks in a proof sprint.",
      earned: finishedProofSprint,
      href: "/applications",
      action: "Build proof",
      icon: Trophy,
      style: milestoneStyles.fuchsia,
    },
  ];
  const earnedCount = milestones.filter((milestone) => milestone.earned).length;
  const nextMilestone = milestones.find((milestone) => !milestone.earned);

  return (
    <section
      aria-labelledby="career-momentum-heading"
      className="overflow-hidden rounded-2xl border border-[#252836] bg-[#12131a]"
    >
      <div className="border-b border-[#1f212d] bg-gradient-to-r from-blue-500/[0.08] via-transparent to-violet-500/[0.06] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-300">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2
                id="career-momentum-heading"
                className="text-sm font-semibold text-white"
              >
                Career momentum
              </h2>
              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">
                Celebrate the progress you control: learning, preparation, and
                turning plans into proof. No streaks, no application quotas.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-[#303342] bg-[#0d0e14]/80 px-3 py-1.5">
            <Award className="size-4 text-amber-300" />
            <span className="text-xs font-semibold text-slate-200">
              {earnedCount} of {milestones.length} milestones
            </span>
          </div>
          <DashboardSectionToggle
            collapsed={collapsed}
            onToggle={onToggle}
            sectionLabel="career momentum"
            disabled={disabled}
          />
        </div>
        {!collapsed && (
          <div
            className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#252836]"
            role="progressbar"
            aria-label="Career milestones"
            aria-valuemin={0}
            aria-valuemax={milestones.length}
            aria-valuenow={earnedCount}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-400 transition-all duration-500"
              style={{ width: `${(earnedCount / milestones.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="grid gap-2.5 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 2xl:grid-cols-5">
        {milestones.map((milestone) => {
          const Icon = milestone.icon;
          return (
            <div
              key={milestone.title}
              className={`flex min-h-32 flex-col rounded-xl border p-3.5 transition-colors ${
                milestone.earned
                  ? milestone.style.unlocked
                  : "border-[#252836] bg-[#0d0e14]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`flex size-8 items-center justify-center rounded-lg border ${milestone.style.icon}`}
                >
                  <Icon className="size-4" />
                </span>
                {milestone.earned ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-300">
                    <Check className="size-3.5" />
                    Earned
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500">
                    Milestone
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-xs font-semibold text-slate-100">
                {milestone.title}
              </h3>
              <p className="mt-1 flex-1 text-[11px] leading-4 text-slate-500">
                {milestone.description}
              </p>
              {!milestone.earned && (
                <Link
                  href={milestone.href}
                  className="mt-3 inline-flex w-fit items-center gap-1 text-[11px] font-medium text-blue-300 transition-colors hover:text-blue-200"
                >
                  {milestone.action}
                  <ArrowUpRight className="size-3" />
                </Link>
              )}
            </div>
          );
        })}
        </div>
      )}

      {!collapsed && nextMilestone ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1f212d] px-5 py-3.5 sm:px-6">
          <p className="text-xs text-slate-400">
            <span className="font-medium text-slate-200">Up next:</span>{" "}
            {nextMilestone.title} — one step at a time.
          </p>
          <Link
            href={nextMilestone.href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-300 transition-colors hover:text-blue-200"
          >
            {nextMilestone.action}
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      ) : !collapsed ? (
        <p className="border-t border-[#1f212d] px-5 py-3.5 text-xs text-slate-400 sm:px-6">
          You’ve reached every milestone. Keep building at your own pace.
        </p>
      ) : null}
    </section>
  );
}

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CircleUserRound,
  Map,
  Sparkles,
} from "lucide-react";

const steps = [
  {
    title: "Add your career details",
    description: "Share your skills and the roles you want to explore.",
    href: "/settings",
    action: "Set up your profile",
    icon: CircleUserRound,
  },
  {
    title: "Track a job you like",
    description: "Keep the role, application status, and next step together.",
    href: "/applications",
    action: "Open applications",
    icon: BriefcaseBusiness,
  },
  {
    title: "Make a learning plan",
    description: "Turn a target role into practical projects and tasks.",
    href: "/roadmaps",
    action: "Explore roadmaps",
    icon: Map,
  },
  {
    title: "Complete one small task",
    description: "Build momentum at your own pace—there are no quotas.",
    href: "/dashboard#active-roadmap",
    action: "Choose a task",
    icon: Check,
  },
] as const;

export function FirstSteps({
  completed,
}: {
  completed: boolean[];
}) {
  const completedCount = completed.filter(Boolean).length;
  const nextStepIndex = completed.findIndex((isComplete) => !isComplete);

  if (nextStepIndex === -1) return null;

  return (
    <section
      aria-labelledby="first-steps-heading"
      className="overflow-hidden rounded-2xl border border-blue-500/20 bg-[#12131a]"
    >
      <div className="border-b border-[#1f212d] bg-gradient-to-r from-blue-500/[0.08] via-transparent to-violet-500/[0.05] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-300">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="first-steps-heading"
                className="text-sm font-semibold text-white"
              >
                Your first steps
              </h2>
              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">
                A simple path to get started. Skip anything that is not useful
                right now and come back whenever you like.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-[#303342] bg-[#0d0e14]/80 px-3 py-1.5 text-xs font-medium text-slate-300">
            {completedCount} of {steps.length} complete
          </span>
        </div>
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#252836]"
          role="progressbar"
          aria-label="First steps progress"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={completedCount}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-400 transition-all"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ol className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isComplete = completed[index];
          const isNext = index === nextStepIndex;

          return (
            <li
              key={step.title}
              className={`flex min-h-36 flex-col rounded-xl border p-3.5 ${
                isNext
                  ? "border-blue-500/30 bg-blue-500/[0.05]"
                  : isComplete
                    ? "border-emerald-500/20 bg-emerald-500/[0.035]"
                    : "border-[#252836] bg-[#0d0e14]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`flex size-8 items-center justify-center rounded-lg border ${
                    isComplete
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-[#303342] bg-[#151720] text-slate-400"
                  }`}
                >
                  {isComplete ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Icon className="size-4" aria-hidden="true" />
                  )}
                </span>
                <span
                  className={`text-[10px] font-medium ${
                    isComplete
                      ? "text-emerald-300"
                      : isNext
                        ? "text-blue-300"
                        : "text-slate-500"
                  }`}
                >
                  {isComplete ? "Complete" : isNext ? "Next step" : `Step ${index + 1}`}
                </span>
              </div>
              <h3 className="mt-3 text-xs font-semibold text-slate-100">
                {step.title}
              </h3>
              <p className="mt-1 flex-1 text-[11px] leading-4 text-slate-500">
                {step.description}
              </p>
              {!isComplete && (
                <Link
                  href={step.href}
                  className={`mt-3 inline-flex w-fit items-center gap-1 text-[11px] font-semibold ${
                    isNext
                      ? "text-blue-300 hover:text-blue-200"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {step.action}
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

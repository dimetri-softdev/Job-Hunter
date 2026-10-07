import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Compass,
  FileSearch,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";

export const metadata = {
  title: "JobHunter | Make your next career move with clarity",
  description:
    "Assess job fit, organize applications, build evidence for skill gaps, and compare offers in one focused job-search workspace.",
};

const features = [
  {
    icon: Target,
    title: "Understand the match",
    description:
      "Compare your experience with a job description and review relevant evidence, gaps, and questions to check.",
    tone: "text-blue-300",
    border: "border-blue-400/30",
  },
  {
    icon: BriefcaseBusiness,
    title: "Keep your search together",
    description:
      "Track opportunities, follow-ups, saved fit assessments, and related learning plans in one place.",
    tone: "text-sky-300",
    border: "border-sky-400/30",
  },
  {
    icon: ListChecks,
    title: "Turn gaps into proof",
    description:
      "Create focused proof sprints for a skill gap and attach project evidence to your roadmap.",
    tone: "text-amber-200",
    border: "border-amber-300/30",
  },
  {
    icon: Compass,
    title: "Make decisions your way",
    description:
      "Learn from patterns in your own search and compare offers using the factors you value.",
    tone: "text-emerald-300",
    border: "border-emerald-400/30",
  },
];

const steps = [
  {
    number: "01",
    title: "Set your direction",
    body: "Add your experience, skills, target roles, and preferences to your career profile.",
  },
  {
    number: "02",
    title: "Review each opportunity",
    body: "Assess fit, record your next step, and keep application details organized.",
  },
  {
    number: "03",
    title: "Build momentum",
    body: "Work on a focused project, keep evidence of your progress, and reflect on what is working.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#090a0f] text-slate-100">
      <PublicSiteHeader />
      <section className="relative isolate border-b border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 -z-10 size-[34rem] rounded-full bg-blue-600/10 blur-3xl"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-16 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/[0.06] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200">
              <Sparkles className="size-3.5" aria-hidden="true" />
              A clearer job search starts here
            </p>
            <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Make your next career move with{" "}
              <span className="text-blue-300">more clarity.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Understand where your experience fits, keep applications moving,
              and turn skill gaps into practical next steps—all in one
              workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
              >
                Get started <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/guide"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/15 px-5 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
              >
                See how it works
                <ArrowDown className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="size-4 shrink-0 text-emerald-300" aria-hidden="true" />
              AI features ask for your consent. You stay in control of every decision.
            </p>
          </div>

          <div
            aria-label="Illustrative preview of the JobHunter workspace"
            className="relative mx-auto w-full max-w-xl"
          >
            <div className="absolute -inset-4 rounded-[2rem] bg-blue-500/[0.06] blur-2xl" />
            <div className="relative rounded-2xl border border-white/10 bg-[#11131b] p-4 shadow-2xl shadow-black/40 sm:p-6">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    YOUR SEARCH WORKSPACE
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    One thoughtful step at a time
                  </p>
                </div>
                <span className="flex size-9 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
                  <Sparkles className="size-4" aria-hidden="true" />
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-blue-400/15 bg-blue-500/[0.05] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#202538] text-blue-200">
                      <FileSearch className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Job-fit review
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Product Designer · Example role
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.08] px-2.5 py-1 text-[10px] font-medium text-amber-200">
                    Possible match
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-white/[0.07] bg-[#0b0d13] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                      Relevant evidence
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-300">
                      Skills and experience to highlight
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/[0.07] bg-[#0b0d13] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                      Questions to check
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-300">
                      Gaps and details to confirm
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.08] bg-[#0d0f16] p-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <ListChecks className="size-4 text-sky-300" aria-hidden="true" />
                    <span className="text-xs font-medium">Next step</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">
                    Build evidence
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="flex size-4 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                      <Check className="size-2.5" aria-hidden="true" />
                    </span>
                    A project linked to a skill gap
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-[#0d0f16] p-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <BriefcaseBusiness className="size-4 text-amber-200" aria-hidden="true" />
                    <span className="text-xs font-medium">Application tracker</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">
                    Keep follow-ups visible
                  </p>
                  <p className="mt-2 text-[11px] leading-5 text-slate-500">
                    Roles, stages, and next actions together
                  </p>
                </div>
              </div>
              <p className="mt-4 text-center text-[10px] text-slate-600">
                Illustrative preview · example content
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-8 mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-16"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">
            Your search, in one place
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            From first look to next step.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
            Practical tools to help you evaluate opportunities, stay organized,
            and make progress at your own pace.
          </p>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className={`rounded-xl border border-white/[0.08] border-t-2 ${feature.border} bg-[#101119] p-5 transition-colors hover:bg-[#131520]`}
              >
                <Icon className={`size-5 ${feature.tone}`} aria-hidden="true" />
                <h3 className="mt-5 text-sm font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-white/[0.08] bg-[#101119]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">
                A simple rhythm
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Make progress you can see.
              </h2>
            </div>
            <Link
              href="/guide"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-300 transition hover:text-blue-200"
            >
              Read the guide <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <ol className="mt-9 grid gap-8 md:grid-cols-3 md:gap-6">
            {steps.map((step) => (
              <li
                key={step.number}
                className="border-t border-white/10 pt-4"
              >
                <span className="font-mono text-xs text-blue-300">
                  {step.number}
                </span>
                <h3 className="mt-4 text-sm font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-16">
        <div className="flex flex-col gap-5 rounded-2xl border border-blue-400/15 bg-blue-500/[0.05] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-300" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                You stay in control
              </h2>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">
                AI-assisted features ask for your consent before processing
                selected information. Suggestions are a starting point;
                JobHunter does not apply to jobs on your behalf.
              </p>
            </div>
          </div>
          <Link
            href="/about"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-blue-300 transition hover:text-blue-200"
          >
            About JobHunter <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
      <PublicSiteFooter />
    </main>
  );
}

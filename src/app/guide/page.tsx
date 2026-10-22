import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  FileText,
  MessageSquareText,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";

export const metadata = {
  title: "How to use JobHunter",
  description:
    "A visual walkthrough of JobHunter: first steps, career milestones, dashboard controls, application drafts, job-fit checks, and learning plans.",
  alternates: {
    canonical: "/guide",
  },
};

const guides = [
  {
    number: "01",
    label: "Start here",
    title: "Tell JobHunter a little about you",
    body: "Use the dashboard checklist to get oriented, then add a few details about your experience and the kind of work you want. You can leave optional fields blank and update everything later.",
    steps: [
      "Open Settings from the left menu.",
      "Add your skills, experience, and the roles you are interested in.",
      "Save your profile. Want ideas? Choose Suggest job roles and review the suggestions.",
    ],
    href: "/signup",
    linkLabel: "Create your account",
    visual: "profile" as const,
    icon: CircleUserRound,
  },
  {
    number: "02",
    label: "Keep things organized",
    title: "Save jobs you are interested in",
    body: "Use Applications as your job-search list. Keep the company, role, status, and next step together so nothing slips through the cracks. Import a CSV backup or download your list whenever you need it.",
    steps: [
      "Open Applications and choose Add application.",
      "Enter the company and job title. Add a link or a reminder if you have one.",
      "Optionally record where you found each role. Analytics groups recorded sources to show your search mix; it does not claim that one source causes better hiring outcomes.",
      "Update the status as you move through the process. Use Import CSV or Export CSV to move a list in or out.",
      "Choose Draft follow-up for a quick editable message, or explicitly opt in to generate a three-step follow-up sequence for after applying, after an interview, or when you have not received a response. Edit each draft, then copy it, open it in your email app, or save it to history; JobHunter never sends these drafts.",
      "For reminders about saved follow-up dates, open Settings and grant browser notification permission. Browser alerts require JobHunter to stay open in that browser. Email reminders are currently off; an administrator can enable them in Admin after email delivery is configured, after which you can opt in from Settings.",
      "Choose Interview prep to record interview details, practice role-specific examples, and save your notes to that job’s history. Private prompts are available without AI. If you opt in, you can generate questions from the saved role and get coaching on answers you choose to send; AI practice uses its own monthly allowance.",
      "You can delete an AI-generated job summary and fit check while keeping the application, or delete the whole application when you no longer need it.",
      "For saved jobs with posting details, choose Prepare application to create a cover letter, resume summary and bullet suggestions, profile-supported job terms, and items to verify before claiming. Review and edit every resume suggestion. Choose Save drafts to this job if you want them kept in that application's History & updates. JobHunter does not fill or submit third-party application forms; open the listing to apply yourself.",
    ],
    href: "/login",
    linkLabel: "Sign in to track applications",
    visual: "applications" as const,
    icon: BriefcaseBusiness,
  },
  {
    number: "03",
    label: "Before you apply",
    title: "See how your experience fits a job",
    body: "Compare your resume with a job posting to get a helpful review of your strengths, possible gaps, and questions to check. It is guidance—not a hiring prediction.",
    steps: [
      "In Applications, choose Check job fit.",
      "Add your resume and the job description.",
      "Give consent to the AI check, then review the result. Save the job if you want to track it.",
    ],
    href: "/login",
    linkLabel: "Check a job fit",
    visual: "fit" as const,
    icon: Target,
  },
  {
    number: "04",
    label: "Make a plan",
    title: "Turn a goal into small steps",
    body: "A roadmap breaks a role you are aiming for into projects and tasks. Work through it at your own pace and tick off tasks as you finish them.",
    steps: [
      "Open Roadmaps and choose New Roadmap.",
      "Enter a job role and your target level.",
      "Open your plan, complete tasks, and record a link or notes as proof of what you built.",
      "Use Delete roadmap on a saved plan you no longer want. Its projects and tasks are deleted, but a linked job application stays in your tracker.",
    ],
    href: "/login",
    linkLabel: "Explore roadmaps",
    visual: "roadmap" as const,
    icon: CheckCircle2,
  },
  {
    number: "05",
    label: "Turn a gap into a project",
    title: "Build a small project to practice a missing skill",
    body: "After a job-fit check, you can turn a skill gap into a focused Proof Sprint or a learning roadmap. It gives you manageable tasks and a way to show what you learned.",
    steps: [
      "Save a job-fit check that shows a skill gap.",
      "In Applications, expand the fit-check result and choose Build proof sprint.",
      "Work through the tasks, then add a link or notes to show what you made.",
    ],
    href: "/login",
    linkLabel: "Find a skill gap",
    visual: "proof" as const,
    icon: Target,
  },
  {
    number: "06",
    label: "Show what you can do",
    title: "Create resume updates from completed work",
    body: "Use completed roadmap tasks and project notes to draft resume suggestions. You stay in control: edit the wording, check every claim, and download a text draft.",
    steps: [
      "Finish at least one roadmap task and save any useful project proof.",
      "Open Resume update and choose the projects you want to include.",
      "Add your resume and target role, consent to the AI draft, review the suggestions, then download your draft.",
    ],
    href: "/login",
    linkLabel: "Open resume update",
    visual: "resume" as const,
    icon: FileText,
  },
  {
    number: "07",
    label: "Learn as you go",
    title: "Track progress and make the dashboard yours",
    body: "Your dashboard starts with a first-steps checklist and Career Momentum milestones based on real learning and preparation progress—not streaks or application quotas. You can hide or show dashboard sections individually or all at once; your choices are saved on this device.",
    steps: [
      "Start with Your first steps on the Career Dashboard; completed items are recognized from your saved profile, applications, roadmaps, and tasks.",
      "Use Career Momentum to recognize milestones as you make progress.",
      "Choose Hide or Show on a section, or use Show all and Hide all to adjust the dashboard layout. Your selection is stored in this browser.",
      "Open Analytics to see your current application pipeline, follow-ups due soon, the mix of sources you record, and stage-to-stage conversion based on saved status changes. Existing applications start from a snapshot when tracking is deployed; older transitions are not reconstructed. These personal samples are not proof that a source or fit assessment caused an outcome. If you have offers, compare factors like pay, commute, learning, and work-life balance—the scores do not make the choice for you.",
    ],
    href: "/login",
    linkLabel: "Explore your dashboard",
    visual: "insights" as const,
    icon: BarChart3,
  },
  {
    number: "08",
    label: "Help us improve",
    title: "Tell us what worked for you",
    body: "When you have tried the app, share what helped or got in your way. Feedback is optional, and your survey answers are saved without your account email.",
    steps: [
      "Choose Share feedback from the left menu.",
      "Rate the parts you tried; leave the rest as Not tried.",
      "Tell us what was useful or what you would change, then submit.",
    ],
    href: "/login",
    linkLabel: "Share feedback",
    visual: "feedback" as const,
    icon: MessageSquareText,
  },
];

type VisualKind = (typeof guides)[number]["visual"];

function MockWindow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-xl border border-[#303342] bg-[#0b0c12] shadow-2xl shadow-black/40"
    >
      <div className="flex items-center gap-2 border-b border-[#252836] px-4 py-3">
        <span className="size-2 rounded-full bg-rose-400/70" />
        <span className="size-2 rounded-full bg-amber-300/70" />
        <span className="size-2 rounded-full bg-emerald-300/70" />
        <span className="ml-2 truncate text-[10px] text-slate-500">{title}</span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function MockField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-medium text-slate-400">{label}</p>
      <div className="truncate rounded-md border border-[#292c39] bg-[#101119] px-2.5 py-2 text-[10px] text-slate-300">
        {value}
      </div>
    </div>
  );
}

function GuideVisual({ kind }: { kind: VisualKind }) {
  if (kind === "profile") {
    return (
      <MockWindow title="Settings / Career profile">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white">Career profile</p>
            <p className="mt-1 text-[10px] text-slate-500">
              Your experience, in your words
            </p>
          </div>
          <CircleUserRound className="size-5 text-blue-300" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <MockField label="Experience" value="Customer support + projects" />
          <MockField label="Interested in" value="Product support" />
          <MockField label="Skills" value="Communication, SQL, research" />
          <MockField label="Work style" value="Remote or hybrid" />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="rounded-md border border-blue-400/20 bg-blue-500/10 px-2.5 py-1.5 text-[10px] text-blue-200">
            ✦ Suggest job roles
          </span>
          <span className="rounded-md bg-blue-600 px-3 py-1.5 text-[10px] font-semibold text-white">
            Save profile
          </span>
        </div>
      </MockWindow>
    );
  }

  if (kind === "applications") {
    return (
      <MockWindow title="Applications">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white">Your job list</p>
            <p className="mt-1 text-[10px] text-slate-500">
              Keep every next step in one place
            </p>
          </div>
          <span className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-[10px] font-semibold text-white">
            <Plus className="size-3" /> Add job
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {[
            ["Brightside", "Product Support", "Interviewing", "Follow up Friday"],
            ["Northstar", "Junior Analyst", "Applied", "Waiting to hear back"],
            ["Greenline", "Project Coordinator", "Saved", "Apply this week"],
          ].map(([company, role, status, next]) => (
            <div
              key={company}
              className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 rounded-lg border border-[#252836] bg-[#101119] p-3 sm:grid-cols-[1fr_auto_auto]"
            >
              <p className="text-[10px] font-medium text-slate-200">
                {company} <span className="text-slate-500">· {role}</span>
              </p>
              <span className="row-span-2 self-center rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-1 text-[9px] text-blue-200">
                {status}
              </span>
              <p className="text-[9px] text-slate-500 sm:col-auto">{next}</p>
            </div>
          ))}
        </div>
      </MockWindow>
    );
  }

  if (kind === "fit") {
    return (
      <MockWindow title="Applications / Check job fit">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-white">
              Product Support Specialist
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              Resume + job posting reviewed
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-medium text-emerald-200">
            Possible match
          </span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-400/15 bg-emerald-500/[0.06] p-3">
            <p className="text-[10px] font-semibold text-emerald-200">
              Your strengths
            </p>
            <p className="mt-2 text-[9px] leading-4 text-slate-400">
              Customer communication · Troubleshooting
            </p>
          </div>
          <div className="rounded-lg border border-amber-400/15 bg-amber-500/[0.06] p-3">
            <p className="text-[10px] font-semibold text-amber-100">
              Things to check
            </p>
            <p className="mt-2 text-[9px] leading-4 text-slate-400">
              Mention of ticketing tools · On-call expectations
            </p>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[9px] text-slate-500">
          <Check className="size-3 text-blue-300" />
          A guide for your review—not a hiring prediction
        </p>
      </MockWindow>
    );
  }

  if (kind === "roadmap") {
    return (
      <MockWindow title="Roadmaps / Product Support Specialist">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-white">
              Product Support Specialist
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              Your next steps, one at a time
            </p>
          </div>
          <span className="text-[10px] font-semibold text-blue-300">2 of 4</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#252836]">
          <div className="h-full w-1/2 rounded-full bg-blue-500" />
        </div>
        <div className="mt-4 space-y-2">
          <p className="flex items-center gap-2 rounded-lg border border-emerald-400/15 bg-emerald-500/[0.05] p-2.5 text-[10px] text-slate-300">
            <CheckCircle2 className="size-3.5 text-emerald-300" />
            Practice writing a clear support reply
          </p>
          <p className="flex items-center gap-2 rounded-lg border border-blue-400/20 bg-blue-500/[0.06] p-2.5 text-[10px] text-slate-200">
            <span className="size-3.5 rounded-full border border-blue-300" />
            Build a small troubleshooting guide
          </p>
          <p className="flex items-center gap-2 rounded-lg border border-[#252836] p-2.5 text-[10px] text-slate-500">
            <span className="size-3.5 rounded-full border border-slate-600" />
            Add your project link or notes as proof
          </p>
        </div>
      </MockWindow>
    );
  }

  if (kind === "resume") {
    return (
      <MockWindow title="Resume update">
        <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-white">
              Choose completed work
            </p>
            <div className="rounded-lg border border-blue-400/25 bg-blue-500/[0.06] p-2.5">
              <p className="flex items-center gap-1.5 text-[9px] font-medium text-blue-100">
                <CheckCircle2 className="size-3 text-blue-300" />
                Troubleshooting guide
              </p>
              <p className="mt-1 pl-[18px] text-[9px] text-slate-500">
                3 tasks completed
              </p>
            </div>
            <MockField label="Target role" value="Product Support" />
            <span className="inline-flex rounded-md bg-blue-600 px-2.5 py-1.5 text-[9px] font-semibold text-white">
              Draft suggestions
            </span>
          </div>
          <div className="rounded-lg border border-[#252836] bg-[#101119] p-3">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Editable draft
            </p>
            <p className="mt-3 text-[10px] font-semibold text-white">
              Project experience
            </p>
            <p className="mt-1 text-[9px] leading-4 text-slate-400">
              Created a troubleshooting guide to help users resolve common
              issues with clear, step-by-step instructions.
            </p>
            <p className="mt-3 rounded-md border border-amber-400/15 bg-amber-500/[0.05] p-2 text-[9px] leading-4 text-amber-100/80">
              Review every detail before using it.
            </p>
          </div>
        </div>
      </MockWindow>
    );
  }

  if (kind === "proof") {
    return (
      <MockWindow title="Applications / Proof Sprint">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-white">
              Practice customer support troubleshooting
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              A small plan for one skill gap
            </p>
          </div>
          <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-1 text-[9px] text-blue-200">
            Proof Sprint
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {([
            ["1", "Pick a common customer problem", true],
            ["2", "Write a step-by-step solution", true],
            ["3", "Share your guide or project link", false],
          ] as const).map(([number, task, complete]) => (
            <div
              key={number}
              className="flex items-center gap-2.5 rounded-lg border border-[#252836] bg-[#101119] p-2.5"
            >
              {complete ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-300" />
              ) : (
                <span className="size-3.5 shrink-0 rounded-full border border-slate-600" />
              )}
              <span className="text-[10px] text-slate-300">{task}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-blue-400/15 bg-blue-500/[0.05] p-3">
          <p className="text-[9px] font-semibold text-blue-200">
            Your proof
          </p>
          <p className="mt-1 text-[9px] text-slate-400">
            Add a project link or a few notes about what you completed.
          </p>
        </div>
      </MockWindow>
    );
  }

  if (kind === "insights") {
    return (
      <MockWindow title="Analytics & Insights">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Applications", "12"],
            ["Interviews", "3"],
            ["Roadmap", "60%"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-[#252836] bg-[#101119] p-2.5"
            >
              <p className="text-[9px] text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-[#252836] bg-[#101119] p-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-white">
              What matters to you?
            </p>
            <span className="text-[9px] text-slate-500">Offer comparison</span>
          </div>
          {[
            ["Work-life balance", "w-4/5"],
            ["Learning", "w-3/5"],
            ["Commute", "w-2/5"],
          ].map(([label, width]) => (
            <div key={label} className="mt-2 flex items-center gap-2">
              <span className="w-24 text-[9px] text-slate-400">{label}</span>
              <div className="h-1.5 flex-1 rounded-full bg-[#252836]">
                <div className={`h-full ${width} rounded-full bg-blue-400`} />
              </div>
            </div>
          ))}
        </div>
      </MockWindow>
    );
  }

  return (
    <MockWindow title="Share feedback">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-white">Your experience</p>
          <p className="mt-1 text-[10px] text-slate-500">
            Tell us what helped and what did not
          </p>
        </div>
        <MessageSquareText className="size-5 text-blue-300" />
      </div>
      <div className="mt-4 rounded-lg border border-[#252836] bg-[#101119] p-3">
        <p className="text-[10px] text-slate-300">
          How useful was JobHunter?
        </p>
        <div className="mt-2 flex gap-1.5 text-sm text-amber-300">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index}>★</span>
          ))}
        </div>
      </div>
      <div className="mt-2 rounded-lg border border-[#252836] bg-[#101119] p-3">
        <p className="text-[10px] text-slate-500">
          What would you improve?
        </p>
        <div className="mt-2 h-8 rounded border border-[#252836] bg-[#0b0c12]" />
      </div>
    </MockWindow>
  );
}

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100">
      <PublicSiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-white/10 bg-[#101119]">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-28 size-96 rounded-full bg-blue-500/[0.08] blur-3xl"
          />
          <div className="relative mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
              A simple, visual guide
            </p>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-white sm:text-6xl">
              Your job search, one clear step at a time.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              New here? Start with your profile, save a job you like, and use the
              pictures below to see what you can do next. You do not have to use
              every tool—pick what helps you.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Get started <ArrowRight className="size-4" />
              </Link>
              <a
                href="#walkthrough"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#303342] px-4 text-sm font-medium text-slate-200 transition hover:bg-white/5"
              >
                See how it works <ChevronRight className="size-4" />
              </a>
            </div>
          </div>
        </section>

        <section
          id="walkthrough"
          className="mx-auto max-w-7xl scroll-mt-8 px-6 py-8 sm:px-10 sm:py-12 lg:px-16"
        >
          <div className="mb-5 flex items-center gap-3 text-xs text-slate-500">
            <Sparkles className="size-4 text-blue-300" aria-hidden="true" />
            <p>Example screens are illustrations to help you find your way.</p>
          </div>
          <ol className="space-y-5 sm:space-y-7">
            {guides.map((guide, index) => {
              const Icon = guide.icon;
              const visualOnLeft = index % 2 === 1;
              return (
                <li
                  key={guide.number}
                  className="grid items-center gap-6 rounded-2xl border border-white/[0.08] bg-[#101119] p-5 sm:gap-8 sm:p-8 lg:grid-cols-2 lg:gap-12 lg:p-10"
                >
                  <div className={visualOnLeft ? "lg:order-2" : ""}>
                    <div className="mb-4 flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/10">
                        <Icon
                          className="size-4 text-blue-300"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-300">
                        Step {guide.number} · {guide.label}
                      </span>
                    </div>
                    <h2 className="max-w-lg text-xl font-semibold leading-snug text-white sm:text-2xl">
                      {guide.title}
                    </h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                      {guide.body}
                    </p>
                    <ol className="mt-5 space-y-3">
                      {guide.steps.map((step, stepIndex) => (
                        <li
                          key={step}
                          className="flex items-start gap-3 text-sm leading-6 text-slate-300"
                        >
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10 text-[10px] font-semibold text-blue-200">
                            {stepIndex + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                    <Link
                      href={guide.href}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition hover:text-blue-200"
                    >
                      {guide.linkLabel} <ArrowRight className="size-4" />
                    </Link>
                  </div>
                  <div className={visualOnLeft ? "lg:order-1" : ""}>
                    <GuideVisual kind={guide.visual} />
                    <p className="mt-2 text-center text-[10px] text-slate-600">
                      A sample view—not real account information
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="border-y border-white/[0.08] bg-[#101119]">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-10 sm:px-10 sm:py-12 md:flex-row md:items-center md:justify-between lg:px-16">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">
                You are in control
              </p>
              <h2 className="mt-3 text-xl font-semibold text-white">
                Use the suggestions as a starting point—not the final word.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Review AI-generated content carefully, only share information
                when you are comfortable, and make every career decision for
                yourself.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Start with JobHunter <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  FileText,
  MessageSquareText,
  Plus,
  Sparkles,
  Target,
  Video,
} from "lucide-react";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";

export const metadata = {
  title: "How to use JobHunter",
  description:
    "A beginner-friendly guide to setting up JobHunter, tracking applications, using career tools, managing plans, and finding help.",
  alternates: {
    canonical: "/guide",
  },
};

const guides = [
  {
    number: "01",
    label: "Start here",
    title: "Create an account and add the basics",
    body: "Start with only the information you are comfortable sharing. You can leave optional profile fields blank and update them later.",
    steps: [
      "Choose Get started and create an account. Your password must be 7–128 characters and include a number and a symbol.",
      "After signing in, open Account settings and add a short career summary, a few skills, or roles you want to explore.",
      "Choose Save profile. Role suggestions are optional and require your agreement before your profile is sent to AI.",
    ],
    href: "/signup",
    linkLabel: "Create your account",
    visual: "profile" as const,
    icon: CircleUserRound,
  },
  {
    number: "02",
    label: "Keep things organized",
    title: "Save a job and track what happens next",
    body: "Job applications is your personal job-search list. Track roles you are considering as well as jobs you have already applied for.",
    steps: [
      "Open Job applications and choose Add application. Company and job title are the main details; status, contact, source, notes, link, and reminder date are optional.",
      "Choose a status that matches where you are, then update it and your next action as things change.",
      "Use Import CSV or Export all CSV to move or back up your list. Follow-up drafts are for you to review and send; JobHunter never sends applications or emails for you.",
      "If reminders are available, configure them in Account settings. Browser notifications require permission and the site to remain open; email reminders require administrator setup and your opt-in.",
    ],
    href: "/applications",
    linkLabel: "Open job applications",
    visual: "applications" as const,
    icon: BriefcaseBusiness,
  },
  {
    number: "03",
    label: "Before you apply",
    title: "Review how your experience fits a role",
    body: "A job-fit review highlights evidence in your resume, possible gaps, and details worth checking. It is a prompt for your judgment—not a hiring prediction.",
    steps: [
      "In Job applications, choose Check job fit, or open a saved job and choose Check saved job fit.",
      "Add your resume and the job posting. You can paste a description or use a supported document or image option shown in the form.",
      "Review the consent notice and agree before analysis. Check the evidence and unknowns yourself; when gaps are identified, save the role and choose Build roadmap from gaps to create a learning plan.",
    ],
    href: "/applications",
    linkLabel: "Review a job fit",
    visual: "fit" as const,
    icon: Target,
  },
  {
    number: "04",
    label: "Make a plan",
    title: "Turn a career goal into a learning plan",
    body: "Learning plans break a target role and level into projects and tasks. Work at your own pace; there are no streaks or application quotas.",
    steps: [
      "Open Learning plans and choose New Roadmap. Enter the role and target level.",
      "Open the plan, complete tasks, and add project links or notes as proof of your work.",
      "When all tasks in a stage are complete, choose Generate next stage. Delete a plan you no longer need; linked job applications remain in your tracker.",
    ],
    href: "/roadmaps",
    linkLabel: "Explore learning plans",
    visual: "roadmap" as const,
    icon: CheckCircle2,
  },
  {
    number: "05",
    label: "Turn a gap into a project",
    title: "Practice a skill with a focused project",
    body: "A Proof Sprint turns a gap from a saved job-fit review into a short set of practical tasks.",
    steps: [
      "Save a job-fit result that identifies a skill to practice.",
      "In Job applications, open the result and choose Build proof sprint.",
      "Complete the tasks and add a link or notes to show what you made.",
    ],
    href: "/applications",
    linkLabel: "Explore job applications",
    visual: "proof" as const,
    icon: Target,
  },
  {
    number: "06",
    label: "Prepare your materials",
    title: "Create drafts you can review and edit",
    body: "JobHunter can help prepare materials, but you stay responsible for checking every claim and sending or submitting them yourself.",
    steps: [
      "For a saved job with posting details, choose Prepare application to draft a cover letter, resume summary and bullets, and profile-supported job terms.",
      "For a broader resume draft, open Resume update and choose completed roadmap work, then add your resume and target role. For a cover-letter-only draft, open Cover letter.",
      "Review and edit every suggestion. Save drafts to a job only if you want them in its history. JobHunter does not fill in external forms or submit applications.",
    ],
    href: "/resume-update",
    linkLabel: "Open resume update",
    visual: "resume" as const,
    icon: FileText,
  },
  {
    number: "07",
    label: "Practice for interviews",
    title: "Prepare for a role with interview practice",
    body: "Practice from a saved application or start a practice round for any role.",
    steps: [
      "Choose Interview prep on a saved job or open Interview practice from the navigation.",
      "Enter a role and optionally a company or job description. Agree before sending these details to AI to generate questions.",
      "Answer by typing or voice, then request AI coaching only on answers you choose to share. Camera is a local preview; browser speech recognition may process audio through its provider.",
    ],
    href: "/interview-practice",
    linkLabel: "Open interview practice",
    visual: "interview" as const,
    icon: Video,
  },
  {
    number: "08",
    label: "See your progress",
    title: "Use your dashboard and search insights",
    body: "Progress views summarize what you have recorded. They are personal tracking tools, not forecasts or proof that one action caused an outcome.",
    steps: [
      "Start with Your first steps and Career Momentum on the Career dashboard.",
      "Open Search insights to review your application pipeline, due follow-ups, saved sources, and status changes.",
      "Hide or show dashboard sections to make the workspace easier to use. Your layout choice is saved in this browser.",
    ],
    href: "/dashboard",
    linkLabel: "Open your dashboard",
    visual: "insights" as const,
    icon: BarChart3,
  },
  {
    number: "09",
    label: "Plans and billing",
    title: "Understand your plan before checkout",
    body: "Plans & usage shows your access, included allowances, and subscription status. The price and interval are shown before checkout.",
    steps: [
      "Open Plans & usage to review access and available plans. Live PayFast checkout creates real recurring charges; sandbox subscriptions do not transfer to live mode.",
      "An upgrade starts a new checkout and takes effect only after payment succeeds. The existing renewal is then canceled.",
      "A downgrade is scheduled for renewal. Your current plan stays active through its paid period; return at renewal and complete checkout for the lower plan. Scheduling does not authorize a future payment. If available, Schedule cancellation stops renewal while access continues through the paid period.",
    ],
    href: "/billing",
    linkLabel: "Review plans and usage",
    visual: "billing" as const,
    icon: CreditCard,
  },
  {
    number: "10",
    label: "Get help",
    title: "Ask the assistant or contact support",
    body: "The assistant can explain how to use JobHunter and give general career guidance. It cannot see your account or make changes for you.",
    steps: [
      "Open the assistant from the page you are using and describe what you are trying to do. It can use the current page as a navigation hint.",
      "Do not share passwords, verification codes, or full payment details. Choose saved career information only when you want it included in a career message.",
      "For account-specific or payment problems, contact support; the assistant cannot access or change account records.",
    ],
    href: "/contact",
    linkLabel: "Contact support",
    visual: "assistant" as const,
    icon: Bot,
  },
  {
    number: "11",
    label: "Help us improve",
    title: "Share feedback when you are ready",
    body: "Feedback is optional. Your survey answers are saved without your account email.",
    steps: [
      "Choose Send feedback from the dashboard navigation.",
      "Rate only features you tried; leave others as Not tried.",
      "Describe what helped or what you would change, then submit.",
    ],
    href: "/feedback",
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
      <MockWindow title="Account settings / Career profile">
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

  if (kind === "interview") {
    return (
      <MockWindow title="Interview practice">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-white">
              Product Support Specialist
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              Practice at your own pace
            </p>
          </div>
          <Video className="size-5 text-cyan-300" />
        </div>
        <div className="mt-4 rounded-lg border border-[#252836] bg-[#101119] p-3">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            Practice question
          </p>
          <p className="mt-2 text-[10px] leading-4 text-slate-300">
            Tell me about a time you helped someone solve a difficult problem.
          </p>
        </div>
        <p className="mt-3 rounded-lg border border-blue-400/15 bg-blue-500/[0.05] p-3 text-[9px] leading-4 text-blue-100/80">
          Your answer is only shared for AI coaching when you request feedback.
        </p>
      </MockWindow>
    );
  }

  if (kind === "billing") {
    return (
      <MockWindow title="Plans & usage">
        <div className="flex items-center gap-2">
          <CreditCard className="size-5 text-violet-300" />
          <div>
            <p className="text-xs font-semibold text-white">Your plan</p>
            <p className="mt-1 text-[10px] text-slate-500">
              Check access and usage before checkout
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-[#252836] bg-[#101119] p-3">
          <p className="text-[10px] font-medium text-slate-200">
            Current access
          </p>
          <p className="mt-1 text-[9px] leading-4 text-slate-400">
            Plan status · monthly AI allowances · renewal details
          </p>
        </div>
        <p className="mt-3 text-[9px] leading-4 text-amber-100/80">
          Review the price and billing interval before paying.
        </p>
      </MockWindow>
    );
  }

  if (kind === "assistant") {
    return (
      <MockWindow title="JobHunter AI assistant">
        <div className="flex items-center gap-2">
          <Bot className="size-5 text-indigo-300" />
          <p className="text-xs font-semibold text-white">
            Ask about the page you are on
          </p>
        </div>
        <div className="mt-4 rounded-lg border border-blue-400/15 bg-blue-500/[0.06] p-3">
          <p className="text-[10px] text-blue-100">
            How do I add a job and set a follow-up?
          </p>
        </div>
        <p className="mt-3 text-[9px] leading-4 text-slate-400">
          The assistant can explain features, but cannot access or change your
          account.
        </p>
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
          aria-labelledby="quick-start-heading"
          className="mx-auto max-w-7xl px-6 py-8 sm:px-10 sm:py-10 lg:px-16"
        >
          <div className="mb-5">
            <h2
              id="quick-start-heading"
              className="text-xl font-semibold text-white"
            >
              Your first steps
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Start with one or two of these. Skip anything that is not useful
              right now and come back whenever you like.
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Create an account",
                description: "Sign up to save your work.",
                href: "/signup",
              },
              {
                title: "Add a few career details",
                description: "Share skills or roles you want to explore.",
                href: "/settings",
              },
              {
                title: "Track a job you like",
                description: "Save the role and your next step.",
                href: "/applications",
              },
              {
                title: "Make a small learning plan",
                description: "Choose a role and try one task.",
                href: "/roadmaps",
              },
            ].map((step, index) => (
              <li key={step.title}>
                <Link
                  href={step.href}
                  className="block h-full rounded-xl border border-white/[0.08] bg-[#101119] p-4 transition hover:border-blue-400/30 hover:bg-[#141620] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-300">
                    Step {index + 1}
                  </span>
                  <h3 className="mt-2 text-sm font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {step.description}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
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
                  id={`guide-step-${guide.number}`}
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

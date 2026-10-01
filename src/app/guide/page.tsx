import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleUserRound,
  FileSearch,
  ListChecks,
} from "lucide-react";
import { PublicSiteHeader } from "@/components/public-site-header";

export const metadata = {
  title: "Guide | JobHunter",
  description:
    "A practical guide to setting up a profile and reviewing job matches in JobHunter.",
};

const steps = [
  {
    number: "01",
    title: "Describe your experience",
    body: "Open Settings and add your skills, experience level, target roles, location, and work preferences. Save your profile before requesting suggestions.",
    icon: CircleUserRound,
  },
  {
    number: "02",
    title: "Explore roles",
    body: "Choose Suggest job roles in Settings. After you consent, JobHunter sends your saved profile to Groq and returns evidence-based titles to explore.",
    icon: ListChecks,
  },
  {
    number: "03",
    title: "Check a specific opportunity",
    body: "In Applications, choose Check job fit. Upload a text PDF or a JPEG, PNG, or WebP resume image, then paste the job description or add a poster image.",
    icon: FileSearch,
  },
  {
    number: "04",
    title: "Review and track",
    body: "The fit check returns a qualitative assessment, relevant evidence, gaps, and questions to confirm. You decide what to do next; JobHunter does not submit the application.",
    icon: Check,
  },
];

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-[#090a0f] text-slate-100">
      <PublicSiteHeader />
      <section className="border-b border-white/10 bg-[#12131a]">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-16">
          <p className="text-xs font-semibold uppercase text-blue-300">
            JobHunter guide
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-white sm:text-5xl">
            From experience to a more focused search.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-400">
            Set up your profile, explore possible roles, and review each job
            match before deciding whether to apply.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:px-16">
        <ol className="divide-y divide-white/10">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.number}
                className="grid gap-4 py-7 sm:grid-cols-[72px_36px_minmax(0,1fr)] sm:gap-6"
              >
                <span className="font-mono text-sm text-blue-300">
                  {step.number}
                </span>
                <Icon className="mt-0.5 h-5 w-5 text-slate-300" />
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {step.title}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                    {step.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="border-y border-white/10 bg-[#12131a]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 sm:px-10 md:flex-row md:items-center md:justify-between lg:px-16">
          <div>
            <h2 className="text-sm font-semibold text-white">
              AI and your data
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">
              Fit checks send the selected resume and job content to Google
              Gemini only after consent. The uploaded resume and extracted text
              are not saved by JobHunter. Role suggestions send your saved
              profile to Groq after consent.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

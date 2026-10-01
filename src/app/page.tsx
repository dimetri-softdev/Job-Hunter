import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Compass,
  Sparkles,
  Target,
} from "lucide-react";
import { PublicSiteHeader } from "@/components/public-site-header";

export const metadata = {
  title: "JobHunter | A clearer path to your next role",
  description:
    "Find roles that fit your experience, assess job matches, and keep your search organized with JobHunter.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#090a0f] text-slate-100">
      <PublicSiteHeader />
      <section className="relative isolate flex min-h-[500px] items-center overflow-hidden border-b border-white/10 sm:min-h-[560px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=2200&q=85')",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/90 to-[#090a0f]/35"
        />
        <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-10 lg:px-16">
          <p className="text-xs font-semibold uppercase text-blue-300">
            A focused career-search workspace
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-tight text-white sm:text-6xl">
            JobHunter
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
            Find roles that fit your experience, make sense of job requirements,
            and keep your search moving one thoughtful step at a time.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/guide"
              className="inline-flex h-11 items-center rounded-lg border border-white/25 px-5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Read the guide
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:px-10 md:grid-cols-3 lg:px-16">
        <article className="border-t border-blue-500/40 pt-5">
          <Target className="h-5 w-5 text-blue-300" />
          <h2 className="mt-4 text-base font-semibold text-white">
            Check the fit
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Compare a resume with a job description or poster and see relevant
            evidence, gaps, and questions to confirm.
          </p>
        </article>
        <article className="border-t border-sky-400/40 pt-5">
          <BriefcaseBusiness className="h-5 w-5 text-sky-300" />
          <h2 className="mt-4 text-base font-semibold text-white">
            Organize applications
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Keep roles, job-post details, and application stages together in one
            tracker.
          </p>
        </article>
        <article className="border-t border-amber-300/50 pt-5">
          <Compass className="h-5 w-5 text-amber-200" />
          <h2 className="mt-4 text-base font-semibold text-white">
            Choose a direction
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Build a career profile to get evidence-based suggestions for roles
            worth exploring.
          </p>
        </article>
      </section>

      <section className="border-y border-white/10 bg-[#12131a]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-10 sm:px-10 md:flex-row md:items-center md:justify-between lg:px-16">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-300">
              <Sparkles className="h-4 w-4" />
              Built for your next step
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              AI suggestions are drafts to help you decide. JobHunter does not
              submit applications on your behalf.
            </p>
          </div>
          <Link
            href="/about"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-white hover:text-blue-300"
          >
            About JobHunter <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

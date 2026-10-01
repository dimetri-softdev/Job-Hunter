import Link from "next/link";
import { ArrowRight, Compass, ShieldCheck, Target } from "lucide-react";
import { PublicSiteHeader } from "@/components/public-site-header";

export const metadata = {
  title: "About | JobHunter",
  description: "Why JobHunter exists and what it helps job seekers do.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#090a0f] text-slate-100">
      <PublicSiteHeader />
      <section className="border-b border-white/10 bg-[#12131a]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
          <p className="text-xs font-semibold uppercase text-blue-300">
            About JobHunter
          </p>
          <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-tight text-white sm:text-5xl">
            A more considered way to search for work.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300">
            Looking for work asks you to research roles, explain your
            experience, learn new skills, and follow up across many
            opportunities. JobHunter brings those pieces into one workspace so
            your next steps are easier to see.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-16">
        <div className="grid gap-10 md:grid-cols-3">
          <article className="border-t border-blue-500/40 pt-5">
            <Target className="h-5 w-5 text-blue-300" />
            <h2 className="mt-4 text-base font-semibold text-white">
              Make fit easier to judge
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Compare your resume with a role and review the evidence, unknowns,
              and gaps before deciding whether to apply.
            </p>
          </article>
          <article className="border-t border-sky-400/40 pt-5">
            <Compass className="h-5 w-5 text-sky-300" />
            <h2 className="mt-4 text-base font-semibold text-white">
              Keep a direction
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              A self-reported career profile can help surface job titles to
              explore and skills to strengthen.
            </p>
          </article>
          <article className="border-t border-amber-300/50 pt-5">
            <ShieldCheck className="h-5 w-5 text-amber-200" />
            <h2 className="mt-4 text-base font-semibold text-white">
              Keep the decision yours
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              AI output is a starting point, not a promise of employment or a
              substitute for reviewing a job posting yourself.
            </p>
          </article>
        </div>
        <div className="mt-14 border-t border-white/10 pt-8">
          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            JobHunter is still growing. It can organize opportunities, analyze a
            pasted or pictured posting, compare it with a resume, and suggest
            roles from a saved career profile. It does not automatically fill
            out or submit applications on external job sites.
          </p>
          <Link
            href="/guide"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200"
          >
            See how it works <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

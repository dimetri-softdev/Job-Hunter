import type { ReactNode } from "react";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";

interface PolicySection {
  id: string;
  title: string;
  content: ReactNode;
}

export function PolicyPageLayout({
  title,
  description,
  sections,
}: {
  title: string;
  description: string;
  sections: PolicySection[];
}) {
  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100">
      <PublicSiteHeader />
      <main>
        <section className="border-b border-white/10 bg-gradient-to-br from-[#151725] via-[#11121a] to-[#0d0e14]">
          <div className="mx-auto max-w-7xl px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/[0.07] px-3 py-1.5 text-xs font-semibold text-amber-100">
              <span className="size-1.5 rounded-full bg-amber-300" />
              Draft for review · 22 October 2026
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              {description}
            </p>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 sm:px-10 sm:py-12 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12 lg:px-16">
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <nav
              aria-label={`${title} sections`}
              className="rounded-2xl border border-white/10 bg-[#101119] p-4"
            >
              <h2 className="px-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                On this page
              </h2>
              <ol className="mt-3 space-y-1">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="flex gap-2 rounded-lg px-2 py-2 text-sm leading-5 text-slate-300 transition hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      <span className="shrink-0 text-xs tabular-nums text-slate-500">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-400/[0.05] p-4">
              <p className="text-sm font-semibold text-amber-100">
                Draft, not final
              </p>
              <p className="mt-2 text-xs leading-5 text-amber-100/75">
                Review the policy and confirm all service and legal details
                before relying on or distributing it as final.
              </p>
            </div>
          </aside>

          <article className="min-w-0 space-y-4">
            <div className="rounded-2xl border border-blue-300/15 bg-blue-400/[0.05] p-5 sm:p-6">
              <p className="text-sm font-semibold text-blue-100">
                Current service status
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                JobHunter is in pilot mode. Paid checkout is disabled; paid
                subscriptions and one-time purchases are not available, and
                users are not currently charged for access.
              </p>
            </div>

            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
                className="scroll-mt-6 rounded-2xl border border-white/10 bg-[#101119] p-5 sm:p-7"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-blue-300/15 bg-blue-400/[0.07] text-xs font-semibold tabular-nums text-blue-200">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2
                    id={`${section.id}-heading`}
                    className="pt-1 text-lg font-semibold text-white"
                  >
                    {section.title}
                  </h2>
                </div>
                <div className="mt-4 space-y-3 pl-0 text-sm leading-7 text-slate-400 sm:pl-11">
                  {section.content}
                </div>
              </section>
            ))}
          </article>
        </div>
      </main>
      <PublicSiteFooter />
    </div>
  );
}

import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { SupportContactLink } from "@/components/support-contact-link";

export const metadata = {
  title: "Terms of Service",
  description: "Draft terms for using JobHunter.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100">
      <PublicSiteHeader />
      <main>
        <section className="border-b border-white/10 bg-[#12131a]">
          <div className="mx-auto max-w-4xl px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">
              Draft for review · 22 October 2026
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              These draft terms describe the current JobHunter pilot and
              proposed future paid plans. They are not final and should not be
              treated as a completed legal agreement until the operator details
              are filled in and the terms are reviewed.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl space-y-8 px-6 py-10 sm:px-10 sm:py-14 lg:px-16">
          <section
            aria-label="Draft status"
            className="rounded-xl border border-amber-300/20 bg-amber-400/[0.06] p-5"
          >
            <p className="text-sm leading-6 text-amber-100">
              <strong>Draft only:</strong> Replace{" "}
              <strong>[LEGAL OPERATOR NAME]</strong> with the correct legal
              person or business name, review these terms, and confirm the
              service details before sharing them as final with PayFast or
              users.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. The service</h2>
            <p className="text-sm leading-7 text-slate-400">
              JobHunter is a career-management workspace for organizing job
              applications and exploring career plans. Features may include
              application tracking, AI-assisted job-fit reviews, application
              preparation, and career roadmaps. AI output can be incomplete or
              inaccurate; review it before relying on it. JobHunter does not
              guarantee employment, interviews, or any particular career
              outcome, and does not make hiring decisions or submit
              applications for you.
            </p>
            <p className="text-sm leading-7 text-slate-400">
              JobHunter is currently in pilot mode. Paid subscriptions,
              one-time purchases, and checkout are not currently available, and
              users are not currently charged for JobHunter access.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">
              2. Who may use JobHunter
            </h2>
            <p className="text-sm leading-7 text-slate-400">
              You must be at least 18 years old to create or use a JobHunter
              account. By registering, you confirm that you meet this age
              requirement. Provide accurate account information and keep your
              sign-in credentials secure. You are responsible for activity
              carried out through your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">
              3. Acceptable use and your content
            </h2>
            <p className="text-sm leading-7 text-slate-400">
              Use JobHunter lawfully and do not interfere with its security or
              operation, attempt unauthorized access, or use it to infringe
              another person’s rights. You remain responsible for the resumes,
              job descriptions, messages, and other material you provide. You
              give JobHunter permission to process that material only as needed
              to provide and operate the features you choose, as further
              described in the{" "}
              <a
                href="/privacy"
                className="text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200"
              >
                Privacy page
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">
              4. Future paid plans
            </h2>
            <p className="text-sm leading-7 text-slate-400">
              This section is for a future launch only and does not make paid
              access available now. If paid plans are introduced, the price,
              currency, included features, billing interval, and any applicable
              taxes will be shown before you confirm a purchase. Future plans
              may include monthly or annual subscriptions that renew
              automatically until cancelled, as well as optional one-time
              purchases that do not renew. The purchase screen will state the
              access period and terms for each one-time purchase.
            </p>
            <p className="text-sm leading-7 text-slate-400">
              A paid subscription cancellation will stop future renewals.
              Unless the purchase screen says otherwise or applicable law
              requires otherwise, paid access will remain available until the
              end of the period already paid for. Further details will be
              published before checkout is enabled.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">
              5. Availability and account closure
            </h2>
            <p className="text-sm leading-7 text-slate-400">
              JobHunter is provided as an evolving service and may change as
              features are improved. We may restrict or suspend access when
              reasonably necessary to protect users, the service, or its
              security, or to address unlawful or abusive use. You may request
              account closure by contacting support. Data handling and any
              retention required by law are described in the Privacy page.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">
              6. Changes and governing law
            </h2>
            <p className="text-sm leading-7 text-slate-400">
              These draft terms are intended to be governed by the laws of
              South Africa, subject to any mandatory consumer protections that
              apply to you. Final terms will state when they take effect and
              how material changes will be communicated. Nothing in these terms
              is intended to exclude a right or remedy that applicable law does
              not allow to be excluded.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">
              7. Operator and contact
            </h2>
            <p className="text-sm leading-7 text-slate-400">
              JobHunter is operated by <strong>[LEGAL OPERATOR NAME]</strong>.
              For questions about these terms, contact{" "}
              <SupportContactLink className="font-medium text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200" />
              .
            </p>
          </section>
        </div>
      </main>
      <PublicSiteFooter />
    </div>
  );
}

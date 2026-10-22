import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { SupportContactLink } from "@/components/support-contact-link";

export const metadata = {
  title: "Refunds and Cancellation",
  description: "Draft refund and cancellation policy for JobHunter.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RefundsPage() {
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
              Refunds and Cancellation
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              This draft explains the current free pilot and the intended
              approach for future paid plans. It is not final legal advice or a
              completed refund policy.
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
              <strong>[LEGAL OPERATOR NAME]</strong>, review the policy, and
              confirm it before sharing it as final with PayFast or users.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">
              Current pilot
            </h2>
            <p className="text-sm leading-7 text-slate-400">
              JobHunter is currently in pilot mode. Paid checkout is disabled,
              no paid subscriptions or one-time purchases are currently offered,
              and JobHunter is not currently charging users. Because users are
              not currently charged for access, there are no JobHunter
              subscription payments to refund or cancel during this pilot.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">
              Future subscriptions and cancellation
            </h2>
            <p className="text-sm leading-7 text-slate-400">
              If and when paid plans become available, monthly and annual
              subscriptions will renew automatically unless cancelled. You will
              be shown the price, renewal interval, and cancellation method
              before confirming a purchase. Cancelling will stop future
              renewals; paid access will normally continue until the end of the
              period already paid for, unless applicable law or the purchase
              terms require a different outcome.
            </p>
            <p className="text-sm leading-7 text-slate-400">
              Optional one-time purchases will not renew. Their included
              features and access duration will be shown before payment. There
              will be no subscription renewal to cancel for a one-time purchase.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">
              Future refund requests
            </h2>
            <p className="text-sm leading-7 text-slate-400">
              Once paid services are introduced, refund requests will be
              reviewed fairly based on the circumstances, the service provided,
              and applicable South African consumer law. This draft does not
              waive any right to a refund or other remedy that the law gives
              you. Refunds are not guaranteed in every situation, and the final
              policy will explain any applicable time limits and process before
              checkout is enabled.
            </p>
            <p className="text-sm leading-7 text-slate-400">
              To ask for help with a payment, contact support and provide the
              email address associated with your account, the transaction
              date, and the payment reference or receipt. Do not send full card
              numbers, passwords, or banking login details.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">
              Contact and operator
            </h2>
            <p className="text-sm leading-7 text-slate-400">
              JobHunter is operated by <strong>[LEGAL OPERATOR NAME]</strong>.
              For cancellation or refund questions, contact{" "}
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

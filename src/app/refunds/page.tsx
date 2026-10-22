import { PolicyPageLayout } from "@/components/policy-page-layout";
import { SupportContactLink } from "@/components/support-contact-link";

export const metadata = {
  title: "Refunds and Cancellation",
  description: "Draft refund and cancellation policy for JobHunter.",
  robots: {
    index: false,
    follow: false,
  },
};

const sections = [
  {
    id: "pilot",
    title: "During the current pilot",
    content: (
      <p>
        Paid checkout is disabled. No paid subscriptions or one-time purchases
        are currently offered, and JobHunter is not currently charging users.
        There are therefore no JobHunter subscription payments to refund or
        cancel during this pilot.
      </p>
    ),
  },
  {
    id: "subscriptions",
    title: "Future subscriptions and cancellation",
    content: (
      <>
        <p>
          If and when paid plans become available, monthly and annual
          subscriptions will renew automatically unless cancelled. You will be
          shown the price, renewal interval, and cancellation method before
          confirming a purchase.
        </p>
        <p>
          Cancelling will stop future renewals. Paid access will normally
          continue until the end of the period already paid for, unless
          applicable law or the purchase terms require a different outcome.
        </p>
      </>
    ),
  },
  {
    id: "one-time-purchases",
    title: "One-time purchases",
    content: (
      <p>
        Optional one-time purchases will not renew. Their included features and
        access duration will be shown before payment. There will be no
        subscription renewal to cancel for a one-time purchase.
      </p>
    ),
  },
  {
    id: "refund-requests",
    title: "Future refund requests",
    content: (
      <>
        <p>
          Once paid services are introduced, refund requests will be reviewed
          fairly based on the circumstances, the service provided, and
          applicable South African consumer law. This draft does not waive any
          right to a refund or other remedy the law gives you. Refunds are not
          guaranteed in every situation; the final policy will explain
          applicable time limits and the request process before checkout is
          enabled.
        </p>
        <p>
          To ask for help with a payment, contact support and provide the email
          address associated with your account, transaction date, and payment
          reference or receipt. Do not send full card numbers, passwords, or
          banking login details.
        </p>
      </>
    ),
  },
  {
    id: "operator-contact",
    title: "Operator and contact",
    content: (
      <p>
        JobHunter is operated by <strong>Dimetri Peters</strong>. For
        cancellation or refund questions, contact{" "}
        <SupportContactLink className="font-medium text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200" />
        .
      </p>
    ),
  },
];

export default function RefundsPage() {
  return (
    <PolicyPageLayout
      title="Refunds and Cancellation"
      description="A draft explaining the current free pilot and the intended approach for future paid plans. It is not a final refund policy until reviewed and approved."
      sections={sections}
    />
  );
}

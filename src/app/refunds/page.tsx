import { PolicyPageLayout } from "@/components/policy-page-layout";
import { SupportContactLink } from "@/components/support-contact-link";

export const metadata = {
  title: "Refunds and Cancellation",
  description:
    "How to cancel a JobHunter subscription and request help with a payment or refund.",
};

const sections = [
  {
    id: "subscriptions",
    title: "Subscriptions and cancellation",
    content: (
      <>
        <p>
          JobHunter currently offers monthly and annual subscriptions. The
          selected plan, price, and billing period are shown before checkout.
          Subscriptions renew at the selected interval until cancelled.
        </p>
        <p>
          When available, you can schedule cancellation from Plans &amp; usage.
          A scheduled cancellation stops future renewals, and access continues
          through the paid period. If self-service cancellation is unavailable,
          contact support for help.
        </p>
      </>
    ),
  },
  {
    id: "refund-requests",
    title: "Refund requests",
    content: (
      <>
        <p>
          For payment help or to request a refund, contact support with the
          email address associated with your account, the transaction date,
          and the payment reference or receipt. Requests are reviewed fairly
          based on the circumstances, the service provided, and applicable
          South African consumer law. This policy does not limit any right or
          remedy available under applicable law. A refund is not guaranteed in
          every situation.
        </p>
        <p>
          Do not send full card numbers, passwords, or banking login details.
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
      description="How to cancel a subscription and request help with a payment or refund."
      sections={sections}
    />
  );
}

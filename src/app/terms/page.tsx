import Link from "next/link";
import { PolicyPageLayout } from "@/components/policy-page-layout";
import { SupportContactLink } from "@/components/support-contact-link";

export const metadata = {
  title: "Terms of Service",
  description:
    "Terms for using JobHunter, including subscriptions, cancellation, and account use.",
};

const sections = [
  {
    id: "service",
    title: "The service",
    content: (
      <>
        <p>
          JobHunter is a career-management workspace for organizing job
          applications and exploring career plans. Features may include
          application tracking, AI-assisted job-fit reviews, application
          preparation, and career roadmaps.
        </p>
        <p>
          AI output can be incomplete or inaccurate; review it before relying on
          it. JobHunter does not guarantee employment, interviews, or any
          particular career outcome. It does not make hiring decisions or
          submit applications for you.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Who may use JobHunter",
    content: (
      <p>
        You must be at least 18 years old to create or use a JobHunter account.
        By registering, you confirm that you meet this age requirement. Provide
        accurate account information and keep your sign-in credentials secure.
        You are responsible for activity carried out through your account.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use and your content",
    content: (
      <p>
        Use JobHunter lawfully and do not interfere with its security or
        operation, attempt unauthorized access, or use it to infringe another
        person’s rights. You remain responsible for the resumes, job
        descriptions, messages, and other material you provide. You give
        JobHunter permission to process that material only as needed to provide
        and operate the features you choose, as further described in the{" "}
        <Link
          href="/privacy"
          className="text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200"
        >
          Privacy page
        </Link>
        .
      </p>
    ),
  },
  {
    id: "paid-plans",
    title: "Subscriptions and payment",
    content: (
      <>
        <p>
          JobHunter currently offers monthly and annual subscription plans.
          The selected plan, price, billing period, and included features are
          shown in Plans &amp; usage before checkout. Subscription payments are
          processed through PayFast and renew at the selected interval until
          cancelled.
        </p>
        <p>
          When available, you can schedule cancellation from Plans &amp; usage.
          A scheduled cancellation stops future renewals, and access continues
          through the paid period. If self-service cancellation is unavailable,
          contact support. Refund requests and applicable rights are described
          in the{" "}
          <Link
            href="/refunds"
            className="text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200"
          >
            Refunds and Cancellation policy
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "availability",
    title: "Availability and account closure",
    content: (
      <p>
        JobHunter is an evolving service and may change as features are
        improved. We may restrict or suspend access when reasonably necessary
        to protect users, the service, or its security, or to address unlawful
        or abusive use. You may request account closure by contacting support.
        Data handling and any retention required by law are described in the
        Privacy page.
      </p>
    ),
  },
  {
    id: "law",
    title: "Changes and governing law",
    content: (
      <p>
        These terms are intended to be governed by the laws of South Africa,
        subject to any mandatory consumer protections that apply to you.
        Nothing in these terms is intended to exclude a right or remedy that
        applicable law does not allow to be excluded.
      </p>
    ),
  },
  {
    id: "operator-contact",
    title: "Operator and contact",
    content: (
      <p>
        JobHunter is operated by <strong>Dimetri Peters</strong>. For
        questions about these terms, contact{" "}
        <SupportContactLink className="font-medium text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200" />
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <PolicyPageLayout
      title="Terms of Service"
      description="The rules for using JobHunter, including current subscription billing, cancellation, and account use."
      sections={sections}
    />
  );
}

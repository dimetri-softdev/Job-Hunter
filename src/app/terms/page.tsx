import Link from "next/link";
import { PolicyPageLayout } from "@/components/policy-page-layout";
import { SupportContactLink } from "@/components/support-contact-link";

export const metadata = {
  title: "Terms of Service",
  description:
    "Terms for using JobHunter, including current pilot access and future paid plans.",
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
    title: "Future paid plans",
    content: (
      <>
        <p>
          This section is for a future launch only and does not make paid access
          available now. If paid plans are introduced, the price, currency,
          included features, billing interval, and any applicable taxes will be
          shown before you confirm a purchase. Future plans may include monthly
          or annual subscriptions that renew automatically until cancelled, as
          well as optional one-time purchases that do not renew. The purchase
          screen will state the access period and terms for each one-time
          purchase.
        </p>
        <p>
          Cancelling a paid subscription will stop future renewals. Unless the
          purchase screen says otherwise or applicable law requires otherwise,
          paid access will remain available until the end of the period already
          paid for. A cancellation does not itself incur a penalty. One-time
          purchases will not renew; their access period will be stated before
          purchase. Any refund and usage-based deduction rules will be
          published in the{" "}
          <Link
            href="/refunds"
            className="text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200"
          >
            Refunds and Cancellation policy
          </Link>{" "}
          before checkout is enabled.
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
        These draft terms are intended to be governed by the laws of South
        Africa, subject to any mandatory consumer protections that apply to
        you. Final terms will state when they take effect and how material
        changes will be communicated. Nothing in these terms is intended to
        exclude a right or remedy that applicable law does not allow to be
        excluded.
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
      description="The rules for using JobHunter, including the current free pilot and how any future paid plans are intended to work."
      sections={sections}
    />
  );
}

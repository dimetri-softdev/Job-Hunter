import Link from "next/link";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { SupportContactLink } from "@/components/support-contact-link";

export const metadata = {
  title: "Privacy",
  description:
    "How JobHunter handles account information, applications, documents, and AI features.",
};

const dataWeStore = [
  {
    title: "Account and career profile",
    description:
      "Your sign-in email, name, age-eligibility confirmation, and any career details you choose to add, such as skills, work history, education, target roles, and preferences.",
  },
  {
    title: "Your job search",
    description:
      "Applications and details you save, such as company, role, where you found the role, job description, recruiter or contact name and email, notes, activity history, status-change history, follow-up dates, offers, and fit-review results. AI-generated application drafts are saved only if you choose to add them to an application’s history; deleting that application also deletes its history.",
  },
  {
    title: "Plans and progress",
    description:
      "Roadmaps, project notes or links, completed tasks, and account usage needed to provide the product.",
  },
  {
    title: "Reminder preferences and delivery",
    description:
      "Email reminders are off until enabled by an administrator after delivery setup is complete. Once enabled, users can opt in from Settings. JobHunter stores the preference and whether a reminder was sent for each application follow-up date. Browser reminder history is stored locally in your browser.",
  },
];

const aiFeatures = [
  {
    title: "Google Gemini",
    description:
      "Used for resume-to-job fit reviews and resume-update suggestions. When you request these features and agree, the resume and relevant job or project information are sent for processing.",
  },
  {
    title: "Groq",
    description:
      "Used for the assistant, job-post analysis, career-role suggestions, learning roadmaps, Proof Sprints, application drafts, interview practice, and follow-up sequences. When you explicitly opt in to interview practice, the saved job details are sent to Groq to generate practice questions; an answer is sent only when you request feedback on it. When you explicitly opt in to an AI follow-up sequence, saved details for that application are sent to draft messages. When you request application drafts, the saved career profile and relevant job details are sent to prepare a cover letter, resume-tailoring suggestions, and profile-supported job terms.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100">
      <PublicSiteHeader />
      <main>
        <section className="border-b border-white/10 bg-[#12131a]">
          <div className="mx-auto max-w-4xl px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Privacy at JobHunter
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              This notice explains what information JobHunter handles, how it
              is used to provide the service, and the choices available to you.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl space-y-10 px-6 py-10 sm:px-10 sm:py-14 lg:px-16">
          <section aria-labelledby="information-heading">
            <h2
              id="information-heading"
              className="text-xl font-semibold text-white"
            >
              Information you choose to save
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              JobHunter stores information in your account so it can show your
              profile, applications, and plans when you return.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {dataWeStore.map((item) => (
                <li
                  key={item.title}
                  className="rounded-xl border border-white/10 bg-[#101119] p-4"
                >
                  <h3 className="text-sm font-semibold text-slate-100">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="uploads-heading"
            className="rounded-xl border border-blue-400/15 bg-blue-500/[0.05] p-5 sm:p-6"
          >
            <h2
              id="uploads-heading"
              className="text-xl font-semibold text-white"
            >
              Resumes and files
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              The resume upload features process the file to produce the result
              you request; the app code does not save the uploaded resume file
              to your account. The resume content is sent to the relevant AI
              provider for that feature. Some results, such as a roadmap, can
              then be saved to your account. Job descriptions and any results
              you choose to save with an application remain part of that saved
              application until you delete them. In the signed-in career
              assistant, you can attach a PDF, DOCX, or TXT file up to 5 MB.
              JobHunter processes the document temporarily, extracts its text,
              and does not retain the uploaded file. Scanned or image-only PDFs
              are not supported.
            </p>
          </section>

          <section aria-labelledby="ai-heading">
            <h2 id="ai-heading" className="text-xl font-semibold text-white">
              When you use AI features
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              When you send an assistant message, the message and recent chat
              history are processed by Groq; there is no separate agreement
              checkbox. The chat displays this before you send. JobHunter does
              not fetch saved career or application information unless you
              enable saved-data sharing and select the information to include.
              That choice is remembered on your device until you turn it off.
              Attached documents are sent only after you confirm sharing that
              specific file. Other AI features request consent before
              processing. Only information needed for the feature you choose
              is intended to be sent.
            </p>
            <ul className="mt-5 space-y-3">
              {aiFeatures.map((item) => (
                <li
                  key={item.title}
                  className="rounded-xl border border-white/10 bg-[#101119] p-4"
                >
                  <h3 className="text-sm font-semibold text-slate-100">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              JobHunter does not save assistant conversations to your account.
              The conversation is kept in the open chat in your browser until
              you clear it or close the chat. AI providers process information
              under their own terms and policies. Their retention practices are
              separate from JobHunter, and they may retain submitted
              information according to their terms. Confirming an
              attachment sends its extracted text—not a stored copy of the
              uploaded file—to Groq with your message.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              AI responses can be inaccurate. Review suggestions yourself;
              JobHunter does not make hiring decisions or submit job
              applications for you.
            </p>
          </section>

          <section aria-labelledby="reminders-heading">
            <h2
              id="reminders-heading"
              className="text-xl font-semibold text-white"
            >
              Follow-up reminders
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Email reminders are disabled until an administrator enables the
              feature after delivery setup is complete; users must then opt in
              from Settings. To deliver them, JobHunter sends your account
              email address and the application company, role, and follow-up
              date to Resend. Delivery status and attempt time are recorded to
              prevent duplicate emails and permit retries after a failure. You
              can opt out at any time; deleting an application removes its
              reminder delivery record.
              Browser notifications are handled by your browser while the
              signed-in dashboard is open, and JobHunter stores their
              once-per-date display marker on that device.
            </p>
          </section>

          <section aria-labelledby="control-heading">
            <h2
              id="control-heading"
              className="text-xl font-semibold text-white"
            >
              Your choices and account data
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              You can edit your career profile and delete saved applications,
              generated content, or roadmaps in the app. Account deletion
              currently requires administrator action; there is no self-service
              account-deletion control.
            </p>
          </section>

          <section aria-labelledby="advertising-heading">
            <h2
              id="advertising-heading"
              className="text-xl font-semibold text-white"
            >
              Advertising
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              If an administrator enables advertising and configures Google
              AdSense, ad placements may appear on the public home page and in
              the signed-in workspace. Google may process browser, device, and
              interaction information, and may use cookies or similar
              technologies to serve and measure ads. Google handles that
              information under its own privacy terms. Ads remain disabled until
              an administrator enables them. We will provide any consent
              experience required for the regions where JobHunter operates
              before enabling ad delivery.
            </p>
          </section>

          <section aria-labelledby="contact-heading">
            <h2
              id="contact-heading"
              className="text-xl font-semibold text-white"
            >
              Questions or privacy requests
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Contact JobHunter at{" "}
              <SupportContactLink
                className="font-medium text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200"
              >
              </SupportContactLink>
              .
            </p>
          </section>

          <p className="text-sm text-slate-400">
            For a tour of the product, see the{" "}
            <Link
              href="/guide"
              className="font-medium text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200"
            >
              JobHunter guide
            </Link>
            .
          </p>
        </div>
      </main>
      <PublicSiteFooter />
    </div>
  );
}

import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Search,
  ShieldCheck,
} from "lucide-react";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";

export const metadata = {
  title: "Free Job Search Planner and Tracker",
  description:
    "A practical, free guide to choosing target roles, evaluating job postings, tracking applications, and planning follow-ups.",
  alternates: {
    canonical: "/resources/job-search-planner",
  },
};

const roleExamples = [
  {
    role: "Product designer",
    evidence: "Two shipped onboarding improvements; usability research",
    check: "Does the team expect visual design, research, or both?",
  },
  {
    role: "Customer success manager",
    evidence: "Renewal support, customer training, issue triage",
    check: "Is the portfolio individual, team-based, or mixed?",
  },
  {
    role: "Junior data analyst",
    evidence: "SQL course project; monthly reporting in a spreadsheet",
    check: "Which tools are required on day one?",
  },
];

const trackerColumns = [
  "Company and role",
  "Job link and source",
  "Date saved and application deadline",
  "Top requirements and your evidence",
  "Application date and current stage",
  "Contact name and last contact date",
  "Next action and due date",
  "Outcome and lesson learned",
];

export default function JobSearchPlannerPage() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100">
      <PublicSiteHeader />
      <main>
        <section className="border-b border-white/10 bg-[#12131a]">
          <div className="mx-auto max-w-5xl px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">
              Free job-search resource
            </p>
            <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              A practical job search planner you can use today
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              A job search gets easier to manage when you turn it into a small
              set of repeatable decisions. Use this guide to choose roles,
              compare your experience with a posting, keep track of follow-ups,
              and learn from each application. You can use the steps with a
              notebook or download the free tracker—no account required.
            </p>
            <a
              href="/job-search-tracker.csv"
              download
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              <ArrowDownToLine className="size-4" aria-hidden="true" />
              Download the free tracker (CSV)
            </a>
          </div>
        </section>

        <div className="mx-auto max-w-5xl space-y-12 px-6 py-10 sm:px-10 sm:py-14 lg:px-16">
          <section aria-labelledby="target-heading">
            <div className="flex items-start gap-3">
              <Search
                className="mt-1 size-5 shrink-0 text-blue-300"
                aria-hidden="true"
              />
              <div>
                <h2
                  id="target-heading"
                  className="text-xl font-semibold text-white sm:text-2xl"
                >
                  1. Choose a focused set of target roles
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Start with one to three related job titles. For each, write
                  down the work you want to do, the strengths you can already
                  demonstrate, and any practical constraints such as location,
                  schedule, work authorization, or compensation. This gives
                  you a useful filter without assuming every employer uses the
                  same title.
                </p>
              </div>
            </div>
            <div className="mt-5 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead className="bg-[#151722] text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th scope="col" className="p-3 font-medium">Example target</th>
                    <th scope="col" className="p-3 font-medium">Evidence to look for in your experience</th>
                    <th scope="col" className="p-3 font-medium">Question to check in a posting</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.08] bg-[#101119] text-slate-300">
                  {roleExamples.map((example) => (
                    <tr key={example.role}>
                      <th scope="row" className="p-3 font-medium text-white">
                        {example.role}
                      </th>
                      <td className="p-3 leading-6">{example.evidence}</td>
                      <td className="p-3 leading-6">{example.check}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="evaluate-heading">
            <div className="flex items-start gap-3">
              <ClipboardList
                className="mt-1 size-5 shrink-0 text-violet-300"
                aria-hidden="true"
              />
              <div>
                <h2
                  id="evaluate-heading"
                  className="text-xl font-semibold text-white sm:text-2xl"
                >
                  2. Evaluate a posting before spending time applying
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Separate what the employer explicitly asks for from what
                  you infer. Mark each important requirement as{" "}
                  <strong className="font-semibold text-slate-200">
                    evidence I can show
                  </strong>
                  ,{" "}
                  <strong className="font-semibold text-slate-200">
                    related experience
                  </strong>
                  , or{" "}
                  <strong className="font-semibold text-slate-200">
                    unclear or missing
                  </strong>
                  . Use a concrete example for the first two. For unclear
                  items, decide whether to ask a recruiter, research the
                  company, or proceed without assuming.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      title: "Required work",
                      body: "Which responsibilities appear repeatedly, and which are central to the role?",
                    },
                    {
                      title: "Proof",
                      body: "What project, result, customer interaction, or responsibility can substantiate each claim?",
                    },
                    {
                      title: "Practical fit",
                      body: "Check location, schedule, compensation range if listed, eligibility, and application deadline.",
                    },
                  ].map((item) => (
                    <article
                      key={item.title}
                      className="rounded-xl border border-white/10 bg-[#101119] p-4"
                    >
                      <h3 className="text-sm font-semibold text-white">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {item.body}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="tailor-heading">
            <div className="flex items-start gap-3">
              <CheckCircle2
                className="mt-1 size-5 shrink-0 text-emerald-300"
                aria-hidden="true"
              />
              <div>
                <h2
                  id="tailor-heading"
                  className="text-xl font-semibold text-white sm:text-2xl"
                >
                  3. Tailor your application with accurate evidence
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Put the most relevant, truthful experience where a reader can
                  find it quickly. A useful bullet often explains the action,
                  the scope, and the result or learning. For example, replace
                  “helped with customer onboarding” with a specific account of
                  what you did, who it helped, and what changed—only when those
                  details are accurate. Never add tools, outcomes, or
                  qualifications you cannot support.
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Follow the application instructions, check names and dates,
                  and open exported documents once before sending. Save the
                  version you submitted so you can prepare for a conversation
                  about it later.
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="tracker-heading">
            <div className="flex items-start gap-3">
              <ClipboardList
                className="mt-1 size-5 shrink-0 text-amber-200"
                aria-hidden="true"
              />
              <div>
                <h2
                  id="tracker-heading"
                  className="text-xl font-semibold text-white sm:text-2xl"
                >
                  4. Track the next action, not just the application count
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  A tracker is useful when it helps you remember a decision or
                  commitment. Record enough to follow up, but avoid putting
                  passwords, identity documents, or sensitive personal details
                  in it. The downloadable CSV is a blank starter template;
                  open it in a spreadsheet app and save your own copy.
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {trackerColumns.map((column) => (
                    <li
                      key={column}
                      className="flex items-start gap-2 text-sm leading-6 text-slate-300"
                    >
                      <CheckCircle2
                        className="mt-1 size-4 shrink-0 text-emerald-300"
                        aria-hidden="true"
                      />
                      {column}
                    </li>
                  ))}
                </ul>
                <a
                  href="/job-search-tracker.csv"
                  download
                  className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-medium text-slate-200 transition hover:bg-white/[0.05]"
                >
                  <ArrowDownToLine className="size-4" aria-hidden="true" />
                  Download the tracker
                </a>
              </div>
            </div>
          </section>

          <section aria-labelledby="followup-heading">
            <div className="flex items-start gap-3">
              <CheckCircle2
                className="mt-1 size-5 shrink-0 text-sky-300"
                aria-hidden="true"
              />
              <div>
                <h2
                  id="followup-heading"
                  className="text-xl font-semibold text-white sm:text-2xl"
                >
                  5. Make follow-ups specific and considerate
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Follow the employer’s stated timeline and contact preference.
                  If no timeline was given, one concise check-in after a
                  reasonable interval is usually more useful than repeated
                  messages. Respect a request not to follow up.
                </p>
                <div className="mt-4 rounded-xl border border-white/10 bg-[#101119] p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Editable example
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Subject: Following up — [role title]
                    <br />
                    <br />
                    Hello [name],
                    <br />
                    I applied for [role] on [date] and wanted to check whether
                    there is an update on the process. I remain interested
                    because [specific, genuine reason]. Please let me know if
                    you need anything else from me.
                    <br />
                    <br />
                    Thank you,
                    <br />
                    [your name]
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="weekly-heading">
            <h2
              id="weekly-heading"
              className="text-xl font-semibold text-white sm:text-2xl"
            >
              6. Use a sustainable weekly review
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Pick a routine that fits your time and energy; there is no
              universal application target. At the end of the week, review
              upcoming deadlines, send any promised follow-ups, prepare for
              scheduled interviews, and note one thing to improve. If a
              strategy is not producing relevant conversations, reassess the
              target roles, evidence, and application approach rather than
              simply increasing volume.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Plan", "Choose a few realistic blocks of time and identify the next concrete tasks."],
                ["Do", "Research roles, prepare targeted applications, or practice examples."],
                ["Review", "Capture replies, deadlines, lessons, and the next action."],
              ].map(([title, body]) => (
                <article
                  key={title}
                  className="rounded-xl border border-white/10 bg-[#101119] p-4"
                >
                  <h3 className="text-sm font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {body}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <aside className="rounded-xl border border-blue-400/15 bg-blue-500/[0.05] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck
                className="mt-0.5 size-5 shrink-0 text-blue-300"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Protect yourself during your search
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Be cautious if someone asks you to pay to get a job, deposit
                  a check and return money, or share banking details before
                  verified employment. Check that messages come from a
                  legitimate company channel, and confirm unusual requests
                  independently. Do not send sensitive documents until you
                  have verified the recipient and understand why they need
                  them.
                </p>
              </div>
            </div>
          </aside>

          <section className="border-t border-white/10 pt-8">
            <p className="text-sm leading-6 text-slate-400">
              Job searches differ by industry, location, and personal
              circumstances. This guide is an organizational aid, not a
              guarantee of an interview or offer. For a walkthrough of
              JobHunter’s optional application and planning tools, read the{" "}
              <Link
                href="/guide"
                className="font-medium text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200"
              >
                product guide
              </Link>
              . You can use the downloadable tracker without creating an
              account.
            </p>
            <Link
              href="/guide"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition hover:text-blue-200"
            >
              Explore the JobHunter guide
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </section>
        </div>
      </main>
      <PublicSiteFooter />
    </div>
  );
}

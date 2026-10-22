"use client";

import { useState } from "react";
import {
  CalendarClock,
  Loader2,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetcher } from "@/lib/api";

interface PracticeQuestion {
  category: "behavioral" | "role-specific" | "situational" | "fit";
  question: string;
  focus: string;
}

interface AnswerFeedback {
  strengths: string[];
  improvements: string[];
  answerStructure: string;
  followUpQuestion: string;
}

function buildPracticePrompts(
  position: string,
  strengths: string[],
  gaps: string[],
  questionsToConfirm: string[],
) {
  const prompts = [
    strengths[0]
      ? `Prepare a specific example that demonstrates this strength: ${strengths[0]}`
      : `What relevant experience makes you a strong candidate for the ${position} role?`,
    gaps[0]
      ? `How would you respond if asked about this area: ${gaps[0]}? Be honest and connect it to related experience or learning.`
      : `Describe a challenging problem you solved and how you approached it.`,
    questionsToConfirm[0]
      ? `How would you clarify this open question about your experience: ${questionsToConfirm[0]}?`
      : `What would you focus on learning or achieving in your first 90 days?`,
  ];
  return [...new Set(prompts)];
}

export function InterviewPrep({
  applicationId,
  company,
  position,
  strengths = [],
  gaps = [],
  questionsToConfirm = [],
}: {
  applicationId: string;
  company: string;
  position: string;
  strengths?: string[];
  gaps?: string[];
  questionsToConfirm?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [practiceFeedback, setPracticeFeedback] = useState<
    Record<string, AnswerFeedback>
  >({});
  const prompts = practiceQuestions.length
    ? practiceQuestions.map((item) => item.question)
    : buildPracticePrompts(
    position,
    strengths,
    gaps,
    questionsToConfirm,
  );

  async function generatePracticeQuestions() {
    if (!aiConsent) {
      setError("Confirm consent before sending saved job details for AI practice.");
      return;
    }
    setGeneratingQuestions(true);
    setError(null);
    try {
      const result = await fetcher<{ questions: PracticeQuestion[] }>(
        `/applications/${encodeURIComponent(applicationId)}/interview-practice`,
        {
          method: "POST",
          body: JSON.stringify({
            aiProcessingConsent: aiConsent,
            action: "questions",
          }),
        },
      );
      if (!Array.isArray(result.questions) || result.questions.length < 4) {
        throw new Error("The interview practice response was incomplete. Try again.");
      }
      setPracticeQuestions(result.questions);
      setPracticeAnswers({});
      setPracticeFeedback({});
    } catch (practiceError: unknown) {
      setError(
        practiceError instanceof Error
          ? practiceError.message
          : "Unable to generate interview questions.",
      );
    } finally {
      setGeneratingQuestions(false);
    }
  }

  async function coachAnswer(question: string) {
    const answer = practiceAnswers[question]?.trim();
    if (!answer) {
      setError("Write an answer before requesting feedback.");
      return;
    }
    if (!aiConsent) {
      setError("Confirm consent before sending your answer for AI feedback.");
      return;
    }
    setFeedbackFor(question);
    setError(null);
    try {
      const result = await fetcher<AnswerFeedback>(
        `/applications/${encodeURIComponent(applicationId)}/interview-practice`,
        {
          method: "POST",
          body: JSON.stringify({
            aiProcessingConsent: aiConsent,
            action: "feedback",
            question,
            answer,
          }),
        },
      );
      setPracticeFeedback((current) => ({ ...current, [question]: result }));
    } catch (feedbackError: unknown) {
      setError(
        feedbackError instanceof Error
          ? feedbackError.message
          : "Unable to review this answer.",
      );
    } finally {
      setFeedbackFor(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const interviewAt = String(data.get("interviewAt") ?? "").trim();
    const format = String(data.get("format") ?? "Not set");
    const interviewer = String(data.get("interviewer") ?? "").trim();
    const questionsForEmployer = String(
      data.get("questionsForEmployer") ?? "",
    ).trim();
    const additionalNotes = String(data.get("additionalNotes") ?? "").trim();
    const savedAnswers = prompts
      .map((prompt) => ({
        prompt,
        answer: practiceAnswers[prompt]?.trim() ?? "",
      }))
      .filter((item) => item.answer);

    const aiPracticeNotes = practiceQuestions.map((item) => {
      const answer = practiceAnswers[item.question]?.trim();
      const feedback = practiceFeedback[item.question];
      return [
        `${item.category.toLocaleUpperCase()} QUESTION: ${item.question}`,
        `Interviewer focus: ${item.focus}`,
        answer ? `My answer: ${answer}` : "",
        feedback
          ? [
              `What worked: ${feedback.strengths.join("; ")}`,
              `To improve: ${feedback.improvements.join("; ")}`,
              `Answer structure: ${feedback.answerStructure}`,
              `Follow-up to practice: ${feedback.followUpQuestion}`,
            ].join("\n")
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    });

    const sections = [
      `Interview preparation · ${position} at ${company}`,
      interviewAt
        ? `Interview date and time: ${new Date(interviewAt).toLocaleString()}`
        : "",
      `Format: ${format}`,
      interviewer ? `Interviewer: ${interviewer}` : "",
      `Practice prompts:\n${prompts
        .map((prompt, index) => {
          const answer = savedAnswers.find((item) => item.prompt === prompt)?.answer;
          return `${index + 1}. ${prompt}${answer ? `\n   My example: ${answer}` : ""}`;
        })
        .join("\n")}`,
      aiPracticeNotes.length
        ? `AI interview practice:\n${aiPracticeNotes.join("\n\n")}`
        : "",
      questionsForEmployer
        ? `Questions to ask:\n${questionsForEmployer}`
        : "",
      additionalNotes ? `Additional notes:\n${additionalNotes}` : "",
    ].filter(Boolean);
    const detail = sections.join("\n\n");

    if (detail.length > 6000) {
      setError("This prep note is too long. Shorten your answers and try again.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await fetcher(
        `/applications/${encodeURIComponent(applicationId)}/activities`,
        {
          method: "POST",
          body: JSON.stringify({ kind: "INTERVIEW", detail }),
        },
      );
      setSaved(true);
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save interview preparation.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setError(null);
          setSaved(false);
          setAiConsent(false);
          setPracticeQuestions([]);
          setPracticeAnswers({});
          setPracticeFeedback({});
        }
      }}
    >
      <DialogTrigger className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 text-[11px] font-medium text-amber-200 transition hover:bg-amber-500/20">
        <MessageSquareText className="size-3.5" aria-hidden="true" />
        Interview prep
      </DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden border-[#1f212d] bg-[#0d0e14] p-0 text-slate-100 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-[#1f212d] px-6 py-5 pr-12">
          <DialogTitle className="text-white">
            Prepare for your interview
          </DialogTitle>
          <DialogDescription className="text-xs leading-5 text-slate-400">
            {position} at {company}. Start with private practice prompts, or
            opt in to AI-generated questions and answer coaching based on this
            saved job.
          </DialogDescription>
        </DialogHeader>

        {saved ? (
          <div className="space-y-4 px-6 py-8">
            <p role="status" className="text-sm font-medium text-emerald-200">
              Your preparation is saved in this application&apos;s History &amp;
              updates.
            </p>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setOpen(false)}
                className="bg-blue-600 text-white hover:bg-blue-500"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <section className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor={`interview-date-${applicationId}`}
                    className="text-xs font-medium text-slate-300"
                  >
                    Interview date and time{" "}
                    <span className="text-slate-500">(optional)</span>
                  </label>
                  <Input
                    id={`interview-date-${applicationId}`}
                    name="interviewAt"
                    type="datetime-local"
                    className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor={`interview-format-${applicationId}`}
                    className="text-xs font-medium text-slate-300"
                  >
                    Format
                  </label>
                  <select
                    id={`interview-format-${applicationId}`}
                    name="format"
                    className="h-10 w-full rounded-lg border border-[#2b2e3b] bg-[#090a0f] px-3 text-sm text-white outline-none focus-visible:border-blue-400"
                  >
                    <option>Not set</option>
                    <option>Phone</option>
                    <option>Video call</option>
                    <option>In person</option>
                    <option>Panel</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label
                    htmlFor={`interviewer-${applicationId}`}
                    className="text-xs font-medium text-slate-300"
                  >
                    Interviewer{" "}
                    <span className="text-slate-500">(optional)</span>
                  </label>
                  <Input
                    id={`interviewer-${applicationId}`}
                    name="interviewer"
                    maxLength={160}
                    placeholder="Name or role"
                    className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                  />
                </div>
              </section>

              <section className="space-y-3">
                <div className="rounded-xl border border-violet-400/20 bg-violet-500/[0.05] p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles
                      className="mt-0.5 size-4 shrink-0 text-violet-300"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          AI mock interview
                        </h3>
                        <p className="mt-1 text-[11px] leading-4 text-slate-400">
                          Generate targeted questions, draft your own answers,
                          and get practical feedback. AI requests count toward
                          your interview-practice allowance.
                        </p>
                      </div>
                      <label className="flex items-start gap-2 text-[11px] leading-4 text-slate-300">
                        <input
                          type="checkbox"
                          checked={aiConsent}
                          onChange={(event) => setAiConsent(event.target.checked)}
                          className="mt-0.5 size-4 shrink-0 rounded border-slate-500 bg-slate-900"
                        />
                        I agree to send this job&apos;s saved details and the
                        answers I choose to review to AI for interview coaching.
                      </label>
                      <Button
                        type="button"
                        onClick={() => void generatePracticeQuestions()}
                        disabled={generatingQuestions || !aiConsent}
                        className="gap-2 bg-violet-600 text-white hover:bg-violet-500"
                      >
                        {generatingQuestions ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Sparkles className="size-4" aria-hidden="true" />
                        )}
                        {generatingQuestions
                          ? "Building practice round..."
                          : practiceQuestions.length
                            ? "Regenerate questions"
                            : "Generate practice questions"}
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {practiceQuestions.length
                      ? "Practice your answers"
                      : "Prepare your examples"}
                  </h3>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    {practiceQuestions.length
                      ? "Keep each answer truthful. You can request coaching for any answer you write."
                      : "These private prompts use saved fit notes in your browser. Use real examples; if you lack direct experience, explain related work or learning."}
                  </p>
                </div>
                {prompts.map((prompt, index) => (
                  <div key={prompt} className="space-y-2">
                    <label
                      htmlFor={`interview-answer-${applicationId}-${index}`}
                      className="text-xs leading-5 text-slate-300"
                    >
                      {prompt}
                    </label>
                    {practiceQuestions[index] ? (
                      <p className="text-[10px] leading-4 text-slate-500">
                        {practiceQuestions[index].category.replace("-", " ")} ·{" "}
                        {practiceQuestions[index].focus}
                      </p>
                    ) : null}
                    <Textarea
                      id={`interview-answer-${applicationId}-${index}`}
                      name={`answer-${index}`}
                      maxLength={1200}
                      rows={3}
                      value={practiceAnswers[prompt] ?? ""}
                      onChange={(event) =>
                        setPracticeAnswers((current) => ({
                          ...current,
                          [prompt]: event.target.value,
                        }))
                      }
                      placeholder="Outline the situation, what you did, and the result. Keep it truthful and specific."
                      className="resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                    />
                    {practiceQuestions.length > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void coachAnswer(prompt)}
                        disabled={
                          !aiConsent ||
                          !practiceAnswers[prompt]?.trim() ||
                          feedbackFor !== null
                        }
                        className="h-8 gap-1.5 border-violet-400/20 text-[11px] text-violet-200 hover:bg-violet-500/10"
                      >
                        {feedbackFor === prompt ? (
                          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Sparkles className="size-3.5" aria-hidden="true" />
                        )}
                        {feedbackFor === prompt
                          ? "Reviewing answer..."
                          : practiceFeedback[prompt]
                            ? "Review answer again"
                            : "Get answer feedback"}
                      </Button>
                    ) : null}
                    {practiceFeedback[prompt] ? (
                      <div className="space-y-3 rounded-lg border border-emerald-400/15 bg-emerald-500/[0.04] p-3 text-[11px] leading-5">
                        <div>
                          <h4 className="font-semibold text-emerald-200">What works</h4>
                          <ul className="mt-1 list-disc space-y-1 pl-4 text-slate-300">
                            {practiceFeedback[prompt].strengths.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-200">What to strengthen</h4>
                          <ul className="mt-1 list-disc space-y-1 pl-4 text-slate-300">
                            {practiceFeedback[prompt].improvements.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-slate-300">
                          <span className="font-semibold text-violet-200">
                            Try this structure:
                          </span>{" "}
                          {practiceFeedback[prompt].answerStructure}
                        </p>
                        <p className="text-slate-400">
                          Follow-up to practice:{" "}
                          {practiceFeedback[prompt].followUpQuestion}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </section>

              <section className="space-y-3">
                <div className="space-y-2">
                  <label
                    htmlFor={`interview-questions-${applicationId}`}
                    className="text-xs font-medium text-slate-300"
                  >
                    Questions you want to ask them
                  </label>
                  <Textarea
                    id={`interview-questions-${applicationId}`}
                    name="questionsForEmployer"
                    maxLength={1200}
                    rows={3}
                    placeholder={"What would success look like in the first 90 days?\nHow does the team support learning and feedback?"}
                    className="resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor={`interview-notes-${applicationId}`}
                    className="text-xs font-medium text-slate-300"
                  >
                    Other preparation notes
                  </label>
                  <Textarea
                    id={`interview-notes-${applicationId}`}
                    name="additionalNotes"
                    maxLength={1000}
                    rows={2}
                    placeholder="Logistics, topics to review, or anything you want to remember."
                    className="resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                  />
                </div>
              </section>

              {error && (
                <p role="alert" className="text-xs text-rose-300">
                  {error}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#1f212d] px-6 py-4">
              <p className="hidden items-center gap-1.5 text-[10px] text-slate-500 sm:flex">
                <CalendarClock className="size-3.5" aria-hidden="true" />
                Saved privately to this job&apos;s history
              </p>
              <Button
                type="submit"
                disabled={saving}
                className="ml-auto bg-amber-600 text-white hover:bg-amber-500"
              >
                {saving && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {saving ? "Saving preparation..." : "Save interview prep"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

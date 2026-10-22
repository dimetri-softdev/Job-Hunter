"use client";

import { useState } from "react";
import { CalendarClock, Loader2, MessageSquareText } from "lucide-react";
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
  const prompts = buildPracticePrompts(
    position,
    strengths,
    gaps,
    questionsToConfirm,
  );

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
    const practiceAnswers = prompts
      .map((prompt, index) => ({
        prompt,
        answer: String(data.get(`answer-${index}`) ?? "").trim(),
      }))
      .filter((item) => item.answer);

    const sections = [
      `Interview preparation · ${position} at ${company}`,
      interviewAt
        ? `Interview date and time: ${new Date(interviewAt).toLocaleString()}`
        : "",
      `Format: ${format}`,
      interviewer ? `Interviewer: ${interviewer}` : "",
      `Practice prompts:\n${prompts
        .map((prompt, index) => {
          const answer = practiceAnswers.find((item) => item.prompt === prompt)?.answer;
          return `${index + 1}. ${prompt}${answer ? `\n   My example: ${answer}` : ""}`;
        })
        .join("\n")}`,
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
            {position} at {company}. These prompts use the fit notes already
            saved for this job. Nothing is sent to an AI provider.
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
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Prepare your examples
                  </h3>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    Use real examples. If you do not have direct experience,
                    explain what related work or learning you can bring.
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
                    <Textarea
                      id={`interview-answer-${applicationId}-${index}`}
                      name={`answer-${index}`}
                      maxLength={1200}
                      rows={3}
                      placeholder="Outline the situation, what you did, and the result. Keep it truthful and specific."
                      className="resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                    />
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

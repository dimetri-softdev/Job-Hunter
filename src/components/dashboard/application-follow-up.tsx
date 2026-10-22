"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Mail, Save, Send, Sparkles } from "lucide-react";
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

interface FollowUpMessage {
  timing: string;
  purpose: string;
  subject: string;
  body: string;
}

type SequenceFocus = "after-application" | "after-interview" | "no-response";

function createFollowUpDraft(position: string, company: string, status: string) {
  const subject = `Following up: ${position} application`;
  const opening =
    status === "INTERVIEWING" || status === "PHONE_SCREEN"
      ? `Thank you for speaking with me about the ${position} role at ${company}.`
      : `I’m following up on my application for the ${position} role at ${company}.`;
  const body = [
    "Hello,",
    "",
    opening,
    "",
    status === "INTERVIEWING" || status === "PHONE_SCREEN"
      ? "I remain interested in the opportunity. Please let me know if there is anything else I can provide."
      : "I remain interested in the opportunity and would appreciate any update you are able to share.",
    "",
    "Thank you for your time.",
    "",
    "Kind regards,",
    "[Your name]",
  ].join("\n");

  return { subject, body };
}

export function ApplicationFollowUp({
  applicationId,
  company,
  position,
  status,
  contactEmail,
}: {
  applicationId: string;
  company: string;
  position: string;
  status: string;
  contactEmail?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState(contactEmail ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"quick" | "sequence">("quick");
  const [sequenceFocus, setSequenceFocus] =
    useState<SequenceFocus>("after-application");
  const [aiConsent, setAiConsent] = useState(false);
  const [generatingSequence, setGeneratingSequence] = useState(false);
  const [sequence, setSequence] = useState<FollowUpMessage[]>([]);
  const [sequenceSaved, setSequenceSaved] = useState<number[]>([]);
  const [copiedSequenceIndex, setCopiedSequenceIndex] = useState<number | null>(
    null,
  );

  function prepareDraft() {
    const draft = createFollowUpDraft(position, company, status);
    setRecipient(contactEmail ?? "");
    setSubject(draft.subject);
    setBody(draft.body);
    setCopied(false);
    setSaved(false);
    setError(null);
    setMode("quick");
    setSequenceFocus(
      status === "INTERVIEWING" || status === "PHONE_SCREEN"
        ? "after-interview"
        : "after-application",
    );
    setAiConsent(false);
    setSequence([]);
    setSequenceSaved([]);
    setCopiedSequenceIndex(null);
  }

  async function generateSequence() {
    if (!aiConsent) {
      setError("Consent is required before sending saved job details to AI.");
      return;
    }
    setGeneratingSequence(true);
    setError(null);
    try {
      const result = await fetcher<{ messages: FollowUpMessage[] }>(
        `/applications/${encodeURIComponent(applicationId)}/follow-up-sequence`,
        {
          method: "POST",
          body: JSON.stringify({
            aiProcessingConsent: aiConsent,
            focus: sequenceFocus,
          }),
        },
      );
      if (
        !Array.isArray(result.messages) ||
        result.messages.length !== 3 ||
        result.messages.some(
          (message) =>
            !message.timing ||
            !message.purpose ||
            !message.subject ||
            !message.body,
        )
      ) {
        throw new Error("The generated sequence was incomplete. Please try again.");
      }
      setSequence(result.messages);
      setSequenceSaved([]);
      setCopiedSequenceIndex(null);
    } catch (generationError: unknown) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate the follow-up sequence.",
      );
    } finally {
      setGeneratingSequence(false);
    }
  }

  function updateSequenceMessage(
    index: number,
    field: "subject" | "body",
    value: string,
  ) {
    setSequence((current) =>
      current.map((message, messageIndex) =>
        messageIndex === index ? { ...message, [field]: value } : message,
      ),
    );
    setSequenceSaved((current) => current.filter((item) => item !== index));
  }

  async function copySequenceMessage(message: FollowUpMessage, index: number) {
    try {
      await navigator.clipboard.writeText(
        `To: ${recipient || "[recipient email]"}\nSubject: ${message.subject}\n\n${message.body}`,
      );
      setCopiedSequenceIndex(index);
      setError(null);
    } catch {
      setError("Clipboard access failed. Select and copy the message instead.");
    }
  }

  async function saveSequenceMessage(message: FollowUpMessage, index: number) {
    if (sequenceSaved.includes(index)) return;
    const detail = [
      `AI follow-up draft · not sent · ${message.timing}`,
      recipient ? `To: ${recipient}` : "",
      `Purpose: ${message.purpose}`,
      `Subject: ${message.subject.trim()}`,
      message.body.trim(),
    ]
      .filter(Boolean)
      .join("\n\n");
    if (!message.subject.trim() || !message.body.trim()) {
      setError("Add a subject and message before saving this draft.");
      return;
    }
    if (detail.length > 6000) {
      setError("This draft is too long to save to application history.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await fetcher(
        `/applications/${encodeURIComponent(applicationId)}/activities`,
        {
          method: "POST",
          body: JSON.stringify({ kind: "EMAIL", detail }),
        },
      );
      setSequenceSaved((current) => [...current, index]);
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save this follow-up draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(
        `To: ${recipient || "[recipient email]"}\nSubject: ${subject}\n\n${body}`,
      );
      setCopied(true);
      setError(null);
    } catch {
      setError("Clipboard access failed. Select and copy the message instead.");
    }
  }

  async function saveDraft() {
    if (saved) return;
    const detail = [
      "Email draft · not sent",
      recipient ? `To: ${recipient}` : "",
      `Subject: ${subject.trim()}`,
      body.trim(),
    ]
      .filter(Boolean)
      .join("\n\n");

    if (!subject.trim() || !body.trim()) {
      setError("Add a subject and message before saving this draft.");
      return;
    }
    if (detail.length > 6000) {
      setError("This draft is too long to save to application history.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await fetcher(
        `/applications/${encodeURIComponent(applicationId)}/activities`,
        {
          method: "POST",
          body: JSON.stringify({ kind: "EMAIL", detail }),
        },
      );
      setSaved(true);
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save this email draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  const emailHref = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) prepareDraft();
      }}
    >
      <DialogTrigger className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 text-[11px] font-medium text-sky-200 transition hover:bg-sky-500/20">
        <Mail className="size-3.5" aria-hidden="true" />
        Draft follow-up
      </DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden border-[#1f212d] bg-[#0d0e14] p-0 text-slate-100 sm:max-w-xl">
        <DialogHeader className="shrink-0 border-b border-[#1f212d] px-6 py-5 pr-12">
          <DialogTitle className="text-white">Draft a follow-up</DialogTitle>
          <DialogDescription className="text-xs leading-5 text-slate-400">
            Prepare an editable message for {position} at {company}, or
            generate a multi-step follow-up sequence. JobHunter will not send
            emails for you.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={mode === "quick" ? "default" : "outline"}
              onClick={() => setMode("quick")}
              className="h-8 text-xs"
            >
              Quick draft
            </Button>
            <Button
              type="button"
              variant={mode === "sequence" ? "default" : "outline"}
              onClick={() => setMode("sequence")}
              className="h-8 gap-1.5 text-xs"
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              AI follow-up sequence
            </Button>
          </div>
          {mode === "quick" ? (
          <>
          <div className="space-y-2">
            <label
              htmlFor={`follow-up-recipient-${applicationId}`}
              className="text-xs font-medium text-slate-300"
            >
              To
            </label>
            <Input
              id={`follow-up-recipient-${applicationId}`}
              type="email"
              maxLength={254}
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="recruiter@example.com"
              className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={`follow-up-subject-${applicationId}`}
              className="text-xs font-medium text-slate-300"
            >
              Subject
            </label>
            <Input
              id={`follow-up-subject-${applicationId}`}
              maxLength={200}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={`follow-up-body-${applicationId}`}
              className="text-xs font-medium text-slate-300"
            >
              Message
            </label>
            <Textarea
              id={`follow-up-body-${applicationId}`}
              maxLength={4000}
              rows={12}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="resize-y border-[#2b2e3b] bg-[#090a0f] text-sm leading-6 text-white"
            />
            <p className="text-right text-[10px] text-slate-500">
              {body.length.toLocaleString()} / 4,000
            </p>
          </div>
          {saved && (
            <p role="status" className="text-xs text-emerald-300">
              Draft saved to this application&apos;s History &amp; updates.
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-rose-300">
              {error}
            </p>
          )}
          </>
          ) : (
            <section className="space-y-4 rounded-xl border border-sky-400/15 bg-sky-500/[0.03] p-4">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Plan a thoughtful follow-up cadence
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Generate three drafts with suggested timing. Review and edit
                  each one; no messages are scheduled or sent.
                </p>
              </div>
              <label className="space-y-2 text-xs font-medium text-slate-300">
                <span>What are you following up about?</span>
                <select
                  value={sequenceFocus}
                  onChange={(event) =>
                    setSequenceFocus(event.target.value as SequenceFocus)
                  }
                  className="h-10 w-full rounded-lg border border-[#2b2e3b] bg-[#090a0f] px-3 text-sm text-white outline-none focus-visible:border-sky-400"
                >
                  <option value="after-application">After applying</option>
                  <option value="after-interview">After an interview</option>
                  <option value="no-response">No response yet</option>
                </select>
              </label>
              <label className="flex items-start gap-2 text-xs leading-5 text-slate-300">
                <input
                  type="checkbox"
                  checked={aiConsent}
                  onChange={(event) => setAiConsent(event.target.checked)}
                  className="mt-0.5 size-4 shrink-0 rounded border-slate-500 bg-slate-900"
                />
                I agree to send this application&apos;s saved job details to AI
                to draft follow-up messages.
              </label>
              <Button
                type="button"
                onClick={() => void generateSequence()}
                disabled={!aiConsent || generatingSequence}
                className="gap-2 bg-sky-600 text-white hover:bg-sky-500"
              >
                {generatingSequence ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-4" aria-hidden="true" />
                )}
                {generatingSequence ? "Drafting sequence..." : "Generate 3 drafts"}
              </Button>
              {sequence.length > 0 ? (
                <label className="block space-y-2 text-xs font-medium text-slate-300">
                  <span>Recipient email (optional)</span>
                  <Input
                    type="email"
                    maxLength={254}
                    value={recipient}
                    onChange={(event) => setRecipient(event.target.value)}
                    placeholder="recruiter@example.com"
                    className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                  />
                </label>
              ) : null}
              {sequence.map((message, index) => {
                const mailto = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(message.subject)}&body=${encodeURIComponent(message.body)}`;
                return (
                  <article
                    key={`${index}-${message.timing}`}
                    className="space-y-3 rounded-lg border border-[#2b2e3b] bg-[#090a0f] p-3"
                  >
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-300">
                        Step {index + 1} · {message.timing}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {message.purpose}
                      </p>
                    </div>
                    <label className="block space-y-1.5 text-xs text-slate-300">
                      <span>Subject</span>
                      <Input
                        maxLength={200}
                        value={message.subject}
                        onChange={(event) =>
                          updateSequenceMessage(index, "subject", event.target.value)
                        }
                        className="h-9 border-[#2b2e3b] bg-[#0d0e14] text-sm text-white"
                      />
                    </label>
                    <label className="block space-y-1.5 text-xs text-slate-300">
                      <span>Message</span>
                      <Textarea
                        maxLength={4000}
                        rows={7}
                        value={message.body}
                        onChange={(event) =>
                          updateSequenceMessage(index, "body", event.target.value)
                        }
                        className="resize-y border-[#2b2e3b] bg-[#0d0e14] text-sm leading-6 text-white"
                      />
                    </label>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void copySequenceMessage(message, index)}
                        className="h-8 border-[#2b2e3b] text-xs text-slate-200"
                      >
                        {copiedSequenceIndex === index ? (
                          <Check className="size-3.5" aria-hidden="true" />
                        ) : (
                          <Copy className="size-3.5" aria-hidden="true" />
                        )}
                        {copiedSequenceIndex === index ? "Copied" : "Copy"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void saveSequenceMessage(message, index)}
                        disabled={saving || sequenceSaved.includes(index)}
                        className="h-8 border-violet-500/30 text-xs text-violet-200"
                      >
                        <Save className="size-3.5" aria-hidden="true" />
                        {sequenceSaved.includes(index) ? "Saved" : "Save"}
                      </Button>
                      <a
                        href={mailto}
                        aria-label={`Open follow-up step ${index + 1} in email app; it will not be sent automatically`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-sky-600 px-2.5 text-xs font-semibold text-white hover:bg-sky-500"
                      >
                        <Send className="size-3.5" aria-hidden="true" />
                        Open email
                      </a>
                    </div>
                  </article>
                );
              })}
              {error && (
                <p role="alert" className="text-xs text-rose-300">
                  {error}
                </p>
              )}
            </section>
          )}
        </div>

        {mode === "quick" ? (
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-[#1f212d] px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => void copyDraft()}
            className="border-[#2b2e3b] text-slate-200 hover:bg-[#1f212d]"
          >
            {copied ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void saveDraft()}
            disabled={saving || saved}
            className="border-violet-500/30 text-violet-200 hover:bg-violet-500/10"
          >
            {saving ? (
              <Save className="size-4 animate-pulse" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            {saved ? "Saved" : saving ? "Saving..." : "Save to history"}
          </Button>
          <a
            href={emailHref}
            aria-label="Open this draft in your email app; it will not be sent automatically"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-sky-600 px-3 text-xs font-semibold text-white transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Send className="size-4" aria-hidden="true" />
            Open email app
          </a>
        </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

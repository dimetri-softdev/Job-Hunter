"use client";

import { useState } from "react";
import { Check, Copy, Mail, Save, Send } from "lucide-react";
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

  function prepareDraft() {
    const draft = createFollowUpDraft(position, company, status);
    setRecipient(contactEmail ?? "");
    setSubject(draft.subject);
    setBody(draft.body);
    setCopied(false);
    setSaved(false);
    setError(null);
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
            A starting point for {position} at {company}. Personalize it before
            use. JobHunter will not send the email.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
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
        </div>

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
      </DialogContent>
    </Dialog>
  );
}

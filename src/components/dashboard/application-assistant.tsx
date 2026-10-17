"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  FileText,
  LockKeyhole,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetcher } from "@/lib/api";

interface ApplicationPack {
  coverLetter: string;
  roleSummary: string;
  evidenceToEmphasize: string[];
  jobUrl: string;
}

export function ApplicationAssistant({
  applicationId,
  company,
  position,
  hasJobDetails,
}: {
  applicationId: string;
  company: string;
  position: string;
  hasJobDetails: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [pack, setPack] = useState<ApplicationPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function reset() {
    setConsent(false);
    setJobDescription("");
    setPack(null);
    setError(null);
    setCopied(null);
  }

  async function generatePack() {
    setLoading(true);
    setError(null);
    setCopied(null);
    try {
      const result = await fetcher<ApplicationPack>(
        `/applications/${applicationId}/application-pack`,
        {
          method: "POST",
          body: JSON.stringify({
            aiProcessingConsent: consent,
            jobDescription: jobDescription.trim() || null,
          }),
        },
      );
      setPack(result);
    } catch (generationError: unknown) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to prepare this application.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
    } catch {
      setError(
        "Clipboard access failed. Select and copy the draft text instead.",
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) reset();
      }}
    >
      <DialogTrigger className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-[11px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
        <FileText className="h-3.5 w-3.5" />
        Prepare application
      </DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-2xl border-[#242736] bg-[#0d0e14] p-0 text-slate-100 shadow-2xl sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-[#1f212d] px-6 py-5 pr-12">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              <FileText className="size-5" />
            </span>
            <div className="space-y-1.5">
              <DialogTitle className="text-base font-semibold text-white">
                Prepare your application
              </DialogTitle>
              <DialogDescription className="text-xs leading-5 text-slate-400">
                {position} at {company}. Review tailored drafts, then complete
                the employer&apos;s application yourself.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
        {!pack ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-300" />
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-amber-100">
                    You&apos;ll submit on the employer&apos;s site
                  </h3>
                  <p className="text-xs leading-5 text-amber-100/70">
                    JobHunter does not currently have an employer-authorized
                    integration for this listing, so it cannot fill or submit
                    the application. We can prepare materials for you to review
                    and use on the official application page.
                  </p>
                </div>
              </div>
            </div>

            {!hasJobDetails && (
              <div className="space-y-2">
                <label
                  htmlFor={`application-assistant-description-${applicationId}`}
                  className="text-xs font-medium text-slate-300"
                >
                  Job description
                </label>
                <textarea
                  id={`application-assistant-description-${applicationId}`}
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  minLength={80}
                  maxLength={20000}
                  rows={7}
                  placeholder="Paste at least 80 characters from the job posting..."
                  className="min-h-32 w-full resize-y rounded-lg border border-[#2b2e3b] bg-[#090a0f] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
                />
                <p className="flex justify-between gap-3 text-[11px] text-slate-500">
                  <span>
                    {jobDescription.length < 80
                      ? `${80 - jobDescription.length} more characters needed`
                      : "Job details ready"}
                  </span>
                  <span className="shrink-0">
                    {jobDescription.length.toLocaleString()} / 20,000
                  </span>
                </p>
              </div>
            )}

            <label className="flex items-start gap-3 rounded-xl border border-[#2b2e3b] bg-[#101119] p-4 text-xs leading-5 text-slate-400">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-emerald-500"
              />
              <span>
                Send my saved career profile and this job&apos;s details to
                Groq to prepare draft materials. The generated drafts are not
                saved.
              </span>
            </label>
            {error && (
              <p role="alert" className="text-xs text-rose-400">
                {error}
              </p>
            )}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => void generatePack()}
                disabled={
                  !consent ||
                  loading ||
                  (!hasJobDetails && jobDescription.trim().length < 80)
                }
                className="bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {loading ? "Preparing drafts..." : "Prepare application"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 size-4 shrink-0 text-amber-300" />
                <p className="text-xs leading-5 text-amber-100/75">
                  Review every detail for accuracy. These are drafts only;
                  JobHunter has not submitted your application.
                </p>
              </div>
            </div>
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Cover letter draft
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Edit it to sound like you before using.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void copyText("cover-letter", pack.coverLetter)
                  }
                  className="border-[#2b2e3b] text-slate-200 hover:bg-[#1f212d]"
                >
                  {copied === "cover-letter" ? <Check /> : <Copy />}
                  {copied === "cover-letter" ? "Copied" : "Copy"}
                </Button>
              </div>
              <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-[#252836] bg-[#101119] p-4 text-sm leading-6 text-slate-300">
                {pack.coverLetter || "No cover letter was returned."}
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-100">
                  Role summary
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void copyText("role-summary", pack.roleSummary)
                  }
                  className="border-[#2b2e3b] text-slate-200 hover:bg-[#1f212d]"
                >
                  {copied === "role-summary" ? <Check /> : <Copy />}
                  {copied === "role-summary" ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="rounded-xl border border-[#252836] bg-[#101119] p-4 text-sm leading-6 text-slate-300">
                {pack.roleSummary || "No role summary was returned."}
              </p>
            </section>

            {pack.evidenceToEmphasize.length > 0 && (
              <section className="space-y-3 rounded-xl border border-[#252836] bg-[#101119] p-4">
                <h3 className="text-sm font-semibold text-slate-100">
                  Profile evidence to emphasize
                </h3>
                <ul className="space-y-2 text-xs leading-5 text-slate-400">
                  {pack.evidenceToEmphasize.map((item, index) => (
                    <li key={`${index}-${item}`} className="flex gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {copied && (
              <p role="status" className="text-xs text-emerald-300">
                Draft copied. You can paste it into the employer&apos;s form.
              </p>
            )}
          </div>
        )}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-[#1f212d] bg-[#0d0e14] px-6 py-4">
          {pack && pack.jobUrl && (
            <a
              href={pack.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Open listing and apply manually
              <ExternalLink className="size-4" />
            </a>
          )}
          {pack && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPack(null)}
              className="text-slate-300 hover:bg-[#1f212d] hover:text-white"
            >
              Back to details
              <ArrowRight className="size-4 rotate-180" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

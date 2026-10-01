"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  FileText,
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

export function PNetApplicationPack({
  applicationId,
  company,
  position,
}: {
  applicationId: string;
  company: string;
  position: string;
}) {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [pack, setPack] = useState<ApplicationPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function reset() {
    setConsent(false);
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
        `/applications/${applicationId}/pnet-pack`,
        {
          method: "POST",
          body: JSON.stringify({ aiProcessingConsent: consent }),
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
      <DialogTrigger className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/20">
        <FileText className="h-3.5 w-3.5" />
        Prepare for PNet
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-[#1f212d] bg-[#0d0e14] text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-white">
            Prepare your application
          </DialogTitle>
          <DialogDescription>
            {position} at {company}. Generate drafts to review and enter
            yourself on PNet; JobHunter will not fill or submit the form.
          </DialogDescription>
        </DialogHeader>

        {!pack ? (
          <div className="space-y-4">
            <label className="flex items-start gap-2.5 rounded-lg border border-[#252836] bg-[#101119] p-3 text-xs leading-5 text-slate-400">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 size-4 shrink-0 accent-blue-500"
              />
              <span>
                Send my saved career profile and this job description to Groq to
                generate application drafts. The drafts will not be saved.
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
                disabled={!consent || loading}
                className="bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {loading
                  ? "Preparing drafts..."
                  : "Generate application drafts"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase text-slate-400">
                  Cover letter draft
                </h3>
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
              <div className="whitespace-pre-wrap rounded-lg border border-[#252836] bg-[#101119] p-4 text-sm leading-6 text-slate-300">
                {pack.coverLetter || "No cover letter was returned."}
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase text-slate-400">
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
              <p className="rounded-lg border border-[#252836] bg-[#101119] p-4 text-sm leading-6 text-slate-300">
                {pack.roleSummary || "No role summary was returned."}
              </p>
            </section>

            {pack.evidenceToEmphasize.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-slate-400">
                  Profile evidence to emphasize
                </h3>
                <ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-slate-400">
                  {pack.evidenceToEmphasize.map((item, index) => (
                    <li key={`${index}-${item}`}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            <p className="text-[11px] leading-5 text-amber-200/80">
              Check every statement against your real experience before using
              it. Open PNet to complete and submit the application yourself.
            </p>
            <div className="flex justify-end border-t border-[#1f212d] pt-4">
              <a
                href={pack.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Open PNet listing <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

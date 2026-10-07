"use client";

import { useState } from "react";
import { FileSearch, Loader2, Sparkles } from "lucide-react";
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
import type { CreatedApplication } from "@/components/dashboard/job-posting-modal";
import type { FitAssessment, FitVerdict } from "@/lib/application-types";

const verdictDetails: Record<FitVerdict, { label: string; className: string }> = {
  STRONG_MATCH: {
    label: "Strong match",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
  POSSIBLE_MATCH: {
    label: "Possible match",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  },
  STRETCH: {
    label: "Stretch role",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  LOW_MATCH: {
    label: "Low match",
    className: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  },
  INSUFFICIENT_INFO: {
    label: "Not enough information",
    className: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  },
};

export function JobFitModal({
  onApplicationSaved,
}: {
  onApplicationSaved: (application: CreatedApplication) => void;
}) {
  const [open, setOpen] = useState(false);
  const [resume, setResume] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobImage, setJobImage] = useState<File | null>(null);
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [consent, setConsent] = useState(false);
  const [assessment, setAssessment] = useState<FitAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  function resetForm() {
    setResume(null);
    setJobDescription("");
    setJobImage(null);
    setCompany("");
    setPosition("");
    setJobUrl("");
    setNextAction("");
    setFollowUpAt("");
    setConsent(false);
    setAssessment(null);
    setSaved(false);
    setError(null);
    setSaveError(null);
    setFileInputKey((key) => key + 1);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resume) return;

    setLoading(true);
    setError(null);
    setAssessment(null);
    setSaved(false);
    setSaveError(null);

    const body = new FormData();
    body.set("resume", resume);
    body.set("job_description", jobDescription);
    body.set("ai_processing_consent", String(consent));
    if (jobImage) body.set("job_image", jobImage);

    try {
      const result = await fetcher<FitAssessment>("/applications/match", {
        method: "POST",
        body,
      });
      setAssessment(result);
      setPosition(result.roleTitle);
    } catch (matchError: unknown) {
      setError(
        matchError instanceof Error
          ? matchError.message
          : "Unable to check this job match.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveApplication() {
    if (!assessment) return;
    setSaving(true);
    setSaveError(null);
    try {
      const application = await fetcher<CreatedApplication>("/applications", {
        method: "POST",
        body: JSON.stringify({
          company,
          position,
          status: "SAVED",
          jobUrl: jobUrl.trim() || null,
          jobDescription: jobDescription.trim() || null,
          fitAssessment: assessment,
          nextAction: nextAction.trim() || null,
          followUpAt: followUpAt || null,
        }),
      });
      onApplicationSaved(application);
      setSaved(true);
    } catch (saveError: unknown) {
      setSaveError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save this job and fit assessment.",
      );
    } finally {
      setSaving(false);
    }
  }

  const verdict = assessment ? verdictDetails[assessment.verdict] : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) resetForm();
      }}
    >
      <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
        <FileSearch className="h-4 w-4" />
        Check job fit
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1f212d] bg-[#0d0e14] text-slate-100 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">
            Check your fit for a job
          </DialogTitle>
          <DialogDescription>
            Compare a resume with a job posting. You will get a qualitative
            assessment, not a hiring prediction.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="fit-resume" className="text-xs text-slate-300">
              Resume (PDF or JPEG, PNG, WebP image; up to 5 MB)
            </label>
            <input
              key={`resume-${fileInputKey}`}
              id="fit-resume"
              type="file"
              accept="application/pdf,.pdf,image/jpeg,image/png,image/webp"
              required
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setResume(file);
                setAssessment(null);
              }}
              className="w-full rounded-lg border border-[#2b2e3b] bg-[#090a0f] px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-[#252836] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-200"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="fit-job-description"
              className="text-xs text-slate-300"
            >
              Job description text
            </label>
            <Textarea
              id="fit-job-description"
              value={jobDescription}
              onChange={(event) => {
                setJobDescription(event.target.value);
                setAssessment(null);
              }}
              required={!jobImage}
              minLength={jobImage ? 0 : 80}
              maxLength={20000}
              rows={7}
              placeholder="Paste the job description, or add a poster image below..."
              className="min-h-32 resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
            />
            <p className="text-right text-[11px] text-slate-500">
              {jobDescription.length.toLocaleString()} / 20,000
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="fit-job-image" className="text-xs text-slate-300">
              Job poster image{" "}
              <span className="text-slate-500">(optional)</span>
            </label>
            <input
              key={`job-image-${fileInputKey}`}
              id="fit-job-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                setJobImage(event.target.files?.[0] ?? null);
                setAssessment(null);
              }}
              className="w-full rounded-lg border border-[#2b2e3b] bg-[#090a0f] px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-[#252836] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-200"
            />
            <p className="text-[11px] text-slate-500">
              JPEG, PNG, or WebP; up to 5 MB and 25 megapixels.
            </p>
          </div>

          <label className="flex items-start gap-2.5 rounded-lg border border-[#252836] bg-[#101119] p-3 text-xs leading-5 text-slate-400">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 size-4 shrink-0 accent-blue-500"
            />
            <span>
              I agree to send my resume and job-post content to Google Gemini
              for this analysis. JobHunter does not save the uploaded resume or
              extracted resume text. After reviewing the result, you can
              separately choose to save the fit assessment and job details.
            </span>
          </label>

          {assessment && verdict && (
            <section
              className="space-y-4 border-t border-[#1f212d] pt-4"
              aria-live="polite"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">
                  {assessment.roleTitle}
                </h3>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${verdict.className}`}
                >
                  {verdict.label}
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-300">
                {assessment.assessment}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <AssessmentList
                  title="Relevant evidence"
                  items={assessment.strengths}
                />
                <AssessmentList
                  title="Gaps or unknowns"
                  items={assessment.gaps}
                />
              </div>
              {assessment.questionsToConfirm.length > 0 && (
                <AssessmentList
                  title="Worth confirming"
                  items={assessment.questionsToConfirm}
                />
              )}
              <p className="text-[11px] leading-5 text-slate-500">
                This assessment is based only on the provided documents. Review
                the posting yourself; missing resume details may not reflect
                your full experience.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  required
                  maxLength={120}
                  aria-label="Company"
                  placeholder="Company"
                  className="border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                />
                <Input
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                  required
                  maxLength={120}
                  aria-label="Job title"
                  placeholder="Job title"
                  className="border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                />
                <Input
                  value={jobUrl}
                  onChange={(event) => setJobUrl(event.target.value)}
                  type="url"
                  maxLength={2000}
                  aria-label="Job posting link"
                  placeholder="Job link (optional)"
                  className="border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500 sm:col-span-2"
                />
                <Input
                  value={nextAction}
                  onChange={(event) => setNextAction(event.target.value)}
                  maxLength={280}
                  aria-label="Next action"
                  placeholder="Next action (optional)"
                  className="border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                />
                <Input
                  value={followUpAt}
                  onChange={(event) => setFollowUpAt(event.target.value)}
                  type="date"
                  aria-label="Reminder date"
                  className="border-[#2b2e3b] bg-[#090a0f] text-sm text-white"
                />
              </div>
              <p className="text-[11px] leading-5 text-slate-500">
                Saving stores this assessment and the pasted job text with the
                application. Uploaded files and extracted resume text are not
                stored.
              </p>
              {saveError && (
                <p role="alert" className="text-xs text-rose-400">
                  {saveError}
                </p>
              )}
              {saved ? (
                <p role="status" className="text-xs text-emerald-400">
                  Saved to your applications as Saved.
                </p>
              ) : (
                <Button
                  type="button"
                  onClick={() => void saveApplication()}
                  disabled={saving || !company.trim() || !position.trim()}
                  className="bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {saving ? "Saving application..." : "Save to applications"}
                </Button>
              )}
            </section>
          )}

          {error && (
            <p role="alert" className="text-xs text-rose-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-[#1f212d] pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-slate-300 hover:bg-[#1f212d] hover:text-white"
            >
              Close
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white hover:bg-blue-500"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? "Checking fit..." : "Check job fit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssessmentList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-slate-300">{title}</h4>
      {items.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-slate-400">
          {items.map((item, index) => (
            <li key={`${index}-${item}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">No specific points identified.</p>
      )}
    </div>
  );
}

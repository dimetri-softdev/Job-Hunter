"use client";

import { useState } from "react";
import {
  CheckCircle2,
  FileSearch,
  FileText,
  ImagePlus,
  Loader2,
  MessageCircleQuestion,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  X,
} from "lucide-react";
import { ActionHint } from "@/components/action-hint";
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
import { APPLICATION_SOURCES, type ApplicationSource } from "@/lib/application-types";

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
  const [jobDocument, setJobDocument] = useState<File | null>(null);
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [source, setSource] = useState<ApplicationSource | "">("");
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
  const [jobDocumentInputKey, setJobDocumentInputKey] = useState(0);

  function resetForm() {
    setResume(null);
    setJobDescription("");
    setJobImage(null);
    setJobDocument(null);
    setCompany("");
    setPosition("");
    setJobUrl("");
    setSource("");
    setNextAction("");
    setFollowUpAt("");
    setConsent(false);
    setAssessment(null);
    setSaved(false);
    setError(null);
    setSaveError(null);
    setFileInputKey((key) => key + 1);
    setJobDocumentInputKey((key) => key + 1);
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
    if (jobDocument) body.set("job_document", jobDocument);

    try {
      const result = await fetcher<FitAssessment & { sourceDescription: string }>(
        "/applications/match",
        {
        method: "POST",
        body,
        },
      );
      setAssessment(result);
      setPosition(result.roleTitle);
      setJobDescription(result.sourceDescription);
      setJobDocument(null);
      setJobDocumentInputKey((key) => key + 1);
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
          source: source || null,
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
      <ActionHint label="Compare your resume with a job post to review relevant experience, gaps, and questions.">
        <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
          <FileSearch className="h-4 w-4" />
          Check job fit
        </DialogTrigger>
      </ActionHint>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-2xl border-[#242736] bg-[#0d0e14] p-0 text-slate-100 shadow-2xl sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-[#1f212d] px-6 py-5 pr-12">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              <FileSearch className="size-5" />
            </span>
            <div className="space-y-1.5">
              <DialogTitle className="text-base font-semibold text-white">
                Check your fit for a job
              </DialogTitle>
              <DialogDescription className="text-xs leading-5 text-slate-400">
                Compare a resume with a job posting. Get a qualitative
                assessment, not a hiring prediction.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-6 py-5">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-[11px] font-semibold text-emerald-300">
                1
              </span>
              <h3 className="text-sm font-semibold text-slate-100">
                Add your resume
              </h3>
              <span className="text-xs text-rose-300">Required</span>
            </div>
            <div className="flex gap-2">
              <input
                key={`resume-${fileInputKey}`}
                id="fit-resume"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp"
                required
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setResume(file);
                  setAssessment(null);
                }}
                className="peer sr-only"
              />
              <label
                htmlFor="fit-resume"
                className="group flex min-h-[76px] min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#343848] bg-[#101119] px-4 py-3 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/[0.04] peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-400"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#2b2e3b] bg-[#171923] text-slate-300 group-hover:text-emerald-300">
                  {resume ? (
                    <FileText className="size-5" />
                  ) : (
                    <Upload className="size-5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-200">
                    {resume ? resume.name : "Choose a resume"}
                  </span>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    PDF, DOCX, JPEG, PNG, or WebP · up to 5 MB
                  </span>
                </span>
                <span className="shrink-0 rounded-lg border border-[#343848] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors group-hover:border-emerald-500/40 group-hover:text-white">
                  {resume ? "Replace" : "Browse files"}
                </span>
              </label>
              {resume && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove resume"
                  onClick={() => {
                    setResume(null);
                    setAssessment(null);
                    setFileInputKey((key) => key + 1);
                  }}
                  className="mt-3 shrink-0 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-blue-500/10 text-[11px] font-semibold text-blue-300">
                2
              </span>
              <h3 className="text-sm font-semibold text-slate-100">
                Add the job posting
              </h3>
              <span className="text-xs text-rose-300">Required</span>
            </div>
            <div className="space-y-2">
            <label
              htmlFor="fit-job-description"
              className="text-xs font-medium text-slate-300"
            >
              Job description
            </label>
            <Textarea
              id="fit-job-description"
              value={jobDescription}
              onChange={(event) => {
                setJobDescription(event.target.value);
                setAssessment(null);
              }}
              required={!jobDocument}
              minLength={jobDocument ? 0 : 80}
              maxLength={20000}
              rows={7}
              placeholder="Paste the job description here..."
              className="min-h-32 resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
            />
            <p className="flex justify-between gap-3 text-[11px] text-slate-500">
              <span>
                {jobDocument
                  ? "You can combine pasted text, a document, and a poster image."
                  : "Paste at least 80 characters or add a document. A poster image is optional."}
              </span>
              <span className="shrink-0">
                {jobDescription.length.toLocaleString()} / 20,000
              </span>
            </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="fit-job-document" className="text-xs font-medium text-slate-300">
                Job posting document{" "}
                <span className="font-normal text-slate-500">Optional · PDF, DOCX, or TXT · up to 5 MB</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  key={jobDocumentInputKey}
                  id="fit-job-document"
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={(event) => {
                    setJobDocument(event.target.files?.[0] ?? null);
                    setAssessment(null);
                  }}
                  className="block min-w-0 flex-1 text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-blue-500"
                />
                {jobDocument && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove job posting document"
                    onClick={() => {
                      setJobDocument(null);
                      setAssessment(null);
                      setJobDocumentInputKey((key) => key + 1);
                    }}
                    className="shrink-0 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Text-based PDFs, Word documents, and UTF-8 text files are supported.
              </p>
            </div>

            <div className="space-y-2">
            <label htmlFor="fit-job-image" className="text-xs font-medium text-slate-300">
              Job poster image{" "}
              <span className="font-normal text-slate-500">Optional</span>
            </label>
            <div className="flex gap-2">
              <input
                key={`job-image-${fileInputKey}`}
                id="fit-job-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  setJobImage(event.target.files?.[0] ?? null);
                  setAssessment(null);
                }}
                className="peer sr-only"
              />
              <label
                htmlFor="fit-job-image"
                className="group flex min-h-[68px] min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#343848] bg-[#101119] px-4 py-3 transition-colors hover:border-blue-500/50 hover:bg-blue-500/[0.04] peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#2b2e3b] bg-[#171923] text-slate-400 group-hover:text-blue-300">
                  {jobImage ? (
                    <FileText className="size-4" />
                  ) : (
                    <ImagePlus className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-200">
                    {jobImage ? jobImage.name : "Add a job poster"}
                  </span>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    JPEG, PNG, or WebP · up to 5 MB
                  </span>
                </span>
                <span className="shrink-0 rounded-lg border border-[#343848] px-3 py-1.5 text-xs font-medium text-slate-200 group-hover:border-blue-500/40 group-hover:text-white">
                  {jobImage ? "Replace" : "Browse"}
                </span>
              </label>
              {jobImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove job poster"
                  onClick={() => {
                    setJobImage(null);
                    setAssessment(null);
                    setFileInputKey((key) => key + 1);
                  }}
                  className="mt-2 shrink-0 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Images must be 25 megapixels or smaller.
            </p>
          </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-violet-500/10 text-[11px] font-semibold text-violet-300">
                3
              </span>
              <h3 className="text-sm font-semibold text-slate-100">
                Review privacy
              </h3>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-[#2b2e3b] bg-[#101119] p-4 text-xs leading-5 text-slate-400">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-blue-500"
              />
              <span>
                I agree to send my resume and job-post content and documents to Google Gemini
                for this analysis. JobHunter does not save uploaded resumes or
                extracted resume text. I can separately choose whether to save
                the assessment and job details.
              </span>
            </label>
          </section>

          {assessment && verdict && (
            <section
              className="space-y-4 rounded-xl border border-[#252836] bg-[#101119] p-4"
              aria-live="polite"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
                    <Target className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Fit assessment
                    </p>
                    <h3 className="truncate text-sm font-semibold text-white">
                      {assessment.roleTitle}
                    </h3>
                  </div>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${verdict.className}`}
                >
                  {verdict.label}
                </span>
              </div>
              <p className="rounded-lg border border-[#252836] bg-[#0b0c12] p-3 text-sm leading-6 text-slate-300">
                {assessment.assessment}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <AssessmentList
                  title="Relevant evidence"
                  items={assessment.strengths}
                  icon={<CheckCircle2 className="size-4 text-emerald-300" />}
                />
                <AssessmentList
                  title="Gaps or unknowns"
                  items={assessment.gaps}
                  icon={<Target className="size-4 text-amber-300" />}
                />
              </div>
              {assessment.questionsToConfirm.length > 0 && (
                <AssessmentList
                  title="Worth confirming"
                  items={assessment.questionsToConfirm}
                  icon={
                    <MessageCircleQuestion className="size-4 text-blue-300" />
                  }
                />
              )}
              <p className="flex items-start gap-2 text-[11px] leading-5 text-slate-500">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                This assessment is based only on the provided documents. Review
                the posting yourself; missing resume details may not reflect
                your full experience.
              </p>
              <div className="space-y-3 border-t border-[#252836] pt-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">
                    Save this role?
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Add a few details to keep the assessment in your tracker.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="fit-source" className="text-xs text-slate-300">
                    Where did you find this role?{" "}
                    <span className="text-slate-500">(optional)</span>
                  </label>
                  <select
                    id="fit-source"
                    value={source}
                    onChange={(event) =>
                      setSource(event.target.value as ApplicationSource | "")
                    }
                    className="h-10 w-full rounded-lg border border-[#2b2e3b] bg-[#090a0f] px-3 text-sm text-white outline-none focus-visible:border-blue-400"
                  >
                    <option value="">Not recorded</option>
                    {APPLICATION_SOURCES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="fit-company" className="text-xs text-slate-300">
                      Company
                    </label>
                    <Input
                      id="fit-company"
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                      maxLength={120}
                      placeholder="e.g. Acme"
                      className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="fit-position" className="text-xs text-slate-300">
                      Job title
                    </label>
                    <Input
                      id="fit-position"
                      value={position}
                      onChange={(event) => setPosition(event.target.value)}
                      maxLength={120}
                      placeholder="e.g. Product Designer"
                      className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="fit-job-url" className="text-xs text-slate-300">
                      Job link <span className="text-slate-500">(optional)</span>
                    </label>
                    <Input
                      id="fit-job-url"
                      value={jobUrl}
                      onChange={(event) => setJobUrl(event.target.value)}
                      type="url"
                      maxLength={2000}
                      placeholder="https://company.com/careers/job"
                      className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="fit-next-action" className="text-xs text-slate-300">
                      Next action <span className="text-slate-500">(optional)</span>
                    </label>
                    <Input
                      id="fit-next-action"
                      value={nextAction}
                      onChange={(event) => setNextAction(event.target.value)}
                      maxLength={280}
                      placeholder="e.g. Tailor resume"
                      className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="fit-follow-up" className="text-xs text-slate-300">
                      Reminder date <span className="text-slate-500">(optional)</span>
                    </label>
                    <Input
                      id="fit-follow-up"
                      value={followUpAt}
                      onChange={(event) => setFollowUpAt(event.target.value)}
                      type="date"
                      className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white"
                    />
                  </div>
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
              </div>
            </section>
          )}

          {error && (
            <p role="alert" className="text-xs text-rose-400">
              {error}
            </p>
          )}

          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-[#1f212d] bg-[#0d0e14] px-6 py-4">
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

function AssessmentList({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-[#252836] bg-[#0b0c12] p-3">
      <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-200">
        {icon}
        {title}
      </h4>
      {items.length > 0 ? (
        <ul className="space-y-2 text-xs leading-5 text-slate-400">
          {items.map((item, index) => (
            <li key={`${index}-${item}`} className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-slate-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs leading-5 text-slate-500">
          No specific points identified.
        </p>
      )}
    </div>
  );
}

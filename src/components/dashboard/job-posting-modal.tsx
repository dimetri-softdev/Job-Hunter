"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
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
import type { FitAssessment } from "@/lib/application-types";

interface JobAnalysis {
  company: string;
  position: string;
  location: string | null;
  workArrangement: string | null;
  employmentType: string | null;
  summary: string;
  keyRequirements: string[];
}

export interface CreatedApplication {
  id: string;
  company: string;
  position: string;
  status: string;
  createdAt: string;
  jobUrl: string | null;
  jobSummary: string | null;
  fitAssessment?: FitAssessment | null;
  nextAction?: string | null;
  followUpAt?: string | null;
}

export function JobPostingModal({
  onApplicationCreated,
}: {
  onApplicationCreated: (application: CreatedApplication) => void;
}) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setDescription("");
    setJobUrl("");
    setNextAction("");
    setFollowUpAt("");
    setAnalysis(null);
    setCompany("");
    setPosition("");
    setError(null);
  }

  async function analyzePosting() {
    setAnalyzing(true);
    setError(null);
    try {
      const result = await fetcher<JobAnalysis>("/applications/analyze", {
        method: "POST",
        body: JSON.stringify({ description }),
      });
      setAnalysis(result);
      setCompany(result.company);
      setPosition(result.position);
    } catch (analysisError: unknown) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Unable to analyze the job posting.",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveApplication() {
    if (!analysis) return;
    setSaving(true);
    setError(null);
    try {
      const application = await fetcher<CreatedApplication>("/applications", {
        method: "POST",
        body: JSON.stringify({
          company,
          position,
          status: "SAVED",
          jobUrl: jobUrl.trim() || null,
          jobDescription: description,
          jobSummary: analysis.summary,
          nextAction: nextAction.trim() || null,
          followUpAt: followUpAt || null,
        }),
      });
      onApplicationCreated(application);
      setOpen(false);
      resetForm();
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save this job.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (analysis) {
      void saveApplication();
    } else {
      void analyzePosting();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) resetForm();
      }}
    >
      <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-600/10 px-4 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
        <Sparkles className="h-4 w-4" />
        Analyze job post
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1f212d] bg-[#0d0e14] text-slate-100 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-white">
            Analyze a job posting
          </DialogTitle>
          <DialogDescription>
            Paste the posting text. AI will prepare a draft for you to review;
            it will not submit an application.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="job-url" className="text-xs text-slate-300">
              Job link <span className="text-slate-500">(optional)</span>
            </label>
            <Input
              id="job-url"
              type="url"
              value={jobUrl}
              onChange={(event) => setJobUrl(event.target.value)}
              placeholder="https://company.com/careers/job"
              className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
            />
            <p className="text-[11px] text-slate-500">
              The link is saved with your application. Paste the job details
              below; this version does not scrape sites automatically.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="job-description" className="text-xs text-slate-300">
              Job posting text
            </label>
            <Textarea
              id="job-description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setAnalysis(null);
              }}
              required
              minLength={80}
              maxLength={20000}
              rows={8}
              placeholder="Paste the job description and requirements here..."
              className="min-h-36 resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
            />
            <p className="text-right text-[11px] text-slate-500">
              {description.length.toLocaleString()} / 20,000
            </p>
          </div>

          {analysis && (
            <section className="space-y-4 border-t border-[#1f212d] pt-4">
              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-400">
                  Review extracted details
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Confirm the AI draft before saving it to your tracker.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="analysis-company"
                    className="text-xs text-slate-300"
                  >
                    Company
                  </label>
                  <Input
                    id="analysis-company"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    required
                    maxLength={120}
                    className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="analysis-position"
                    className="text-xs text-slate-300"
                  >
                    Job title
                  </label>
                  <Input
                    id="analysis-position"
                    value={position}
                    onChange={(event) => setPosition(event.target.value)}
                    required
                    maxLength={120}
                    className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-[#252836] bg-[#101119] p-3">
                <p className="text-xs leading-5 text-slate-300">
                  {analysis.summary || "No summary was extracted."}
                </p>
                {(analysis.location ||
                  analysis.workArrangement ||
                  analysis.employmentType) && (
                  <p className="mt-2 text-[11px] text-slate-500">
                    {[
                      analysis.location,
                      analysis.workArrangement,
                      analysis.employmentType,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
              {analysis.keyRequirements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-slate-300">
                    Key requirements
                  </h4>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">
                    {analysis.keyRequirements
                      .slice(0, 8)
                      .map((requirement, index) => (
                        <li key={`${index}-${requirement}`}>{requirement}</li>
                      ))}
                  </ul>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="job-next-action" className="text-xs text-slate-300">
                    Next action <span className="text-slate-500">(optional)</span>
                  </label>
                  <Input
                    id="job-next-action"
                    value={nextAction}
                    onChange={(event) => setNextAction(event.target.value)}
                    maxLength={280}
                    placeholder="e.g. Tailor resume and apply"
                    className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="job-follow-up" className="text-xs text-slate-300">
                    Reminder date <span className="text-slate-500">(optional)</span>
                  </label>
                  <Input
                    id="job-follow-up"
                    type="date"
                    value={followUpAt}
                    onChange={(event) => setFollowUpAt(event.target.value)}
                    className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white"
                  />
                </div>
              </div>
            </section>
          )}

          {error && (
            <p role="alert" className="text-xs text-rose-400">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2 border-t border-[#1f212d] pt-4">
            <Button
              type="button"
              variant="ghost"
              className="text-slate-300 hover:bg-[#1f212d] hover:text-white"
              onClick={() => setOpen(false)}
              disabled={analyzing || saving}
            >
              Cancel
            </Button>
            {analysis && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void analyzePosting()}
                disabled={analyzing || saving}
                className="border-[#2b2e3b] text-slate-200 hover:bg-[#1f212d]"
              >
                Re-analyze
              </Button>
            )}
            <Button
              type="submit"
              disabled={analyzing || saving}
              className="bg-blue-600 text-white hover:bg-blue-500"
            >
              {analyzing || saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {analyzing
                ? "Analyzing..."
                : saving
                  ? "Saving..."
                  : analysis
                    ? "Save as saved job"
                    : "Analyze posting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Download, FileText, Loader2, Sparkles } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/api";
import {
  downloadUpdatedResumeDocx,
  downloadResumePdf,
  getResumeDesign,
  isResumeSectionHeading,
  resumeDesigns,
  type ResumeDesignId,
} from "@/lib/resume-document";

interface RoadmapProject {
  id: string;
  title: string;
  description: string;
  proofNotes?: string | null;
  tasks: { id: string; label: string; completed: boolean }[];
}

interface Roadmap {
  id: string;
  title: string;
  projects: RoadmapProject[];
}

interface ResumeDraft {
  updatedResume: string;
  revisionNotes: string[];
}

export default function ResumeUpdatePage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(true);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<"docx" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ResumeDraft | null>(null);
  const [updatedResume, setUpdatedResume] = useState("");
  const [selectedDesignId, setSelectedDesignId] =
    useState<ResumeDesignId>("modern");

  useEffect(() => {
    async function loadRoadmaps() {
      try {
        const data = await fetcher<Roadmap[]>("/roadmaps");
        if (!Array.isArray(data)) {
          throw new Error("Unexpected roadmap response.");
        }
        setRoadmaps(data);
      } catch (loadError: unknown) {
        setRoadmapError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load completed roadmap evidence.",
        );
      } finally {
        setLoadingRoadmaps(false);
      }
    }

    void loadRoadmaps();
  }, []);

  const eligibleProjects = useMemo(
    () =>
      roadmaps.flatMap((roadmap) =>
        roadmap.projects
          .filter((project) => project.tasks.some((task) => task.completed))
          .map((project) => ({
            ...project,
            roadmapTitle: roadmap.title,
            completedTasks: project.tasks.filter((task) => task.completed),
          })),
      ),
    [roadmaps],
  );
  const resumeLines = updatedResume.split(/\r?\n/);
  const resumeTitleIndex = resumeLines.findIndex((line) => line.trim());
  const selectedDesign = getResumeDesign(selectedDesignId);

  function toggleProject(projectId: string) {
    setSelectedProjectIds((current) => {
      if (current.includes(projectId)) {
        return current.filter((id) => id !== projectId);
      }
      if (current.length >= 6) return current;
      return [...current, projectId];
    });
    setDraft(null);
    setError(null);
    setDownloadError(null);
  }

  async function generateDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDraft(null);

    if (!resumeFile) {
      setError("Choose a text-based PDF or Word (.docx) resume first.");
      return;
    }
    if (!targetRole.trim()) {
      setError("Enter the role you want to target.");
      return;
    }
    if (selectedProjectIds.length === 0) {
      setError("Select at least one project with completed tasks.");
      return;
    }
    if (!consent) {
      setError("Confirm consent before sending your resume and project evidence to Gemini.");
      return;
    }

    const formData = new FormData();
    formData.set("resume", resumeFile);
    formData.set("target_role", targetRole.trim());
    formData.set("project_ids", JSON.stringify(selectedProjectIds));
    formData.set("ai_processing_consent", "true");

    setGenerating(true);
    try {
      const response = await fetcher<ResumeDraft>("/resume/roadmap-update", {
        method: "POST",
        body: formData,
      });
      setDraft(response);
      setUpdatedResume(response.updatedResume);
    } catch (generationError: unknown) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to prepare resume suggestions. Please try again.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function downloadUpdatedResume(format: "docx" | "pdf") {
    if (!draft || !updatedResume.trim()) {
      setDownloadError("Add the updated resume text before downloading.");
      return;
    }
    setDownloading(format);
    setDownloadError(null);
    try {
      if (format === "docx") {
        await downloadUpdatedResumeDocx(
          updatedResume,
          targetRole,
          selectedDesignId,
        );
      } else {
        await downloadResumePdf(targetRole);
      }
    } catch (downloadFailure: unknown) {
      setDownloadError(
        downloadFailure instanceof Error
          ? downloadFailure.message
          : `Unable to create the ${format.toUpperCase()} copy. Try again.`,
      );
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="Resume update"
        description="Use completed roadmap work to create a complete, editable resume copy tailored to your target role."
      />

      <section className="mx-auto max-w-4xl rounded-xl border border-blue-400/15 bg-blue-500/[0.04] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 size-5 shrink-0 text-blue-300" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-white">
              Your original resume stays unchanged
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Upload a text-based PDF or Word (.docx) resume. After you
              explicitly consent, Gemini receives its extracted text, your
              target role, and completed task/proof notes for selected
              projects. JobHunter does not save the upload. Review the complete
              updated copy, make edits, then download it as Word or PDF. The
              original file is never replaced.
            </p>
          </div>
        </div>
      </section>

      <form
        onSubmit={(event) => void generateDraft(event)}
        className="mx-auto max-w-4xl space-y-5"
      >
        <section className="space-y-4 rounded-xl border border-[#1f212d] bg-[#12131a] p-5 sm:p-6">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Choose completed work
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Select up to six projects with at least one completed task. Only
              completed tasks and saved proof notes are used as evidence.
            </p>
          </div>

          {loadingRoadmaps ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Loading your roadmaps...
            </div>
          ) : roadmapError ? (
            <p role="alert" className="text-sm text-rose-400">
              {roadmapError}
            </p>
          ) : eligibleProjects.length === 0 ? (
            <p className="rounded-lg border border-[#252836] bg-[#0e0f16] p-4 text-xs leading-5 text-slate-400">
              No completed roadmap tasks yet. Complete at least one project
              task, then come back to build a resume update.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {eligibleProjects.map((project) => {
                const selected = selectedProjectIds.includes(project.id);
                const disabled = !selected && selectedProjectIds.length >= 6;
                return (
                  <label
                    key={project.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                      selected
                        ? "border-blue-400/35 bg-blue-500/[0.06]"
                        : "border-[#252836] bg-[#0e0f16] hover:border-slate-600"
                    } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={disabled}
                      onChange={() => toggleProject(project.id)}
                      className="mt-0.5 size-4 shrink-0 accent-blue-500"
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-slate-200">
                        {project.title}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-500">
                        {project.roadmapTitle} · {project.completedTasks.length}{" "}
                        completed{" "}
                        {project.completedTasks.length === 1 ? "task" : "tasks"}
                      </span>
                      {project.proofNotes && (
                        <span className="mt-2 block text-[11px] leading-4 text-slate-400">
                          Proof notes saved
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-xl border border-[#1f212d] bg-[#12131a] p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-white">
            Provide your current resume
          </h2>
          <label
            htmlFor="resume-file"
            className="block text-xs font-medium text-slate-300"
          >
            Text-based PDF or Word (.docx) · maximum 5 MB
            <input
              id="resume-file"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => {
                setResumeFile(event.target.files?.[0] ?? null);
                setDraft(null);
                setUpdatedResume("");
                setError(null);
                setDownloadError(null);
              }}
              className="mt-2 block min-h-11 w-full rounded-lg border border-[#2b2e3b] bg-[#0b0c12] px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600/15 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-blue-200 hover:file:bg-blue-600/25"
            />
          </label>
          {resumeFile && (
            <p className="text-[11px] text-slate-500">
              Selected: {resumeFile.name} ·{" "}
              {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
          <label
            htmlFor="target-role"
            className="block text-xs font-medium text-slate-300"
          >
            Target role
            <input
              id="target-role"
              type="text"
              minLength={2}
              maxLength={160}
              required
              value={targetRole}
              onChange={(event) => setTargetRole(event.target.value)}
              placeholder="e.g. Junior Product Designer"
              className="mt-2 min-h-11 w-full rounded-lg border border-[#2b2e3b] bg-[#0b0c12] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-amber-300/15 bg-amber-300/[0.04] p-3 text-xs leading-5 text-slate-300">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 size-4 shrink-0 accent-blue-500"
            />
            <span>
              I consent to sending the text extracted from my resume, my target
              role, and selected completed project evidence to Google Gemini to
              create a complete updated resume. The uploaded file is not saved.
              I will review every claim before downloading or using the new
              copy.
            </span>
          </label>
          {error && (
            <p role="alert" className="text-sm text-rose-400">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={
              loadingRoadmaps ||
              Boolean(roadmapError) ||
              eligibleProjects.length === 0 ||
              generating
            }
            className="h-10 bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500"
          >
            {generating ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            {generating ? "Updating your resume..." : "Create updated resume"}
          </Button>
        </section>
      </form>

      {draft && (
        <section className="mx-auto max-w-5xl space-y-6 rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-[#151922] to-[#101116] p-5 shadow-[0_20px_70px_-35px_rgba(16,185,129,0.2)] sm:p-7">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-200">
                <FileText className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Your new draft
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
                  Review your updated resume
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                  A fresh, editable copy shaped around your completed work. Your
                  original resume stays untouched. Check every detail before
                  you use or share it.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-100">
              <span className="size-1.5 rounded-full bg-emerald-300" />
              Ready to review
            </div>
          </div>

          <label
            htmlFor="updated-resume"
            className="block text-sm font-medium text-slate-200"
          >
            Resume content
            <span className="ml-2 text-xs font-normal text-slate-500">
              Edit any wording before downloading
            </span>
            <Textarea
              id="updated-resume"
              maxLength={18000}
              rows={18}
              value={updatedResume}
              onChange={(event) => setUpdatedResume(event.target.value)}
              className="mt-2 resize-y border-[#2b2e3b] bg-[#0b0c12] font-mono text-[13px] leading-6 text-slate-200 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
            />
          </label>

          <div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-100">
                Choose a design
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Switch styles anytime. Your content stays the same.
              </p>
            </div>
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {resumeDesigns.map((design) => {
                const selected = design.id === selectedDesignId;
                return (
                  <button
                    key={design.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedDesignId(design.id)}
                    className={`group rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-emerald-400/50 bg-emerald-400/[0.06] shadow-[0_0_0_1px_rgba(52,211,153,0.12)]"
                        : "border-[#2b2e3b] bg-[#0d0f15] hover:border-slate-500"
                    }`}
                  >
                    <span className="mb-3 block overflow-hidden rounded-md border border-black/10 bg-white p-2.5">
                      <span
                        className="mb-2 block h-1 rounded-full"
                        style={{
                          backgroundColor: `#${design.accent}`,
                          opacity: design.topRule ? 1 : 0,
                        }}
                      />
                      <span
                        className="mb-2 block h-2 w-2/3 rounded-sm"
                        style={{ backgroundColor: `#${design.title}` }}
                      />
                      <span
                        className="mb-2 block h-px w-full"
                        style={{ backgroundColor: `#${design.divider}` }}
                      />
                      <span
                        className="mb-1 block h-1 w-full rounded-sm bg-slate-300"
                      />
                      <span className="block h-1 w-4/5 rounded-sm bg-slate-200" />
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-100">
                        {design.name}
                      </span>
                      {selected && (
                        <Check
                          className="size-4 shrink-0 text-emerald-300"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                      {design.description}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Live document preview
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Preview updates to match your selected design and downloads.
                </p>
              </div>
              <span className="rounded-full border border-[#2b2e3b] bg-[#0b0c12] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                A4 · ATS-friendly
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[#252836] bg-[#0a0b10] p-3 sm:p-6">
              <article
                id="resume-output-preview"
                aria-label="Formatted resume preview"
                className="mx-auto min-h-[1123px] w-[794px] bg-white px-[68px] py-[58px] font-sans text-[13px] leading-[1.65] shadow-2xl"
                style={{
                  borderTop: selectedDesign.topRule
                    ? `6px solid #${selectedDesign.accent}`
                    : undefined,
                  color: `#${selectedDesign.body}`,
                }}
              >
                {resumeLines.map((rawLine, index) => {
                  const line = rawLine.trim();
                  if (!line) {
                    return <div key={`space-${index}`} className="h-2" />;
                  }
                  if (index === resumeTitleIndex) {
                    return (
                      <h1
                        key={`title-${index}`}
                        className="mb-5 pb-4 text-[30px] font-bold leading-tight tracking-[-0.03em]"
                        style={{
                          color: `#${selectedDesign.title}`,
                          textAlign: selectedDesign.titleAlignment,
                          borderBottom:
                            selectedDesign.titleBorder === "bottom"
                              ? `2px solid #${selectedDesign.accent}`
                              : undefined,
                        }}
                      >
                        {line}
                      </h1>
                    );
                  }
                  if (isResumeSectionHeading(line)) {
                    return (
                      <h2
                        key={`heading-${index}`}
                        className="mb-2 mt-7 pb-2 text-[11px] font-bold uppercase tracking-[0.18em]"
                        style={{
                          color: `#${selectedDesign.accent}`,
                          borderBottom:
                            selectedDesign.headingBorder === "bottom"
                              ? `1px solid #${selectedDesign.divider}`
                              : undefined,
                          borderLeft:
                            selectedDesign.headingBorder === "left"
                              ? `2px solid #${selectedDesign.accent}`
                              : undefined,
                          paddingLeft:
                            selectedDesign.headingBorder === "left"
                              ? "10px"
                              : undefined,
                        }}
                      >
                        {line}
                      </h2>
                    );
                  }
                  const bullet = line.match(/^[-•]\s+(.+)$/);
                  return bullet ? (
                    <div
                      key={`bullet-${index}`}
                      className="flex gap-2.5 py-0.5"
                    >
                      <span
                        className="mt-[0.72em] size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: `#${selectedDesign.accent}` }}
                        aria-hidden="true"
                      />
                      <p>{bullet[1]}</p>
                    </div>
                  ) : (
                    <p key={`line-${index}`} className="py-0.5">
                      {line}
                    </p>
                  );
                })}
              </article>
            </div>
          </div>

          {draft.revisionNotes.length > 0 && (
            <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                <Sparkles className="size-4 text-amber-300" aria-hidden="true" />
                Review these details before using your resume
              </h3>
              <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-6 text-slate-300 marker:text-amber-300">
                {draft.revisionNotes.map((note, index) => (
                  <li key={`${index}-${note}`}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {downloadError && (
            <p role="alert" className="text-sm text-rose-400">
              {downloadError}
            </p>
          )}
          <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              Keep it editable in Word or save a ready-to-share PDF.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={Boolean(downloading) || !updatedResume.trim()}
                onClick={() => void downloadUpdatedResume("docx")}
                className="h-10 bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                {downloading === "docx" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="size-4" aria-hidden="true" />
                )}
                Download Word
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={Boolean(downloading) || !updatedResume.trim()}
                onClick={() => void downloadUpdatedResume("pdf")}
                className="h-10 border-[#343847] bg-[#1a1c25] px-4 text-sm text-slate-200 hover:bg-[#222530]"
              >
                {downloading === "pdf" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <FileText className="size-4" aria-hidden="true" />
                )}
                Download PDF
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

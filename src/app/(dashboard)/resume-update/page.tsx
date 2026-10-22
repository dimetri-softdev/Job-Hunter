"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Loader2, Sparkles } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/api";
import {
  downloadResumeDocx,
  downloadResumePdf,
  isResumeSectionHeading,
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
        await downloadResumeDocx(updatedResume, targetRole);
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
        <section className="mx-auto max-w-4xl space-y-5 rounded-xl border border-emerald-400/20 bg-[#12131a] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Review your updated resume
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                This is a complete new copy based on your resume and selected
                completed work. The original is unchanged. Review the content
                and every claim before downloading.
              </p>
            </div>
          </div>

          <label
            htmlFor="updated-resume"
            className="block text-xs font-medium text-slate-300"
          >
            Edit your complete resume
            <Textarea
              id="updated-resume"
              maxLength={18000}
              rows={18}
              value={updatedResume}
              onChange={(event) => setUpdatedResume(event.target.value)}
              className="mt-2 resize-y border-[#2b2e3b] bg-[#0b0c12] text-sm text-white focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
            />
          </label>

          <div className="overflow-x-auto rounded-xl border border-[#252836] bg-white p-3">
            <article
              id="resume-output-preview"
              className="mx-auto min-h-[1123px] w-[794px] space-y-2 bg-white px-[64px] py-[56px] font-sans text-[14px] leading-6 text-slate-800"
            >
              {updatedResume.split(/\r?\n/).map((rawLine, index) => {
                const line = rawLine.trim();
                if (!line) return <div key={`space-${index}`} className="h-2" />;
                if (index === updatedResume.split(/\r?\n/).findIndex((item) => item.trim())) {
                  return (
                    <h1 key={`title-${index}`} className="mb-4 text-2xl font-bold leading-8 text-slate-950">
                      {line}
                    </h1>
                  );
                }
                if (isResumeSectionHeading(line)) {
                  return (
                    <h2 key={`heading-${index}`} className="mb-1 mt-5 border-b border-slate-300 pb-1 text-sm font-bold tracking-wide text-blue-900">
                      {line}
                    </h2>
                  );
                }
                const bullet = line.match(/^[-•]\s+(.+)$/);
                return bullet ? (
                  <p key={`bullet-${index}`} className="pl-4">
                    <span aria-hidden="true">• </span>
                    {bullet[1]}
                  </p>
                ) : (
                  <p key={`line-${index}`}>{line}</p>
                );
              })}
            </article>
          </div>

          {draft.revisionNotes.length > 0 && (
            <div className="rounded-lg border border-amber-300/15 bg-amber-300/[0.04] p-3">
              <h3 className="text-xs font-semibold text-amber-100">
                Review these details before using your resume
              </h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-5 text-slate-300">
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
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(downloading) || !updatedResume.trim()}
              onClick={() => void downloadUpdatedResume("docx")}
              className="h-9 border-[#2b2e3b] text-xs text-slate-200 hover:bg-[#1f212d]"
            >
              {downloading === "docx" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
              Download Word copy
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(downloading) || !updatedResume.trim()}
              onClick={() => void downloadUpdatedResume("pdf")}
              className="h-9 border-[#2b2e3b] text-xs text-slate-200 hover:bg-[#1f212d]"
            >
              {downloading === "pdf" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileText className="size-4" aria-hidden="true" />
              )}
              Download PDF copy
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

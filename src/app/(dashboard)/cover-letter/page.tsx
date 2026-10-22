"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Loader2, Sparkles } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/api";
import { downloadHtmlPreviewPdf, downloadResumeDocx } from "@/lib/resume-document";

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

interface CoverLetterDraft {
  coverLetter: string;
  revisionNotes: string[];
}

function getSafeFileName(value: string) {
  const clean = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `cover-letter-${clean || "draft"}`;
}

export default function CoverLetterPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(true);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<"docx" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CoverLetterDraft | null>(null);
  const [coverLetter, setCoverLetter] = useState("");

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
    if (!companyName.trim()) {
      setError("Enter the company you are applying to.");
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
    formData.set("company_name", companyName.trim());
    formData.set("target_role", targetRole.trim());
    formData.set("project_ids", JSON.stringify(selectedProjectIds));
    formData.set("ai_processing_consent", "true");

    setGenerating(true);
    try {
      const response = await fetcher<CoverLetterDraft>("/resume/cover-letter", {
        method: "POST",
        body: formData,
      });
      setDraft(response);
      setCoverLetter(response.coverLetter);
    } catch (generationError: unknown) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to prepare the cover letter. Please try again.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function downloadCoverLetter(format: "docx" | "pdf") {
    if (!draft || !coverLetter.trim()) {
      setDownloadError("Generate the cover letter before downloading.");
      return;
    }
    setDownloading(format);
    setDownloadError(null);
    try {
      if (format === "docx") {
        await downloadResumeDocx(coverLetter, targetRole || "cover-letter");
      } else {
        await downloadHtmlPreviewPdf(
          "cover-letter-preview",
          `${getSafeFileName(targetRole || companyName || "cover-letter")}.pdf`,
        );
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
        title="Cover letter studio"
        description="Turn your resume and completed project proof into a polished, role-specific cover letter."
      />

      <section className="mx-auto max-w-4xl rounded-xl border border-blue-400/15 bg-blue-500/[0.04] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 size-5 shrink-0 text-blue-300" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-white">
              One tailored draft, still reviewed by you
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Upload your current resume, choose the company and role, and select completed roadmap work to support your story. Gemini drafts the cover letter and keeps the original resume untouched. You review, edit, and download the final version when ready.
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
            <h2 className="text-sm font-semibold text-white">Choose the role and evidence</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Use a text-based PDF or DOCX resume and select the completed projects that best support the role.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span>Company</span>
              <input
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                className="w-full rounded-lg border border-[#2b2f3d] bg-[#0d0f16] px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
                placeholder="Acme Studio"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Target role</span>
              <input
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value)}
                className="w-full rounded-lg border border-[#2b2f3d] bg-[#0d0f16] px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
                placeholder="Senior Product Designer"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm text-slate-300">
            <span>Resume upload</span>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-500"
            />
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-[#252836] bg-[#0e0f16] p-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="h-4 w-4 rounded border-slate-500 bg-slate-900"
            />
            I consent to sending my resume text and selected project proof to Gemini for cover letter drafting.
          </label>

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
              No completed roadmap tasks yet. Complete a project task, then generate a tailored cover letter.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {eligibleProjects.map((project) => {
                const selected = selectedProjectIds.includes(project.id);
                const disabled = !selected && selectedProjectIds.length >= 6;
                return (
                  <label
                    key={project.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      selected
                        ? "border-blue-500/40 bg-blue-500/8"
                        : "border-[#252836] bg-[#0e0f16]"
                    } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleProject(project.id)}
                      disabled={disabled}
                      className="mt-1 h-4 w-4 rounded border-slate-500 bg-slate-900"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-white">
                        {project.title}
                      </span>
                      <span className="mt-1 block text-xs text-slate-400">
                        {project.roadmapTitle}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {error ? (
            <p role="alert" className="text-sm text-rose-400">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={generating} className="gap-2">
              {generating ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Drafting...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" aria-hidden="true" />
                  Generate cover letter
                </>
              )}
            </Button>
          </div>
        </section>
      </form>

      <section className="mx-auto max-w-4xl space-y-4 rounded-xl border border-[#1f212d] bg-[#12131a] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Preview and edit</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Review the draft, make edits, and export the final version.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void downloadCoverLetter("docx")}
              disabled={!draft || !coverLetter.trim() || downloading !== null}
              className="gap-2"
            >
              {downloading === "docx" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
              Word
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void downloadCoverLetter("pdf")}
              disabled={!draft || !coverLetter.trim() || downloading !== null}
              className="gap-2"
            >
              {downloading === "pdf" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
              PDF
            </Button>
          </div>
        </div>

        {downloadError ? (
          <p role="alert" className="text-sm text-rose-400">
            {downloadError}
          </p>
        ) : null}

        <div id="cover-letter-preview" className="min-h-64 rounded-xl border border-[#272b39] bg-white p-6 text-sm leading-7 text-slate-900 shadow-inner">
          {coverLetter ? (
            <div className="whitespace-pre-wrap">{coverLetter}</div>
          ) : (
            <p className="text-slate-500">
              Your generated cover letter will appear here for review and download.
            </p>
          )}
        </div>

        {draft?.revisionNotes?.length ? (
          <div className="rounded-xl border border-[#252836] bg-[#0e0f16] p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Quick checks
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {draft.revisionNotes.map((note) => (
                <li key={note} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 rounded-full bg-blue-400" aria-hidden="true" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Textarea
          value={coverLetter}
          onChange={(event) => setCoverLetter(event.target.value)}
          className="min-h-[260px] resize-y border-[#2b2f3d] bg-[#0d0f16] text-sm leading-6 text-slate-100"
          placeholder="Your generated cover letter will appear here."
        />
      </section>
    </div>
  );
}

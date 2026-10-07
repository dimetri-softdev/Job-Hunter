"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Loader2, Sparkles } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/api";

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
  professionalSummary: string;
  projectEntries: { projectId: string; bullets: string[] }[];
  skillsToConsider: string[];
  revisionNotes: string[];
  projectTitles: Record<string, string>;
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
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ResumeDraft | null>(null);
  const [summary, setSummary] = useState("");
  const [projectBullets, setProjectBullets] = useState<Record<string, string>>(
    {},
  );
  const [skills, setSkills] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");

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
  }

  async function generateDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDraft(null);

    if (!resumeFile) {
      setError("Choose a text-based PDF or UTF-8 .txt resume first.");
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
      setSummary(response.professionalSummary);
      setProjectBullets(
        Object.fromEntries(
          response.projectEntries.map((entry) => [
            entry.projectId,
            entry.bullets.join("\n"),
          ]),
        ),
      );
      setSkills(response.skillsToConsider.join("\n"));
      setRevisionNotes(response.revisionNotes.join("\n"));
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

  function downloadDraft() {
    if (!draft) return;
    const projectSection = draft.projectEntries
      .map((entry) => {
        const title = draft.projectTitles[entry.projectId] ?? "Project";
        const bullets = (projectBullets[entry.projectId] ?? "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => `- ${line}`)
          .join("\n");
        return bullets ? `${title}\n${bullets}` : "";
      })
      .filter(Boolean)
      .join("\n\n");
    const sections = [
      `Resume update draft for: ${targetRole.trim()}`,
      "Review every statement for accuracy before adding it to your resume.",
      summary.trim() ? `PROFESSIONAL SUMMARY\n${summary.trim()}` : "",
      projectSection ? `PROJECT EXPERIENCE\n${projectSection}` : "",
      skills.trim()
        ? `SKILLS TO CONSIDER\n${skills
            .split("\n")
            .map((skill) => skill.trim())
            .filter(Boolean)
            .join(", ")}`
        : "",
      revisionNotes.trim()
        ? `VERIFY BEFORE USING\n${revisionNotes.trim()}`
        : "",
    ].filter(Boolean);
    const blob = new Blob([sections.join("\n\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeRole =
      targetRole.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
      "resume";
    link.href = url;
    link.download = `resume-update-${safeRole}.txt`;
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="Resume update"
        description="Turn completed roadmap work into truthful, editable resume suggestions for your target role."
      />

      <section className="mx-auto max-w-4xl rounded-xl border border-blue-400/15 bg-blue-500/[0.04] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 size-5 shrink-0 text-blue-300" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-white">
              Your resume stays in your hands
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Upload a text-based PDF or .txt resume each time. With your
              explicit consent, Gemini receives the resume text, target role,
              and completed task/proof notes for the selected projects. The
              upload is not saved by JobHunter. You can edit the suggestions
              and download a text draft; your original file is never replaced.
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
            Text-based PDF or UTF-8 .txt file · maximum 5 MB
            <input
              id="resume-file"
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              onChange={(event) => {
                setResumeFile(event.target.files?.[0] ?? null);
                setDraft(null);
                setError(null);
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
              I consent to sending the resume text, target role, and selected
              completed project evidence to Google Gemini to draft resume
              suggestions. I will review every claim before using it.
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
            {generating ? "Preparing suggestions..." : "Draft resume updates"}
          </Button>
        </section>
      </form>

      {draft && (
        <section className="mx-auto max-w-4xl space-y-5 rounded-xl border border-emerald-400/20 bg-[#12131a] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Review your resume suggestions
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                These are editable suggestions, not a finished or verified
                resume. Check every statement and add any dates or measurable
                results yourself.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={downloadDraft}
              className="h-9 shrink-0 border-[#2b2e3b] text-xs text-slate-200 hover:bg-[#1f212d]"
            >
              <Download className="size-4" aria-hidden="true" />
              Download draft
            </Button>
          </div>

          <label
            htmlFor="draft-summary"
            className="block text-xs font-medium text-slate-300"
          >
            Professional summary
            <Textarea
              id="draft-summary"
              maxLength={1200}
              rows={4}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              className="mt-2 resize-y border-[#2b2e3b] bg-[#0b0c12] text-sm text-white focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
            />
          </label>

          {draft.projectEntries.map((entry) => (
            <label
              key={entry.projectId}
              htmlFor={`draft-project-${entry.projectId}`}
              className="block text-xs font-medium text-slate-300"
            >
              {draft.projectTitles[entry.projectId] ?? "Project"} · resume
              bullets (one per line)
              <Textarea
                id={`draft-project-${entry.projectId}`}
                maxLength={2500}
                rows={4}
                value={projectBullets[entry.projectId] ?? ""}
                onChange={(event) =>
                  setProjectBullets((current) => ({
                    ...current,
                    [entry.projectId]: event.target.value,
                  }))
                }
                className="mt-2 resize-y border-[#2b2e3b] bg-[#0b0c12] text-sm text-white focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
              />
            </label>
          ))}

          {draft.projectEntries.length === 0 && (
            <p className="text-xs leading-5 text-slate-400">
              No project bullets were supported strongly enough by the evidence.
              You can still use any supported summary or skills below.
            </p>
          )}

          <label
            htmlFor="draft-skills"
            className="block text-xs font-medium text-slate-300"
          >
            Skills to consider adding (one per line)
            <Textarea
              id="draft-skills"
              maxLength={1200}
              rows={3}
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
              className="mt-2 resize-y border-[#2b2e3b] bg-[#0b0c12] text-sm text-white focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
            />
          </label>

          <label
            htmlFor="draft-revision-notes"
            className="block text-xs font-medium text-slate-300"
          >
            Details to verify before using (one per line)
            <Textarea
              id="draft-revision-notes"
              maxLength={1200}
              rows={3}
              value={revisionNotes}
              onChange={(event) => setRevisionNotes(event.target.value)}
              className="mt-2 resize-y border-[#2b2e3b] bg-[#0b0c12] text-sm text-white focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
            />
          </label>
        </section>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/api";

export interface TaskItem {
  id: string;
  label: string;
  completed: boolean;
}

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced" | string;
  tasks?: TaskItem[];
  onToggleTask: (taskId: string, currentCompleted: boolean) => void;
}

interface ProjectProof {
  proofUrl: string | null;
  proofNotes: string | null;
}

function ProjectProofEditor({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [proofNotes, setProofNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function toggleEditor() {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    setError(null);
    if (loaded) return;

    setLoading(true);
    try {
      const proof = await fetcher<ProjectProof>(`/projects/${projectId}/proof`);
      setProofUrl(proof.proofUrl ?? "");
      setProofNotes(proof.proofNotes ?? "");
      setLoaded(true);
      setSaved(Boolean(proof.proofUrl || proof.proofNotes));
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load this project's proof.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const proof = await fetcher<ProjectProof>(`/projects/${projectId}/proof`, {
        method: "PATCH",
        body: JSON.stringify({
          proofUrl: proofUrl.trim() || null,
          proofNotes: proofNotes.trim() || null,
        }),
      });
      setProofUrl(proof.proofUrl ?? "");
      setProofNotes(proof.proofNotes ?? "");
      setLoaded(true);
      setSaved(Boolean(proof.proofUrl || proof.proofNotes));
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save this project's proof.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-[#1f212d] pt-3">
      <Button
        type="button"
        variant="ghost"
        onClick={() => void toggleEditor()}
        className="h-8 px-2 text-[11px] text-blue-300 hover:bg-[#1f212d] hover:text-blue-200"
      >
        {saved ? "Edit portfolio proof" : "Record portfolio proof"}
      </Button>
      {open && (
        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading saved proof...
            </div>
          ) : (
            <>
              {proofUrl && (
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-[11px] text-blue-300 hover:text-blue-200"
                >
                  View saved proof
                </a>
              )}
              <form className="space-y-3" onSubmit={saveProof}>
                <div className="space-y-1.5">
                  <label
                    htmlFor={`proof-url-${projectId}`}
                    className="text-[11px] text-slate-400"
                  >
                    Portfolio or demo URL
                  </label>
                  <Input
                    id={`proof-url-${projectId}`}
                    type="url"
                    maxLength={2048}
                    value={proofUrl}
                    onChange={(event) => setProofUrl(event.target.value)}
                    placeholder="https://..."
                    className="h-9 border-[#2b2e3b] bg-[#090a0f] text-xs text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor={`proof-notes-${projectId}`}
                    className="text-[11px] text-slate-400"
                  >
                    What this demonstrates
                  </label>
                  <Textarea
                    id={`proof-notes-${projectId}`}
                    maxLength={2000}
                    rows={2}
                    value={proofNotes}
                    onChange={(event) => setProofNotes(event.target.value)}
                    placeholder="Add a short note about what you built or learned"
                    className="resize-y border-[#2b2e3b] bg-[#090a0f] text-xs text-white placeholder:text-slate-500"
                  />
                </div>
                {error && (
                  <p role="alert" className="text-xs text-rose-400">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-8 bg-blue-600 px-3 text-[11px] text-white hover:bg-blue-500"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {saving ? "Saving proof..." : "Save proof"}
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ProjectCard({
  id,
  title,
  description,
  level,
  tasks = [],
  onToggleTask,
}: ProjectCardProps) {
  const normalizedLevel = level.toUpperCase();
  const levelColor =
    normalizedLevel === "BEGINNER"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : normalizedLevel === "INTERMEDIATE"
        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
        : "bg-purple-500/10 text-purple-400 border-purple-500/20";

  return (
    <div className="bg-[#12131a] border border-[#1f212d] rounded-2xl p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {description}
          </p>
        </div>
        <span
          className={`text-[10px] px-2.5 py-1 border rounded-md font-medium uppercase tracking-wider ${levelColor}`}
        >
          {level}
        </span>
      </div>

      <div className="space-y-2 pt-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 rounded-xl border border-[#1f212d] bg-[#090a0f] p-2.5 transition hover:border-slate-700"
          >
            <button
              type="button"
              onClick={() => onToggleTask(task.id, task.completed)}
              aria-label={`${task.completed ? "Mark incomplete" : "Mark complete"}: ${task.label}`}
              aria-pressed={task.completed}
              className="flex min-w-0 flex-1 items-center gap-3 text-left focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] transition ${
                  task.completed
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-700 bg-transparent"
                }`}
              >
                {task.completed && "✓"}
              </span>
              <span
                className={`text-xs ${
                  task.completed
                    ? "line-through text-slate-500"
                    : "text-slate-300"
                }`}
              >
                {task.label}
              </span>
            </button>
          </div>
        ))}
      </div>
      <ProjectProofEditor projectId={id} />
    </div>
  );
}

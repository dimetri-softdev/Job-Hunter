"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
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
import type { ApplicationRoadmap } from "@/lib/application-types";

export function JobProofSprint({
  applicationId,
  position,
  gaps,
  onSprintCreated,
}: {
  applicationId: string;
  position: string;
  gaps: string[];
  onSprintCreated: (roadmap: ApplicationRoadmap) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedGap, setSelectedGap] = useState(gaps[0] ?? "");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateSprint() {
    setLoading(true);
    setError(null);
    try {
      const roadmap = await fetcher<ApplicationRoadmap>(
        `/applications/${applicationId}/proof-sprints`,
        {
          method: "POST",
          body: JSON.stringify({
            gap: selectedGap,
            aiProcessingConsent: consent,
          }),
        },
      );
      onSprintCreated(roadmap);
      setConsent(false);
      setOpen(false);
    } catch (generationError: unknown) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate a proof sprint for this skill gap.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setError(null);
          setConsent(false);
        }
      }}
    >
      <DialogTrigger className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-600/10 px-2.5 text-[11px] font-medium text-violet-300 hover:bg-violet-600/20">
        <Sparkles className="h-3.5 w-3.5" />
        Build proof sprint
      </DialogTrigger>
      <DialogContent className="border-[#1f212d] bg-[#0d0e14] text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Build a proof sprint</DialogTitle>
          <DialogDescription>
            Create one small portfolio project for {position} that helps you
            demonstrate a specific fit gap.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor={`proof-gap-${applicationId}`}
              className="text-xs text-slate-300"
            >
              Skill gap
            </label>
            <select
              id={`proof-gap-${applicationId}`}
              value={selectedGap}
              onChange={(event) => setSelectedGap(event.target.value)}
              className="h-10 w-full rounded-lg border border-[#2b2e3b] bg-[#090a0f] px-3 text-sm text-white outline-none focus-visible:border-blue-400"
            >
              {gaps.map((gap) => (
                <option key={gap} value={gap}>
                  {gap}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-start gap-2.5 rounded-lg border border-[#252836] bg-[#101119] p-3 text-xs leading-5 text-slate-400">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 size-4 shrink-0 accent-violet-500"
            />
            <span>
              Send only this selected skill gap and the job title to Groq to
              generate the sprint. Your resume, fit assessment, and job posting
              will not be sent.
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
              onClick={() => void generateSprint()}
              disabled={!consent || !selectedGap || loading}
              className="bg-violet-600 text-white hover:bg-violet-500"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? "Building sprint..." : "Generate proof sprint"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

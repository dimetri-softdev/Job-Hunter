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

export function JobGapRoadmap({
  applicationId,
  position,
  onRoadmapCreated,
}: {
  applicationId: string;
  position: string;
  onRoadmapCreated: (roadmap: ApplicationRoadmap) => void;
}) {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [targetLevel, setTargetLevel] = useState("Intermediate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateRoadmap() {
    setLoading(true);
    setError(null);
    try {
      const roadmap = await fetcher<ApplicationRoadmap>(
        `/applications/${applicationId}/roadmaps`,
        {
          method: "POST",
          body: JSON.stringify({
            aiProcessingConsent: consent,
            targetLevel,
          }),
        },
      );
      onRoadmapCreated(roadmap);
      setConsent(false);
      setOpen(false);
    } catch (generationError: unknown) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate a roadmap from these fit gaps.",
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
        if (nextOpen) setError(null);
      }}
    >
      <DialogTrigger className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-600/10 px-2.5 text-[11px] font-medium text-blue-300 hover:bg-blue-600/20">
        <Sparkles className="h-3.5 w-3.5" />
        Build roadmap from gaps
      </DialogTrigger>
      <DialogContent className="border-[#1f212d] bg-[#0d0e14] text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Build a focused roadmap</DialogTitle>
          <DialogDescription>
            Create a learning plan for {position} from this application&apos;s
            saved fit gaps and open questions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor={`roadmap-level-${applicationId}`} className="text-xs text-slate-300">
              Target level
            </label>
            <select
              id={`roadmap-level-${applicationId}`}
              value={targetLevel}
              onChange={(event) => setTargetLevel(event.target.value)}
              className="h-10 w-full rounded-lg border border-[#2b2e3b] bg-[#090a0f] px-3 text-sm text-white outline-none focus-visible:border-blue-400"
            >
              <option value="Junior">Junior</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Senior">Senior</option>
            </select>
          </div>
          <label className="flex items-start gap-2.5 rounded-lg border border-[#252836] bg-[#101119] p-3 text-xs leading-5 text-slate-400">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 size-4 shrink-0 accent-blue-500"
            />
            <span>
              Send the job title, fit verdict, gaps, and open questions to Groq
              to generate this roadmap. Your resume and the job-post text will
              not be sent again.
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
              onClick={() => void generateRoadmap()}
              disabled={!consent || loading}
              className="bg-blue-600 text-white hover:bg-blue-500"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? "Building roadmap..." : "Generate linked roadmap"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

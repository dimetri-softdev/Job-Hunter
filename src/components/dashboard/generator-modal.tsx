"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  RoadmapGenerator,
  type GeneratedRoadmap,
} from "@/components/RoadmapGenerator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface GeneratorModalProps {
  onRoadmapGenerated: (roadmap: GeneratedRoadmap) => void;
  buttonLabel?: string;
}

export function GeneratorModal({
  onRoadmapGenerated,
  buttonLabel = "Generate Roadmap",
}: GeneratorModalProps) {
  const [open, setOpen] = useState(false);

  const handleRoadmapCreated = (roadmap: GeneratedRoadmap) => {
    onRoadmapGenerated(roadmap);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => setOpen(nextOpen)}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
        <Sparkles className="h-4 w-4" />
        {buttonLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto border-[#1f212d] bg-[#0d0e14] text-slate-100 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">
            Create a career roadmap
          </DialogTitle>
          <DialogDescription>
            Generate a learning plan for a target role or tailor one from your
            resume.
          </DialogDescription>
        </DialogHeader>
        <RoadmapGenerator onRoadmapCreated={handleRoadmapCreated} />
      </DialogContent>
    </Dialog>
  );
}

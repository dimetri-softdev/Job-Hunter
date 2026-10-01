"use client";

import { useState } from "react";
import { fetcher } from "@/lib/api";

export interface GeneratedRoadmap {
  id: string;
  title: string;
  readinessScore: number;
  createdAt: string;
  projects: {
    id: string;
    title: string;
    description: string;
    level: string;
    tasks: { id: string; label: string; completed: boolean }[];
  }[];
}

export function RoadmapGenerator({
  onRoadmapCreated,
}: {
  onRoadmapCreated?: (data: GeneratedRoadmap) => void;
}) {
  const [activeTab, setActiveTab] = useState<"manual" | "cv">("manual");
  const [role, setRole] = useState("");
  const [targetLevel, setTargetLevel] = useState("Intermediate");
  const [cvFile, setCvFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Validation and Submission
  const handleGenerateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!role.trim()) {
      setError("Please specify a job role or position.");
      return;
    }

    setLoading(true);
    try {
      const data = await fetcher<GeneratedRoadmap>("/roadmaps/generate", {
        method: "POST",
        body: JSON.stringify({ role: role.trim(), targetLevel }),
      });
      if (onRoadmapCreated) onRoadmapCreated(data);
      setRole("");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate roadmap. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromCV = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!cvFile) {
      setError("Please select a PDF file to upload.");
      return;
    }

    if (cvFile.type !== "application/pdf") {
      setError("Only PDF documents are supported.");
      return;
    }

    if (cvFile.size > 5 * 1024 * 1024) {
      // 5MB limit
      setError("File size exceeds 5MB limit.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", cvFile);

    try {
      const data = await fetcher<GeneratedRoadmap>(
        "/roadmaps/generate-from-cv",
        {
          method: "POST",
          body: formData,
        },
      );
      if (onRoadmapCreated) onRoadmapCreated(data);
      setCvFile(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process resume. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Tab Switcher */}
      <div className="mb-6 flex gap-2 border-b border-[#1f212d] pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab("manual");
            setError(null);
          }}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === "manual"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-[#141620]"
          }`}
        >
          Manual Role Entry
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("cv");
            setError(null);
          }}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === "cv"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-[#141620]"
          }`}
        >
          Upload Resume (PDF)
        </button>
      </div>

      {/* Validation Error Alert */}
      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">
          ⚠️ {error}
        </div>
      )}

      {/* Manual Input Form */}
      {activeTab === "manual" && (
        <form onSubmit={handleGenerateManual} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Target Role
            </label>
            <input
              type="text"
              placeholder="e.g. Full Stack Developer, DevOps Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-[#1f212d] bg-[#12131a] px-3.5 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Target Experience Level
            </label>
            <select
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value)}
              className="w-full rounded-lg border border-[#1f212d] bg-[#12131a] px-3.5 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="Junior">Junior</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Senior">Senior</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition"
          >
            {loading ? "Generating Roadmap..." : "Generate AI Roadmap"}
          </button>
        </form>
      )}

      {/* Resume Upload Form */}
      {activeTab === "cv" && (
        <form onSubmit={handleGenerateFromCV} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Upload Resume (PDF only)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setCvFile(e.target.files?.[0] || null)}
              className="w-full cursor-pointer rounded-lg border border-[#1f212d] bg-[#12131a] px-3 py-2 text-xs text-slate-400 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition"
          >
            {loading
              ? "Analyzing Resume..."
              : "Generate Custom Roadmap from CV"}
          </button>
        </form>
      )}
    </div>
  );
}

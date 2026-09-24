"use client";

import React, { useState } from "react";

interface GeneratorFormProps {
  onRoadmapGenerated?: (roadmapData: any) => void;
}

export function GeneratorForm({ onRoadmapGenerated }: GeneratorFormProps) {
  const [targetRole, setTargetRole] = useState("Junior Full-Stack Engineer");
  const [techStack, setTechStack] = useState<string[]>([
    "TypeScript",
    "React",
    "Node.js",
  ]);
  const [inputTech, setInputTech] = useState("");
  const [cvSummary, setCvSummary] = useState(
    "CS student with experience in C#, Python, and Next.js.",
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTech = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputTech.trim()) {
      e.preventDefault();
      if (!techStack.includes(inputTech.trim())) {
        setTechStack([...techStack, inputTech.trim()]);
      }
      setInputTech("");
    }
  };

  const handleRemoveTech = (tagToRemove: string) => {
    setTechStack(techStack.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetRole,
          techStack,
          cvSummary,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`API Error (${res.status}):`, errorText);
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();

      if (data.success && data.roadmap && onRoadmapGenerated) {
        onRoadmapGenerated(data.roadmap);
      }
    } catch (error) {
      console.error("Failed to generate roadmap:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#12131a] border border-[#1f212d] rounded-2xl p-5 flex flex-col justify-between h-full"
    >
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-white font-semibold">
            <span>🗺️</span>
            <h2>Roadmap Generator</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Specify your target career path and technical background to update
            your track.
          </p>
        </div>

        {/* Target Role Input */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-2">
            Target Role
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full bg-[#090a0f] border border-[#1f212d] focus:border-blue-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none transition"
            required
          />
        </div>

        {/* Tech Stack Pills */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-2">
            Current Tech Stack
          </label>
          <div className="flex flex-wrap gap-1.5 p-2 bg-[#090a0f] border border-[#1f212d] rounded-xl min-h-[42px]">
            {techStack.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-[#1f212d] px-2 py-1 rounded-md flex items-center gap-1.5 text-slate-300 font-mono"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTech(tag)}
                  className="hover:text-red-400 text-slate-500 transition"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder="Add tech + Enter"
              value={inputTech}
              onChange={(e) => setInputTech(e.target.value)}
              onKeyDown={handleAddTech}
              className="bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none flex-1 min-w-[100px] px-1"
            />
          </div>
        </div>

        {/* CV Background Area */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-2">
            Background / Experience
          </label>
          <textarea
            rows={4}
            value={cvSummary}
            onChange={(e) => setCvSummary(e.target.value)}
            className="w-full bg-[#090a0f] border border-[#1f212d] focus:border-blue-500 rounded-xl p-3 text-xs text-slate-300 focus:outline-none resize-none transition"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          "✨ Generate Roadmap"
        )}
      </button>
    </form>
  );
}
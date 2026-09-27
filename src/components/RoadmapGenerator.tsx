"use client";

import { useState } from "react";

export default function RoadmapGenerator({
  onRoadmapCreated,
}: {
  onRoadmapCreated: () => void;
}) {
  const [role, setRole] = useState("Full-Stack Developer");
  const [targetLevel, setTargetLevel] = useState("Junior");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle standard manual role submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/v1/roadmaps/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, targetLevel, userId: "usr_demo" }),
        },
      );
      if (res.ok) onRoadmapCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle CV upload submission
  const handleCvUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", "usr_demo");

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/v1/roadmaps/generate-from-cv",
        {
          method: "POST",
          body: formData,
        },
      );
      if (res.ok) onRoadmapCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-white space-y-6">
      <h2 className="text-xl font-bold">Generate Your Career Roadmap</h2>

      {/* CV Upload Section */}
      <div className="border-2 border-dashed border-slate-700 p-4 rounded-lg text-center bg-slate-800/50">
        <p className="text-sm text-slate-300 mb-2">
          Fast Track: Upload your Resume/CV (PDF)
        </p>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
        />
        {file && (
          <button
            onClick={handleCvUpload}
            disabled={loading}
            className="mt-3 block w-full bg-green-600 hover:bg-green-500 text-white font-medium py-2 rounded-lg text-sm transition"
          >
            {loading
              ? "Analyzing Resume & Generating..."
              : "Generate from Resume"}
          </button>
        )}
      </div>

      <div className="text-center text-xs text-slate-500 uppercase tracking-widest">
        — OR —
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleManualSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-400">
            Target Role
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-400">
            Target Level
          </label>
          <select
            value={targetLevel}
            onChange={(e) => setTargetLevel(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="Junior">Junior</option>
            <option value="Mid-Level">Mid-Level</option>
            <option value="Senior">Senior</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg text-sm transition"
        >
          {loading ? "Generating Roadmap..." : "Generate Roadmap"}
        </button>
      </form>
    </div>
  );
}

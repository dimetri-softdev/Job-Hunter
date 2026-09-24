"use client";

import React, { useState } from "react";
import { GeneratorForm } from "./generator-form";

interface GeneratorModalProps {
  onRoadmapGenerated: (roadmapData: any) => void;
}

export function GeneratorModal({ onRoadmapGenerated }: GeneratorModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleGenerated = (roadmapData: any) => {
    onRoadmapGenerated(roadmapData);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
      >
        <span>✨</span> Generate New Roadmap
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#12131a] border border-[#1f212d] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#1f212d]">
              <h3 className="font-semibold text-white text-base">
                New Roadmap Generator
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition text-lg px-2"
              >
                ✕
              </button>
            </div>

            <GeneratorForm onRoadmapGenerated={handleGenerated} />
          </div>
        </div>
      )}
    </>
  );
}

import { useState } from "react";
import { fetcher } from "@/lib/api";

export function GeneratorModal({ onRoadmapGenerated }: { onRoadmapGenerated: (roadmap: any) => void }) {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!role) return;
    setLoading(true);
    try {
      const newRoadmap = await fetcher("/roadmaps/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, targetLevel: "Junior" }),
      });
      onRoadmapGenerated(newRoadmap);
    } catch (err) {
      console.error("Failed to generate roadmap:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Modal JSX elements with handleGenerate tied to your Submit button */}
    </div>
  );
}
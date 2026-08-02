"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

interface Step {
  order: number;
  title: string;
  description: string;
}

interface Project {
  title: string;
  description: string;
  difficulty: string;
  skillsTargeted: string[];
  steps: Step[];
}

interface RoadmapData {
  readinessScore: number;
  gapAnalysis: string;
  projects: Project[];
  targetRole: string;
}

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    targetRole: "",
    currentTechStack: "",
    resumeText: "",
  });

  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track completed steps using keys like "projectIndex-stepIndex"
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCompletedSteps({}); // Reset completed steps for new roadmap

    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          currentTechStack: formData.currentTechStack
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Server HTML Response:", text);
        throw new Error(`Server returned status ${res.status}. Check your terminal logs.`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate roadmap");
      }

      setRoadmap(data.roadmap);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (pIdx: number, stepIdx: number) => {
    const key = `${pIdx}-${stepIdx}`;
    setCompletedSteps((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Calculate total steps and total completed steps for overall progress
  const totalSteps = roadmap
    ? roadmap.projects.reduce((acc, proj) => acc + (proj.steps?.length || 0), 0)
    : 0;

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const overallProgress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Jobhunter Career Co-Pilot 🚀
          </h1>
          <p className="text-muted-foreground text-lg">
            Turn your current tech stack into a targeted, hiring-manager-ready portfolio.
          </p>
        </div>

        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Build Your Personalized Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Your Name</label>
                  <Input
                    placeholder="e.g. Alex Johnson"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    type="email"
                    placeholder="alex@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Target Job Role *</label>
                <Input
                  required
                  placeholder="e.g. Junior Full-Stack React & Node Developer"
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Current Tech Stack (comma separated) *
                </label>
                <Input
                  required
                  placeholder="e.g. React, JavaScript, HTML, Tailwind, Express"
                  value={formData.currentTechStack}
                  onChange={(e) => setFormData({ ...formData, currentTechStack: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Resume Summary / Background Details (Optional)
                </label>
                <textarea
                  className="w-full min-h-[100px] p-3 rounded-md border text-sm bg-background"
                  placeholder="Paste brief highlights from your resume, projects, or background..."
                  value={formData.resumeText}
                  onChange={(e) => setFormData({ ...formData, resumeText: e.target.value })}
                />
              </div>

              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Analyzing Profile & Generating Roadmap..." : "Generate Portfolio Roadmap"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generated Roadmap Output */}
        {roadmap && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Market Readiness & Portfolio Execution Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Market Readiness Score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold">{roadmap.readinessScore}% Match</span>
                    <Badge variant={roadmap.readinessScore > 70 ? "default" : "secondary"}>
                      {roadmap.targetRole}
                    </Badge>
                  </div>
                  <Progress value={roadmap.readinessScore} className="h-3" />
                  <div className="pt-2">
                    <h4 className="font-semibold text-sm mb-1">Gap Analysis:</h4>
                    <p className="text-sm text-muted-foreground">{roadmap.gapAnalysis}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Execution Progress Bar */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Portfolio Execution Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold">{overallProgress}% Done</span>
                    <span className="text-sm text-muted-foreground font-medium">
                      {completedCount} of {totalSteps} steps completed
                    </span>
                  </div>
                  <Progress value={overallProgress} className="h-3" />
                  <p className="text-xs text-muted-foreground pt-2">
                    Check off steps below as you build out your projects!
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recommended Projects */}
            <h2 className="text-2xl font-bold">Recommended Portfolio Projects</h2>
            <div className="space-y-4">
              {roadmap.projects?.map((proj, pIdx) => {
                const projSteps = proj.steps || [];
                const projCompleted = projSteps.filter((_, sIdx) => completedSteps[`${pIdx}-${sIdx}`]).length;
                
                return (
                  <Card key={pIdx}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {proj.title}
                            {projCompleted === projSteps.length && projSteps.length > 0 && (
                              <Badge variant="default" className="bg-green-600 text-white">
                                Completed 🎉
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{proj.description}</p>
                        </div>
                        <Badge variant="outline">{proj.difficulty}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {proj.skillsTargeted?.map((skill, sIdx) => (
                          <Badge key={sIdx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <h4 className="font-semibold text-sm mb-2">Execution Steps:</h4>
                      <div className="space-y-2">
                        {projSteps.map((step, stepIdx) => {
                          const isDone = !!completedSteps[`${pIdx}-${stepIdx}`];
                          return (
                            <div
                              key={stepIdx}
                              onClick={() => toggleStep(pIdx, stepIdx)}
                              className={`p-3 rounded-lg border text-sm flex items-start gap-3 cursor-pointer transition-colors ${
                                isDone
                                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 line-through opacity-75"
                                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                              }`}
                            >
                              <Checkbox
                                checked={isDone}
                                onCheckedChange={() => toggleStep(pIdx, stepIdx)}
                                className="mt-0.5"
                              />
                              <div>
                                <p className="font-medium">
                                  Step {step.order}: {step.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {step.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
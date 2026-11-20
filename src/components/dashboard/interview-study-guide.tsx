"use client";

import { useState } from "react";
import { BookOpenCheck, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/api";

interface InterviewStudyGuideData {
  overview: string;
  topics: Array<{
    title: string;
    summary: string;
    keyPoints: string[];
    commonPitfalls: string[];
  }>;
  workedExamples: Array<{
    title: string;
    scenario: string;
    exampleResponse: string;
    personalizeBy: string;
  }>;
  flashcards: Array<{ question: string; answer: string }>;
  studyPlan: Array<{ activity: string; minutes: number }>;
}

export function InterviewStudyGuide({
  role,
  company,
  jobDescription,
  interviewOutline,
  focusAreas,
  aiConsent,
}: {
  role: string;
  company: string;
  jobDescription: string;
  interviewOutline: string;
  focusAreas: string[];
  aiConsent: boolean;
}) {
  const [guide, setGuide] = useState<InterviewStudyGuideData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  async function generateGuide() {
    if (!role.trim()) {
      setError("Enter the role you are preparing for first.");
      return;
    }
    if (!aiConsent) {
      setError("Agree to AI processing before generating a study guide.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher<InterviewStudyGuideData>(
        "/interview-practice",
        {
          method: "POST",
          body: JSON.stringify({
            aiProcessingConsent: aiConsent,
            action: "study",
            role: role.trim(),
            company: company.trim(),
            jobDescription,
            interviewOutline,
            focusAreas,
          }),
        },
      );
      if (
        !result ||
        !Array.isArray(result.topics) ||
        !Array.isArray(result.workedExamples) ||
        !Array.isArray(result.flashcards) ||
        !Array.isArray(result.studyPlan)
      ) {
        throw new Error("The study guide response was incomplete. Try again.");
      }
      setGuide(result);
      setRevealedCards(new Set());
      setCompletedSteps(new Set());
    } catch (generationError: unknown) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate an interview study guide.",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleCard(index: number) {
    setRevealedCards((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function toggleStep(index: number) {
    setCompletedSteps((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border border-violet-400/20 bg-violet-500/[0.04] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300">
            Optional first step
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
            <BookOpenCheck className="size-4 text-violet-200" aria-hidden="true" />
            Study before you practice
          </h2>
          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">
            Get a role- and interview-specific topic guide, worked examples,
            flashcards, and a short study plan. It adapts to different roles and
            interview outlines; you can skip it and practice at any time.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void generateGuide()}
          disabled={loading || !aiConsent || !role.trim()}
          className="gap-2 bg-violet-600 text-white hover:bg-violet-500"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : guide ? (
            <RotateCcw className="size-4" aria-hidden="true" />
          ) : (
            <Sparkles className="size-4" aria-hidden="true" />
          )}
          {loading ? "Preparing study guide..." : guide ? "Refresh study guide" : "Generate study guide"}
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-xs leading-5 text-rose-300">
          {error}
        </p>
      ) : null}

      {guide ? (
        <div className="space-y-5 border-t border-violet-300/10 pt-4">
          <p className="rounded-lg border border-violet-300/10 bg-black/10 p-3 text-xs leading-5 text-slate-200">
            {guide.overview}
          </p>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-white">
              Topics to understand
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {guide.topics.map((topic) => (
                <article
                  key={topic.title}
                  className="space-y-2 rounded-lg border border-white/[0.07] bg-[#0b0c12] p-3"
                >
                  <h4 className="text-xs font-semibold text-violet-100">
                    {topic.title}
                  </h4>
                  <p className="text-[11px] leading-5 text-slate-300">
                    {topic.summary}
                  </p>
                  <ul className="list-disc space-y-1 pl-4 text-[11px] leading-5 text-slate-400">
                    {topic.keyPoints.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                  {topic.commonPitfalls.length ? (
                    <p className="text-[10px] leading-4 text-amber-100/70">
                      Watch for: {topic.commonPitfalls.join(" · ")}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-white">
              Worked examples
            </h3>
            <div className="space-y-3">
              {guide.workedExamples.map((example) => (
                <article
                  key={example.title}
                  className="space-y-2 rounded-lg border border-white/[0.07] bg-[#0b0c12] p-3"
                >
                  <h4 className="text-xs font-semibold text-cyan-100">
                    {example.title}
                  </h4>
                  <p className="text-[11px] leading-5 text-slate-400">
                    <span className="font-medium text-slate-300">Scenario: </span>
                    {example.scenario}
                  </p>
                  <p className="whitespace-pre-wrap text-[11px] leading-5 text-slate-200">
                    {example.exampleResponse}
                  </p>
                  <p className="text-[10px] leading-4 text-amber-100/70">
                    Make it yours: {example.personalizeBy}
                  </p>
                </article>
              ))}
            </div>
            <p className="text-[10px] leading-4 text-slate-500">
              Examples are illustrative, not claims about your personal
              experience. Replace hypothetical details with truthful examples.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-white">
              Flashcards · {revealedCards.size} of {guide.flashcards.length} revealed
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {guide.flashcards.map((card, index) => {
                const revealed = revealedCards.has(index);
                return (
                  <button
                    key={`${card.question}-${index}`}
                    type="button"
                    aria-expanded={revealed}
                    onClick={() => toggleCard(index)}
                    className="rounded-lg border border-white/[0.07] bg-[#0b0c12] p-3 text-left"
                  >
                    <span className="block text-[11px] font-medium leading-5 text-slate-200">
                      {card.question}
                    </span>
                    <span className="mt-2 block text-[10px] leading-4 text-violet-200">
                      {revealed ? card.answer : "Show answer"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-white">Study plan</h3>
              <span className="text-[10px] text-slate-500">
                {completedSteps.size} of {guide.studyPlan.length} complete
              </span>
            </div>
            <ol className="space-y-2">
              {guide.studyPlan.map((step, index) => (
                <li key={`${step.activity}-${index}`}>
                  <label className="flex items-start gap-2 rounded-lg border border-white/[0.07] bg-[#0b0c12] p-3 text-[11px] leading-5 text-slate-300">
                    <input
                      type="checkbox"
                      checked={completedSteps.has(index)}
                      onChange={() => toggleStep(index)}
                      className="mt-1 size-3.5 shrink-0 accent-violet-500"
                    />
                    <span className="flex-1">{step.activity}</span>
                    <span className="shrink-0 text-[10px] text-slate-500">
                      {step.minutes} min
                    </span>
                  </label>
                </li>
              ))}
            </ol>
          </section>
        </div>
      ) : null}
    </section>
  );
}

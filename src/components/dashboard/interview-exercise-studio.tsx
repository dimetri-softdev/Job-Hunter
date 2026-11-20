"use client";

import { useEffect, useState } from "react";
import { Clock3, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/api";
import type { MockInterviewFeedback } from "@/components/dashboard/mock-interview-room";

type ExerciseType =
  | "code-review"
  | "case-study"
  | "portfolio-presentation"
  | "role-specific-task"
  | "custom";

interface InterviewExercise {
  exerciseType: ExerciseType;
  title: string;
  instructions: string;
  material: string;
  debriefQuestions: string[];
}

const exerciseOptions: Array<{ value: ExerciseType; label: string }> = [
  { value: "code-review", label: "Code review" },
  { value: "case-study", label: "Case study / problem solving" },
  { value: "portfolio-presentation", label: "Portfolio / project presentation" },
  { value: "role-specific-task", label: "Role-specific practical task" },
  { value: "custom", label: "Follow my interview outline" },
];

export function InterviewExerciseStudio({
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
  const [exerciseType, setExerciseType] = useState<ExerciseType>("custom");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [exerciseDuration, setExerciseDuration] = useState(15);
  const [exercise, setExercise] = useState<InterviewExercise | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<MockInterviewFeedback | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deadline === null) return;
    const timer = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next === 0) setDeadline(null);
    }, 250);
    return () => window.clearInterval(timer);
  }, [deadline]);

  const minutes = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (remainingSeconds % 60).toString().padStart(2, "0");

  async function generateExercise() {
    if (!aiConsent) {
      setError("Agree to AI processing before generating an exercise.");
      return;
    }
    setGenerating(true);
    setError(null);
    setFeedback(null);
    setNotes("");
    setDeadline(null);
    try {
      const result = await fetcher<InterviewExercise>("/interview-practice", {
        method: "POST",
        body: JSON.stringify({
          aiProcessingConsent: aiConsent,
          action: "exercise",
          role,
          company,
          jobDescription,
          interviewOutline,
          focusAreas,
          exerciseType,
          exerciseDurationMinutes: durationMinutes,
        }),
      });
      setExercise(result);
      setExerciseDuration(durationMinutes);
      setRemainingSeconds(durationMinutes * 60);
    } catch (generationError: unknown) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate a practical exercise.",
      );
    } finally {
      setGenerating(false);
    }
  }

  function startTimer() {
    if (remainingSeconds > 0) setDeadline(Date.now() + remainingSeconds * 1000);
  }

  function pauseTimer() {
    if (deadline !== null) {
      setRemainingSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
      setDeadline(null);
    }
  }

  function resetTimer() {
    setDeadline(null);
    setRemainingSeconds(exercise ? exerciseDuration * 60 : 0);
  }

  async function reviewNotes() {
    if (!exercise || !notes.trim()) {
      setError("Add your findings or approach notes before requesting feedback.");
      return;
    }
    setReviewing(true);
    setError(null);
    try {
      const result = await fetcher<MockInterviewFeedback>("/interview-practice", {
        method: "POST",
        body: JSON.stringify({
          aiProcessingConsent: aiConsent,
          action: "exercise-feedback",
          role,
          company,
          jobDescription,
          interviewOutline,
          focusAreas,
          question: `${exercise.title}\n${exercise.instructions}`.slice(0, 1000),
          exerciseMaterial: exercise.material,
          answer: notes.trim(),
        }),
      });
      setFeedback(result);
    } catch (reviewError: unknown) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Unable to review your exercise notes.",
      );
    } finally {
      setReviewing(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-cyan-400/15 bg-[#101119] p-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
          Practical exercise
        </p>
        <h2 className="mt-1 text-sm font-semibold text-white">
          Practice the work, not just the questions
        </h2>
        <p className="mt-1 text-[11px] leading-5 text-slate-400">
          Generate a timed exercise suited to this role and interview outline.
          Code review is one option; choose a different format for other careers.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <label className="space-y-1.5 text-xs text-slate-300">
          Exercise format
          <select
            value={exerciseType}
            onChange={(event) => {
              const selected = exerciseOptions.find(
                (option) => option.value === event.target.value,
              );
              if (selected) setExerciseType(selected.value);
            }}
            disabled={generating}
            className="h-10 w-full rounded-lg border border-[#2b2e3b] bg-[#090a0f] px-3 text-sm text-white outline-none focus-visible:border-cyan-400"
          >
            {exerciseOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-xs text-slate-300">
          Time limit
          <select
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
            disabled={generating}
            className="h-10 w-full rounded-lg border border-[#2b2e3b] bg-[#090a0f] px-3 text-sm text-white outline-none focus-visible:border-cyan-400"
          >
            {[10, 15, 20, 30, 45].map((duration) => (
              <option key={duration} value={duration}>
                {duration} minutes
              </option>
            ))}
          </select>
        </label>
      </div>

      <Button
        type="button"
        onClick={() => void generateExercise()}
        disabled={generating || deadline !== null || !aiConsent || !role.trim()}
        className="gap-2 bg-cyan-700 text-white hover:bg-cyan-600"
      >
        {generating ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="size-4" aria-hidden="true" />
        )}
        {generating ? "Creating exercise..." : exercise ? "Create another exercise" : "Generate practical exercise"}
      </Button>

      {exercise ? (
        <div className="space-y-4 rounded-xl border border-white/[0.08] bg-[#090a0f] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">{exercise.title}</h3>
              <p className="mt-1 text-[10px] text-slate-500">
                {exerciseOptions.find((option) => option.value === exercise.exerciseType)?.label}
                {" · "}{exerciseDuration} minutes
              </p>
            </div>
            <div
              role="timer"
              aria-live="off"
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-lg font-semibold ${
                remainingSeconds === 0
                  ? "border-amber-300/20 text-amber-200"
                  : "border-cyan-300/20 text-cyan-100"
              }`}
            >
              <Clock3 className="size-4" aria-hidden="true" />
              {minutes}:{seconds}
            </div>
          </div>

          <p className="whitespace-pre-wrap text-xs leading-5 text-slate-300">
            {exercise.instructions}
          </p>

          {exercise.material ? (
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-white/[0.08] bg-black/30 p-3 font-mono text-[11px] leading-5 text-slate-200">
              {exercise.material}
            </pre>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {deadline === null ? (
              <Button
                type="button"
                onClick={startTimer}
                disabled={remainingSeconds === 0}
                className="bg-cyan-700 text-white hover:bg-cyan-600"
              >
                {remainingSeconds === exerciseDuration * 60 ? "Start timer" : "Resume"}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={pauseTimer}>
                Pause timer
              </Button>
            )}
            <Button type="button" variant="outline" onClick={resetTimer}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Reset timer
            </Button>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="interview-exercise-notes"
              className="text-xs font-medium text-slate-300"
            >
              Your findings, assumptions, and approach
            </label>
            <Textarea
              id="interview-exercise-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={4000}
              rows={7}
              placeholder="Capture what you noticed, what you would prioritize, questions you would ask, and how you would explain your decisions."
              className="resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
            />
          </div>

          {exercise.debriefQuestions.length > 0 ? (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <h4 className="text-xs font-semibold text-slate-200">
                Debrief yourself
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-5 text-slate-400">
                {exercise.debriefQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <Button
            type="button"
            onClick={() => void reviewNotes()}
            disabled={reviewing || !notes.trim()}
            variant="outline"
          >
            {reviewing ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            {reviewing ? "Reviewing notes..." : "Get AI feedback on my notes"}
          </Button>

          {feedback ? (
            <div className="space-y-3 rounded-lg border border-emerald-400/15 bg-emerald-500/[0.04] p-3">
              <h4 className="text-xs font-semibold text-emerald-200">
                Feedback on your approach
              </h4>
              <ul className="list-disc space-y-1 pl-4 text-[11px] leading-5 text-slate-300">
                {feedback.strengths.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <ul className="list-disc space-y-1 pl-4 text-[11px] leading-5 text-amber-100/80">
                {feedback.improvements.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p className="text-[11px] leading-5 text-slate-300">
                {feedback.answerStructure}
              </p>
              <p className="text-[11px] leading-5 text-cyan-100">
                Follow-up to practice: {feedback.followUpQuestion}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs leading-5 text-rose-300">
          {error}
        </p>
      ) : null}
      <p className="text-[10px] leading-4 text-slate-500">
        Generated exercises are practice material, not an assessment of your
        ability. Only the notes you submit for feedback are sent to AI.
      </p>
    </section>
  );
}

"use client";

import { useState } from "react";
import { Download, Loader2, MessageSquareText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import {
  MockInterviewRoom,
  type InterviewAnswerRubric,
  type InterviewSessionSummary,
  type MockInterviewFeedback,
  type MockInterviewQuestion,
} from "@/components/dashboard/mock-interview-room";
import { fetcher } from "@/lib/api";
import { InterviewExerciseStudio } from "@/components/dashboard/interview-exercise-studio";

const availableFocusAreas = [
  "Behavioral examples",
  "Role-specific skills",
  "Technical or professional concepts",
  "Practical exercises",
  "Leadership and collaboration",
  "Communication",
  "Culture and motivation",
  "Portfolio or case study",
];

export function StandaloneInterviewPractice() {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [interviewOutline, setInterviewOutline] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [aiConsent, setAiConsent] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<MockInterviewQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<
    Record<string, MockInterviewFeedback>
  >({});
  const [firstRubric, setFirstRubric] = useState<
    Record<string, InterviewAnswerRubric>
  >({});
  const [firstCoachedAnswers, setFirstCoachedAnswers] = useState<
    Record<string, string>
  >({});
  const [coachedAnswers, setCoachedAnswers] = useState<Record<string, string>>(
    {},
  );
  const [sessionSummary, setSessionSummary] =
    useState<InterviewSessionSummary | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  async function generateQuestions(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanRole = role.trim();
    if (!cleanRole) {
      setError("Enter the role you want to practice for.");
      return;
    }
    if (!aiConsent) {
      setError("Confirm AI consent before generating interview questions.");
      return;
    }

    setGeneratingQuestions(true);
    setError(null);
    try {
      const result = await fetcher<{ questions: MockInterviewQuestion[] }>(
        "/interview-practice",
        {
          method: "POST",
          body: JSON.stringify({
            aiProcessingConsent: aiConsent,
            action: "questions",
            role: cleanRole,
            company: company.trim(),
            jobDescription: jobDescription.trim(),
            interviewOutline: interviewOutline.trim(),
            focusAreas,
          }),
        },
      );
      if (!Array.isArray(result.questions) || result.questions.length < 4) {
        throw new Error("The interview practice response was incomplete. Try again.");
      }
      setQuestions(result.questions);
      setSessionKey((current) => current + 1);
      setAnswers({});
      setFeedback({});
      setFirstRubric({});
      setFirstCoachedAnswers({});
      setCoachedAnswers({});
      setSessionSummary(null);
    } catch (generationError: unknown) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate interview questions.",
      );
    } finally {
      setGeneratingQuestions(false);
    }
  }

  async function coachAnswer(question: string, answer: string) {
    const cleanAnswer = answer.trim();
    if (!cleanAnswer) {
      setError("Speak or type an answer before requesting coaching.");
      return;
    }
    if (!aiConsent) {
      setError("Confirm AI consent before requesting answer coaching.");
      return;
    }

    setFeedbackFor(question);
    setError(null);
    try {
      const result = await fetcher<MockInterviewFeedback>(
        "/interview-practice",
        {
          method: "POST",
          body: JSON.stringify({
            aiProcessingConsent: aiConsent,
            action: "feedback",
            role: role.trim(),
            company: company.trim(),
            jobDescription: jobDescription.trim(),
            interviewOutline: interviewOutline.trim(),
            focusAreas,
            question,
            answer: cleanAnswer,
          }),
        },
      );
      setFeedback((current) => ({ ...current, [question]: result }));
      setFirstRubric((current) =>
        Object.prototype.hasOwnProperty.call(current, question)
          ? current
          : { ...current, [question]: result.rubric },
      );
      setFirstCoachedAnswers((current) =>
        Object.prototype.hasOwnProperty.call(current, question)
          ? current
          : { ...current, [question]: cleanAnswer },
      );
      setCoachedAnswers((current) => ({
        ...current,
        [question]: cleanAnswer,
      }));
    } catch (coachingError: unknown) {
      setError(
        coachingError instanceof Error
          ? coachingError.message
          : "Unable to provide interview coaching.",
      );
    } finally {
      setFeedbackFor(null);
    }
  }

  function startNewPractice() {
    setQuestions([]);
    setAnswers({});
    setFeedback({});
    setFirstRubric({});
    setFirstCoachedAnswers({});
    setCoachedAnswers({});
    setSessionSummary(null);
    setError(null);
  }

  function downloadSessionNotes() {
    if (!sessionSummary) return;
    const lines = [
      `Mock interview practice · ${role.trim()}`,
      company.trim() ? `Company: ${company.trim()}` : "",
      interviewOutline.trim()
        ? `Interview outline:\n${interviewOutline.trim()}`
        : "",
      focusAreas.length ? `Focus areas: ${focusAreas.join(", ")}` : "",
      `Practice points: ${sessionSummary.points}`,
      `Answers: ${sessionSummary.answered} · Coached: ${sessionSummary.reviewed} · Improved on retry: ${sessionSummary.improved}`,
      sessionSummary.averageScore === null
        ? "Average answer score: not rated"
        : `Average answer score: ${sessionSummary.averageScore.toFixed(1)}/5`,
      "",
      "Rubric averages (1-5)",
      `Relevance: ${sessionSummary.dimensions.relevance?.toFixed(1) ?? "not rated"}`,
      `Clarity: ${sessionSummary.dimensions.clarity?.toFixed(1) ?? "not rated"}`,
      `Problem-solving: ${sessionSummary.dimensions.problemSolving?.toFixed(1) ?? "not rated"}`,
      `Specificity: ${sessionSummary.dimensions.specificity?.toFixed(1) ?? "not rated"}`,
      "",
      "Strengths",
      ...sessionSummary.strengths.map((item) => `- ${item}`),
      "",
      "Practice next",
      ...sessionSummary.focusPoints.map((item) => `- ${item}`),
      "",
      "Scores are practice coaching on answer content, not a hiring prediction.",
    ].filter((line) => line !== undefined);
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "interview-practice-notes.txt";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Interview practice"
        description="A dedicated practice room for any role. Build a realistic round, practice out loud, and get specific feedback on what to keep doing and what to work on next."
      >
        {questions.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={startNewPractice}
            className="gap-2 border-white/10 text-slate-200"
          >
            New practice
          </Button>
        ) : null}
      </DashboardPageHeader>

      <div className="grid gap-5 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
        <form
          onSubmit={(event) => void generateQuestions(event)}
          className="h-fit space-y-4 rounded-2xl border border-white/[0.08] bg-[#101119] p-5"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-200">
              <MessageSquareText className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Set up your practice
              </h2>
              <p className="mt-1 text-[11px] leading-5 text-slate-400">
                Practice a role from your tracker or prepare for an opportunity
                you have not saved yet.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="standalone-interview-role"
              className="text-xs font-medium text-slate-300"
            >
              Role you&apos;re targeting
            </label>
            <Input
              id="standalone-interview-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              maxLength={160}
              required
              placeholder="e.g. Product Designer"
              className="border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="standalone-interview-company"
              className="text-xs font-medium text-slate-300"
            >
              Company <span className="text-slate-500">(optional)</span>
            </label>
            <Input
              id="standalone-interview-company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              maxLength={160}
              placeholder="Company name"
              className="border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="standalone-interview-description"
              className="text-xs font-medium text-slate-300"
            >
              Job description{" "}
              <span className="text-slate-500">(optional, for tailored questions)</span>
            </label>
            <Textarea
              id="standalone-interview-description"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              maxLength={12000}
              rows={7}
              placeholder="Paste the role responsibilities or requirements you want to practice against."
              className="resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="standalone-interview-outline"
              className="text-xs font-medium text-slate-300"
            >
              Interview outline or invitation{" "}
              <span className="text-slate-500">(optional, for tailored practice)</span>
            </label>
            <Textarea
              id="standalone-interview-outline"
              value={interviewOutline}
              onChange={(event) => setInterviewOutline(event.target.value)}
              maxLength={12000}
              rows={6}
              placeholder="Paste an interview email, agenda, exercise instructions, or topics you expect. Remove private details you do not want to share."
              className="resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-slate-300">
              What would you like to practice?{" "}
              <span className="text-slate-500">(optional)</span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {availableFocusAreas.map((area) => (
                <label
                  key={area}
                  className="flex items-start gap-2 rounded-lg border border-white/[0.06] bg-black/10 p-2 text-[11px] leading-4 text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={focusAreas.includes(area)}
                    onChange={(event) =>
                      setFocusAreas((current) =>
                        event.target.checked
                          ? [...current, area]
                          : current.filter((item) => item !== area),
                      )
                    }
                    className="mt-0.5 size-3.5 shrink-0 accent-violet-500"
                  />
                  {area}
                </label>
              ))}
            </div>
            <p className="text-[10px] leading-4 text-slate-500">
              Leave all unchecked to let the AI choose a balanced mix suited
              to the role and outline.
            </p>
          </fieldset>

          <div className="space-y-3 rounded-xl border border-violet-400/15 bg-violet-500/[0.04] p-3">
            <label className="flex items-start gap-2 text-[11px] leading-5 text-slate-300">
              <input
                type="checkbox"
                checked={aiConsent}
                onChange={(event) => setAiConsent(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-slate-500 bg-slate-900"
              />
              I agree to send the role details, selected focus areas, and any
              interview outline above to AI to generate practice questions or
              exercises. I also agree to send only the answers or exercise notes
              and the exercise material needed to review them if I request
              coaching.
            </label>
            <p className="text-[10px] leading-4 text-slate-500">
              No job application is required. Video is a local preview only.
              Audio/video are not uploaded by JobHunter; browser speech
              recognition may process audio through its provider.
            </p>
          </div>

          {error ? (
            <p role="alert" className="text-xs leading-5 text-rose-300">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={generatingQuestions || !aiConsent}
            className="w-full gap-2 bg-violet-600 text-white hover:bg-violet-500"
          >
            {generatingQuestions ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            {generatingQuestions
              ? "Building your practice round..."
              : questions.length
                ? "Generate a new question set"
                : "Generate interview questions"}
          </Button>
        </form>

        <div className="min-w-0 space-y-4">
          {questions.length > 0 ? (
            <MockInterviewRoom
              key={sessionKey}
              position={role.trim()}
              company={company.trim() || "your target company"}
              questions={questions}
              answers={answers}
              feedback={feedback}
              firstRubric={firstRubric}
              firstCoachedAnswers={firstCoachedAnswers}
              coachedAnswers={coachedAnswers}
              feedbackFor={feedbackFor}
              onAnswerChange={(question, answer) =>
                setAnswers((current) => ({ ...current, [question]: answer }))
              }
              onCoach={(question, answer) =>
                void coachAnswer(question, answer)
              }
              onSessionFinished={setSessionSummary}
              onSessionReset={() => {
                setAnswers({});
                setFeedback({});
                setFirstRubric({});
                setFirstCoachedAnswers({});
                setCoachedAnswers({});
                setSessionSummary(null);
              }}
            />
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#101119]/60 px-6 py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.06] text-cyan-200">
                <Sparkles className="size-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-sm font-semibold text-white">
                Your interview room is ready when you are
              </h2>
              <p className="mt-2 max-w-md text-xs leading-5 text-slate-400">
                Enter a role and generate a practice set. Choose voice or typed
                answers, turn on the optional camera preview, and review a
                coaching scorecard when you finish.
              </p>
            </div>
          )}

          <InterviewExerciseStudio
            role={role.trim()}
            company={company.trim()}
            jobDescription={jobDescription.trim()}
            interviewOutline={interviewOutline.trim()}
            focusAreas={focusAreas}
            aiConsent={aiConsent}
          />

          {sessionSummary ? (
            <Button
              type="button"
              variant="outline"
              onClick={downloadSessionNotes}
              className="gap-2 border-white/10 text-slate-200"
            >
              <Download className="size-4" aria-hidden="true" />
              Download session notes
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

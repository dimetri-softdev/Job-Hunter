"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Award,
  Lightbulb,
  Loader2,
  Mic,
  MicOff,
  Play,
  Sparkles,
  Star,
  Target,
  Trophy,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface MockInterviewQuestion {
  category: "behavioral" | "role-specific" | "situational" | "fit";
  question: string;
  focus: string;
}

export interface MockInterviewFeedback {
  strengths: string[];
  improvements: string[];
  answerStructure: string;
  followUpQuestion: string;
  rubric: InterviewAnswerRubric;
}

export interface InterviewAnswerRating {
  score: number;
  evidence: string;
}

export interface InterviewAnswerRubric {
  relevance: InterviewAnswerRating;
  clarity: InterviewAnswerRating;
  problemSolving: InterviewAnswerRating;
  specificity: InterviewAnswerRating;
}

export interface InterviewSessionSummary {
  averageScore: number | null;
  points: number;
  answered: number;
  reviewed: number;
  improved: number;
  dimensions: Record<keyof InterviewAnswerRubric, number | null>;
  strengths: string[];
  focusPoints: string[];
}

const rubricDimensions: {
  key: keyof InterviewAnswerRubric;
  label: string;
  description: string;
}[] = [
  {
    key: "relevance",
    label: "Relevance",
    description: "How directly your answer addresses the question.",
  },
  {
    key: "problemSolving",
    label: "Problem-solving",
    description: "How clearly you explain your approach and decisions.",
  },
  {
    key: "clarity",
    label: "Clarity",
    description: "How easy your explanation is to follow.",
  },
  {
    key: "specificity",
    label: "Specificity",
    description: "How well your answer uses a grounded example.",
  },
];

function getRubricAverage(rubric: InterviewAnswerRubric) {
  const scores = rubricDimensions.map(({ key }) => rubric[key].score);
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function getSessionSummary(
  questions: MockInterviewQuestion[],
  answers: Record<string, string>,
  feedback: Record<string, MockInterviewFeedback>,
  firstRubric: Record<string, InterviewAnswerRubric>,
  firstCoachedAnswers: Record<string, string>,
  coachedAnswers: Record<string, string>,
): InterviewSessionSummary {
  const answeredQuestions = questions.filter(
    ({ question }) => Boolean(answers[question]?.trim()),
  );
  const reviewedQuestions = questions.filter(
    ({ question }) =>
      Boolean(feedback[question]) &&
      answers[question]?.trim() === coachedAnswers[question],
  );
  const categoryScores = Object.fromEntries(
    rubricDimensions.map(({ key }) => {
      const ratings = reviewedQuestions
        .map(({ question }) => feedback[question]?.rubric[key].score)
        .filter((score): score is number => typeof score === "number");
      return [
        key,
        ratings.length
          ? ratings.reduce((sum, score) => sum + score, 0) / ratings.length
          : null,
      ];
    }),
  ) as InterviewSessionSummary["dimensions"];
  const reviewedAverages = reviewedQuestions
    .map(({ question }) => feedback[question]?.rubric)
    .filter((rubric): rubric is InterviewAnswerRubric => Boolean(rubric))
    .map(getRubricAverage);
  const averageScore = reviewedAverages.length
    ? reviewedAverages.reduce((sum, score) => sum + score, 0) /
      reviewedAverages.length
    : null;
  const improvedQuestions = questions.filter(({ question }) => {
    const currentRubric = feedback[question]?.rubric;
    const initialRubric = firstRubric[question];
    if (
      !currentRubric ||
      !initialRubric ||
      firstCoachedAnswers[question] === answers[question]?.trim() ||
      answers[question]?.trim() !== coachedAnswers[question]
    ) {
      return false;
    }
    return getRubricAverage(currentRubric) > getRubricAverage(initialRubric);
  }).length;

  return {
    averageScore,
    points:
      answeredQuestions.length * 5 +
      Object.keys(firstRubric).length * 5 +
      improvedQuestions * 10,
    answered: answeredQuestions.length,
    reviewed: Object.keys(firstRubric).length,
    improved: improvedQuestions,
    dimensions: categoryScores,
    strengths: [
      ...new Set(
        reviewedQuestions.flatMap(
          ({ question }) => feedback[question]?.strengths ?? [],
        ),
      ),
    ].slice(0, 4),
    focusPoints: [
      ...new Set(
        reviewedQuestions.flatMap(
          ({ question }) => feedback[question]?.improvements ?? [],
        ),
      ),
    ].slice(0, 4),
  };
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike extends ArrayLike<SpeechRecognitionAlternativeLike> {
  isFinal: boolean;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

interface MockInterviewRoomProps {
  position: string;
  company: string;
  questions: MockInterviewQuestion[];
  answers: Record<string, string>;
  feedback: Record<string, MockInterviewFeedback>;
  firstRubric: Record<string, InterviewAnswerRubric>;
  firstCoachedAnswers: Record<string, string>;
  coachedAnswers: Record<string, string>;
  feedbackFor: string | null;
  onAnswerChange: (question: string, answer: string) => void;
  onCoach: (question: string, answer: string) => void;
  onSessionFinished: (summary: InterviewSessionSummary) => void;
  onSessionReset: () => void;
}

export function MockInterviewRoom({
  position,
  company,
  questions,
  answers,
  feedback,
  firstRubric,
  firstCoachedAnswers,
  coachedAnswers,
  feedbackFor,
  onAnswerChange,
  onCoach,
  onSessionFinished,
  onSessionReset,
}: MockInterviewRoomProps) {
  const [active, setActive] = useState(false);
  const [finished, setFinished] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [starting, setStarting] = useState(false);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [video, setVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mountedRef = useRef(false);
  const speechBaseRef = useRef("");
  const finalTranscriptRef = useRef("");

  const currentQuestion = questions[questionIndex];
  const currentAnswer = currentQuestion
    ? answers[currentQuestion.question] ?? ""
    : "";
  const currentFeedback = currentQuestion
    ? coachedAnswers[currentQuestion.question] === currentAnswer
      ? feedback[currentQuestion.question]
      : undefined
    : undefined;
  const sessionSummary = getSessionSummary(
    questions,
    answers,
    feedback,
    firstRubric,
    firstCoachedAnswers,
    coachedAnswers,
  );

  function stopRecognition() {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    recognition?.stop();
    setListening(false);
    setInterimTranscript("");
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setVideo(false);
  }

  function endPractice() {
    stopRecognition();
    stopCamera();
    window.speechSynthesis?.cancel();
    setActive(false);
    setFinished(true);
    onSessionFinished(sessionSummary);
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      recognition?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!active || !currentQuestion || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }, [active, currentQuestion]);

  useEffect(() => {
    if (video && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [video]);

  async function startPractice() {
    if (starting) return;
    setStarting(true);
    setError(null);
    try {
      if (!questions.length) {
        setError("Generate interview questions before starting practice.");
        return;
      }
      if (cameraEnabled) {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("Camera preview is not available in this browser. Turn it off to continue with voice practice.");
          return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false,
          });
          if (!mountedRef.current) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          streamRef.current = stream;
          setVideo(true);
        } catch (cameraError: unknown) {
          if (!mountedRef.current) return;
          setError(
            cameraError instanceof Error
              ? `Camera access failed: ${cameraError.message}. Turn off camera preview to continue with voice practice.`
              : "Camera access failed. Turn off camera preview to continue with voice practice.",
          );
          return;
        }
      }
      setQuestionIndex(0);
      setFinished(false);
      setActive(true);
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  }

  function startAnswerRecording() {
    setError(null);
    const speechWindow = window as WindowWithSpeechRecognition;
    const Recognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Speech recognition is not supported in this browser. Type your answer below instead.");
      return;
    }
    if (!currentQuestion) return;

    window.speechSynthesis?.cancel();
    stopRecognition();
    speechBaseRef.current = currentAnswer;
    finalTranscriptRef.current = "";
    setInterimTranscript("");
    try {
      const recognition = new Recognition();
      recognition.lang = navigator.language || "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        if (recognitionRef.current !== recognition) return;
        const finalParts: string[] = [];
        const interimParts: string[] = [];
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          if (!result) continue;
          const transcript = result[0]?.transcript.trim();
          if (!transcript) continue;
          if (result.isFinal) finalParts.push(transcript);
          else interimParts.push(transcript);
        }
        if (finalParts.length) {
          finalTranscriptRef.current = [
            finalTranscriptRef.current,
            ...finalParts,
          ]
            .filter(Boolean)
            .join(" ");
          onAnswerChange(
            currentQuestion.question,
            [speechBaseRef.current, finalTranscriptRef.current]
              .filter(Boolean)
              .join(" "),
          );
        }
        setInterimTranscript(interimParts.join(" "));
      };
      recognition.onerror = (event) => {
        if (recognitionRef.current !== recognition) return;
        const recognitionError = event as Event & { error?: string };
        const messages: Record<string, string> = {
          "not-allowed": "Microphone access was denied. Allow microphone access or type your answer instead.",
          "no-speech": "No speech was detected. Try again or type your answer.",
          "audio-capture": "No microphone was found. Connect a microphone or type your answer.",
          network: "Speech recognition is unavailable due to a network issue. Type your answer instead.",
        };
        setError(
          messages[recognitionError.error ?? ""] ??
            "Speech recognition stopped unexpectedly. You can try again or type your answer.",
        );
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
          setListening(false);
        }
      };
      recognition.onend = () => {
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
          setListening(false);
          setInterimTranscript("");
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    } catch (recognitionError: unknown) {
      recognitionRef.current = null;
      setListening(false);
      setError(
        recognitionError instanceof Error
          ? `Unable to start speech recognition: ${recognitionError.message}`
          : "Unable to start speech recognition. Type your answer instead.",
      );
    }
  }

  function moveToQuestion(nextIndex: number) {
    stopRecognition();
    setError(null);
    setQuestionIndex(nextIndex);
  }

  if (!questions.length) return null;

  return (
    <section className="space-y-4 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.04] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Video &amp; voice mock interview
          </h3>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">
            Practice aloud with questions for {position} at {company}. Your
            camera is an optional live preview; video is never recorded or
            uploaded. Speech recognition is provided by your browser.
          </p>
        </div>
        {active ? (
          <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-200">
            Practice in progress
          </span>
        ) : null}
      </div>

      {!active && finished ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-4 sm:flex-row sm:items-center">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200">
              <Trophy className="size-7" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
                Practice round complete
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {sessionSummary.reviewed
                  ? `${sessionSummary.points} practice points earned`
                  : "You showed up and practiced"}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-slate-400">
                {sessionSummary.answered} answer
                {sessionSummary.answered === 1 ? "" : "s"} ·{" "}
                {sessionSummary.reviewed} coached ·{" "}
                {sessionSummary.improved} improved on a retry
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Answer score
              </p>
              {sessionSummary.averageScore === null ? (
                <p className="mt-1 text-sm font-semibold text-slate-300">
                  Not scored yet
                </p>
              ) : (
                <>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {Math.round(sessionSummary.averageScore * 20)}
                    <span className="text-sm text-slate-400">/100</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {sessionSummary.averageScore.toFixed(1)}/5 across reviewed
                    answers
                  </p>
                </>
              )}
            </div>
          </div>

          {sessionSummary.averageScore === null ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-slate-300">
              Your answers are still here. Request AI coaching on an answer to
              receive a scorecard with specific strengths, weak points, and a
              next practice focus.
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-cyan-300" aria-hidden="true" />
                  <h4 className="text-xs font-semibold text-white">
                    Your answer scorecard
                  </h4>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                  Average of answers you reviewed with coaching. Scores reflect
                  answer content only—not video, voice, accent, or interview
                  readiness.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {rubricDimensions.map(({ key, label, description }) => {
                    const score = sessionSummary.dimensions[key];
                    return (
                      <div
                        key={key}
                        className="rounded-lg border border-white/[0.08] bg-[#090a0f] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-slate-200">
                            {label}
                          </span>
                          <span className="text-xs font-semibold text-cyan-200">
                            {score === null ? "—" : `${score.toFixed(1)}/5`}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                          {description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {rubricDimensions.some(
                ({ key }) => (sessionSummary.dimensions[key] ?? 0) >= 4,
              ) ? (
                <div className="flex flex-wrap gap-2">
                  {rubricDimensions
                    .filter(
                      ({ key }) => (sessionSummary.dimensions[key] ?? 0) >= 4,
                    )
                    .map(({ key, label }) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/[0.06] px-2.5 py-1 text-[10px] font-medium text-emerald-200"
                      >
                        <Award className="size-3" aria-hidden="true" />
                        {label} strength
                      </span>
                    ))}
                </div>
              ) : null}

              {(() => {
                const nextFocus = rubricDimensions
                  .filter(({ key }) => sessionSummary.dimensions[key] !== null)
                  .sort(
                    (left, right) =>
                      (sessionSummary.dimensions[left.key] ?? 0) -
                      (sessionSummary.dimensions[right.key] ?? 0),
                  )[0];
                if (!nextFocus) return null;
                return (
                  <div className="rounded-lg border border-violet-400/15 bg-violet-500/[0.04] p-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb
                        className="size-4 text-violet-300"
                        aria-hidden="true"
                      />
                      <h4 className="text-xs font-semibold text-violet-100">
                        Your next practice focus: {nextFocus.label}
                      </h4>
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-slate-300">
                      {nextFocus.description} Try another answer and focus on
                      one concrete detail that demonstrates this skill.
                    </p>
                  </div>
                );
              })()}
            </>
          )}

          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-amber-200" aria-hidden="true" />
              <h4 className="text-xs font-semibold text-white">
                How practice points work
              </h4>
            </div>
            <p className="mt-1 text-[10px] leading-5 text-slate-400">
              +5 for answering a question, +5 for reviewing it with coaching,
              and +10 once per question when a retry improves your rubric
              average. Points reward practice and growth—not candidate worth.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[10px] leading-4 text-slate-500">
              <Sparkles className="size-3.5 shrink-0 text-cyan-300" aria-hidden="true" />
              Save interview prep below to keep these notes in this job&apos;s
              history.
            </p>
            <Button
              type="button"
              onClick={() => {
                setFinished(false);
                onSessionReset();
              }}
              className="bg-cyan-700 text-white hover:bg-cyan-600"
            >
              Practice again
            </Button>
          </div>
        </div>
      ) : !active ? (
        <div className="space-y-3">
          <label className="flex items-start gap-2 text-[11px] leading-4 text-slate-300">
            <input
              type="checkbox"
              checked={cameraEnabled}
              onChange={(event) => setCameraEnabled(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-slate-500 bg-slate-900"
            />
            Turn on a private camera preview (optional; not recorded or shared)
          </label>
          <Button
            type="button"
            onClick={() => void startPractice()}
            disabled={starting}
            className="gap-2 bg-cyan-700 text-white hover:bg-cyan-600"
          >
            {starting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="size-4" aria-hidden="true" />
            )}
            {starting
              ? "Starting practice..."
              : cameraEnabled
                ? "Start video + voice practice"
                : "Start voice practice"}
          </Button>
          <p className="text-[10px] leading-4 text-slate-500">
            Voice transcription uses your browser&apos;s speech-recognition
            service, which may process audio according to that provider&apos;s
            settings. JobHunter does not record or upload audio or video.
            Transcripts stay in this form unless you request AI feedback or
            save your interview notes.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)]">
          <div className="space-y-3">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#090a0f]">
              {video ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  aria-label="Private live camera preview"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <CameraOff className="size-8" aria-hidden="true" />
                  <span className="text-xs">Camera preview off</span>
                </div>
              )}
              {video ? (
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] text-white">
                  <Camera className="size-3" aria-hidden="true" />
                  Preview only
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={listening ? stopRecognition : startAnswerRecording}
                className="gap-2 border-cyan-400/25 text-cyan-100 hover:bg-cyan-500/10"
              >
                {listening ? (
                  <MicOff className="size-4" aria-hidden="true" />
                ) : (
                  <Mic className="size-4" aria-hidden="true" />
                )}
                {listening ? "Stop speaking" : "Answer with voice"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (currentQuestion && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    window.speechSynthesis.speak(
                      new SpeechSynthesisUtterance(currentQuestion.question),
                    );
                  }
                }}
                className="gap-2 border-white/10 text-slate-200 hover:bg-white/5"
              >
                <Volume2 className="size-4" aria-hidden="true" />
                Repeat question
              </Button>
              {video ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={stopCamera}
                  className="gap-2 border-white/10 text-slate-300 hover:bg-white/5"
                >
                  <CameraOff className="size-4" aria-hidden="true" />
                  Turn camera off
                </Button>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
                Question {questionIndex + 1} of {questions.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">
                  {currentQuestion?.category.replace("-", " ")}
                </span>
              </div>
            </div>
            <p className="text-sm font-medium leading-6 text-white">
              {currentQuestion?.question}
            </p>
            <p className="text-[10px] leading-4 text-slate-500">
              Focus: {currentQuestion?.focus}
            </p>
            <Textarea
              value={currentAnswer}
              onChange={(event) =>
                currentQuestion &&
                onAnswerChange(currentQuestion.question, event.target.value)
              }
              maxLength={1200}
              rows={5}
              aria-label="Your interview answer"
              placeholder="Your spoken answer appears here. You can edit it or type instead."
              className="resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
            />
            {interimTranscript ? (
              <p aria-live="polite" className="text-xs italic text-cyan-200">
                Listening: {interimTranscript}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!currentAnswer.trim() || feedbackFor !== null}
                onClick={() =>
                  currentQuestion && onCoach(currentQuestion.question, currentAnswer)
                }
                className="gap-2 border-violet-400/20 text-violet-200 hover:bg-violet-500/10"
              >
                {feedbackFor === currentQuestion?.question ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-violet-200 border-t-transparent" />
                ) : null}
                Get coaching
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={questionIndex === 0}
                  onClick={() => moveToQuestion(questionIndex - 1)}
                  className="border-white/10 text-slate-200"
                >
                  Previous
                </Button>
                {questionIndex < questions.length - 1 ? (
                  <Button
                    type="button"
                    onClick={() => moveToQuestion(questionIndex + 1)}
                    className="bg-blue-600 text-white hover:bg-blue-500"
                  >
                    Next question
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={endPractice}
                    className="gap-2 bg-emerald-700 text-white hover:bg-emerald-600"
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Finish practice
                  </Button>
                )}
              </div>
            </div>
            {currentFeedback ? (
              <div className="space-y-2 rounded-lg border border-emerald-400/15 bg-emerald-500/[0.04] p-3 text-[11px] leading-5">
                <p className="font-semibold text-emerald-200">Coaching notes</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {rubricDimensions.map(({ key, label }) => (
                    <div
                      key={key}
                      className="rounded-md border border-white/[0.08] bg-black/10 p-2"
                    >
                      <p className="font-medium text-cyan-100">
                        {label}: {currentFeedback.rubric[key].score}/5
                      </p>
                      <p className="mt-0.5 text-slate-400">
                        {currentFeedback.rubric[key].evidence}
                      </p>
                    </div>
                  ))}
                </div>
                <ul className="list-disc space-y-1 pl-4 text-slate-300">
                  {currentFeedback.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                  {currentFeedback.improvements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="text-slate-300">
                  Suggested structure: {currentFeedback.answerStructure}
                </p>
                <p className="text-slate-400">
                  Follow-up: {currentFeedback.followUpQuestion}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {error ? (
        <p role="alert" className="text-xs leading-5 text-rose-300">
          {error}
        </p>
      ) : null}
      <p className="text-[10px] leading-4 text-slate-500">
        Coaching is practice guidance, not a hiring prediction. You can use
        typed answers if voice recognition is unavailable.
      </p>
    </section>
  );
}

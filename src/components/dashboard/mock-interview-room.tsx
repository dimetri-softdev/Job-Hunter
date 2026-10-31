"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  Play,
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
  feedbackFor: string | null;
  onAnswerChange: (question: string, answer: string) => void;
  onCoach: (question: string, answer: string) => void;
}

export function MockInterviewRoom({
  position,
  company,
  questions,
  answers,
  feedback,
  feedbackFor,
  onAnswerChange,
  onCoach,
}: MockInterviewRoomProps) {
  const [active, setActive] = useState(false);
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
    ? feedback[currentQuestion.question]
    : undefined;

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

      {!active ? (
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

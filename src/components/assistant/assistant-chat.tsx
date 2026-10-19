"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  BriefcaseBusiness,
  CircleHelp,
  Loader2,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetcher } from "@/lib/api";
import {
  setAssistantConsent,
  useAssistantConsent,
} from "@/lib/assistant-consent";

type AssistantMode = "product" | "career";
type ChatMessage = { role: "user" | "assistant"; content: string };

interface CareerProfileContext {
  careerSummary?: string | null;
  skills?: string | null;
  workHistory?: string | null;
  education?: string | null;
  accomplishments?: string | null;
  experienceLevel?: string | null;
  targetRoles?: string | null;
  preferredLocation?: string | null;
  workArrangement?: string | null;
}

interface ApplicationContext {
  id: string;
  company: string;
  position: string;
  status: string;
  notes?: string | null;
  jobSummary?: string | null;
  fitAssessment?: unknown;
  nextAction?: string | null;
  followUpAt?: string | null;
}

interface AssistantChatProps {
  initialPrompt?: string;
  className?: string;
  compact?: boolean;
}

export function AssistantChat({
  initialPrompt = "",
  className = "",
  compact = false,
}: AssistantChatProps) {
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<AssistantMode>("career");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialPrompt);
  const [typedContext, setTypedContext] = useState("");
  const [includeProfile, setIncludeProfile] = useState(false);
  const [includeApplication, setIncludeApplication] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [applications, setApplications] = useState<ApplicationContext[] | null>(
    null,
  );
  const [applicationsError, setApplicationsError] = useState<string | null>(
    null,
  );
  const consent = useAssistantConsent();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeMode: AssistantMode = user ? mode : "product";
  const starterPrompts =
    activeMode === "career"
      ? [
          "How can I make my experience stand out?",
          "Help me plan my next career step",
          "How should I prepare for an interview?",
        ]
      : [
          "What can JobHunter help me do?",
          "How does a job-fit review work?",
          "How do I organize my applications?",
        ];

  useEffect(() => {
    if (!user || !includeApplication || applications !== null) return;
    let active = true;
    fetcher<ApplicationContext[]>("/applications")
      .then((result) => {
        if (active) setApplications(result);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setApplicationsError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load your saved applications.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [applications, includeApplication, user]);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || !consent || sending) return;

    const submittedMessages = [...messages, { role: "user" as const, content: message }];
    const history = messages.slice(-8);
    setMessages(submittedMessages);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const contextParts: string[] = [];
      if (activeMode === "career" && user && includeProfile) {
        const profile = await fetcher<CareerProfileContext>("/career-profile");
        contextParts.push(`Selected career profile:\n${JSON.stringify(profile)}`);
      }
      if (
        activeMode === "career" &&
        user &&
        includeApplication &&
        selectedApplicationId
      ) {
        const savedApplications =
          applications ?? (await fetcher<ApplicationContext[]>("/applications"));
        const application = savedApplications.find(
          (item) => item.id === selectedApplicationId,
        );
        if (application) {
          contextParts.push(
            `Selected application:\n${JSON.stringify({
              company: application.company,
              position: application.position,
              status: application.status,
              notes: application.notes,
              jobSummary: application.jobSummary,
              fitAssessment: application.fitAssessment,
              nextAction: application.nextAction,
              followUpAt: application.followUpAt,
            })}`,
          );
        }
      }
      if (activeMode === "career" && typedContext.trim()) {
        contextParts.push(`Additional context typed for this message:\n${typedContext.trim()}`);
      }

      const payload = user
        ? {
            message,
            history,
            mode: activeMode,
            context: contextParts.length
              ? contextParts.join("\n\n").slice(0, 16000)
              : null,
            aiProcessingConsent: true,
          }
        : { message, history, aiProcessingConsent: true };
      const endpoint = user ? "/assistant/chat" : "/assistant/public";
      const result = await fetcher<{ reply: string }>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessages([...submittedMessages, { role: "assistant", content: result.reply }]);
      setTypedContext("");
      setIncludeProfile(false);
      setIncludeApplication(false);
      setSelectedApplicationId("");
      setApplications(null);
      setApplicationsError(null);
    } catch (sendError: unknown) {
      setMessages(messages);
      setInput(message);
      setError(
        sendError instanceof Error
          ? sendError.message
          : "The assistant could not reply. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  function clearConversation() {
    setMessages([]);
    setInput("");
    setTypedContext("");
    setIncludeProfile(false);
    setIncludeApplication(false);
    setSelectedApplicationId("");
    setApplications(null);
    setApplicationsError(null);
    setError(null);
  }

  return (
    <section
      aria-label="JobHunter AI assistant"
      className={`relative isolate flex min-h-0 flex-col overflow-hidden rounded-2xl border border-sky-200/20 bg-[#080d1a]/95 shadow-2xl shadow-blue-950/50 ring-1 ring-white/[0.06] backdrop-blur-2xl ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 -z-10 size-72 rounded-full bg-blue-500/20 blur-3xl"
      />
      <header className="relative border-b border-white/10 bg-gradient-to-r from-blue-950/80 via-slate-900/80 to-indigo-950/70 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-blue-200/30 bg-gradient-to-br from-blue-400/30 to-indigo-500/20 text-blue-100 shadow-lg shadow-blue-950/40">
            <Bot className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="font-semibold tracking-tight text-white">
                JobHunter assistant
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-300" />
                Here to help
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-300">
              {activeMode === "career"
                ? "Practical career guidance, at your pace"
                : "Friendly help using JobHunter"}
            </p>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearConversation}
              aria-label="Clear conversation and start a new chat"
              title="Start a new chat"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-slate-300 transition hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Choose what you need
          </span>
          <div
            aria-label="Assistant topic"
            className="inline-flex rounded-xl border border-white/10 bg-black/25 p-1"
          >
            <button
              type="button"
              aria-pressed={activeMode === "career"}
              disabled={!user}
              title={!user ? "Sign in for personalized career guidance" : undefined}
              onClick={() => setMode("career")}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-45 ${
                activeMode === "career"
                  ? "bg-blue-500/25 text-blue-100 shadow-sm ring-1 ring-blue-300/25"
                  : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <BriefcaseBusiness className="size-3.5" aria-hidden="true" />
              Career
            </button>
            <button
              type="button"
              aria-pressed={activeMode === "product"}
              onClick={() => setMode("product")}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-300 ${
                activeMode === "product"
                  ? "bg-blue-500/25 text-blue-100 shadow-sm ring-1 ring-blue-300/25"
                  : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <CircleHelp className="size-3.5" aria-hidden="true" />
              Product help
            </button>
          </div>
        </div>
      </header>

      <div
        aria-live="polite"
        className={`flex min-h-28 flex-1 flex-col gap-4 overflow-y-auto bg-gradient-to-b from-slate-950/35 to-blue-950/[0.12] p-4 sm:p-5 ${compact ? "max-h-[38vh]" : "max-h-[60vh]"}`}
      >
        {messages.length === 0 ? (
          <div className="my-auto w-full space-y-4">
            <div className="mx-auto max-w-md rounded-2xl border border-blue-200/15 bg-gradient-to-br from-blue-500/[0.12] via-white/[0.035] to-indigo-500/[0.08] p-4 text-center shadow-lg shadow-blue-950/20 sm:p-5">
              <span className="mx-auto flex size-10 items-center justify-center rounded-xl border border-blue-200/20 bg-blue-400/10 text-blue-200">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-base font-semibold text-white">
                {activeMode === "career"
                  ? "Let’s work through your next career step."
                  : "What would you like help with?"}
              </p>
              <p className="mt-1.5 text-xs leading-5 text-slate-300">
                {activeMode === "career"
                  ? "Ask a question or choose a prompt to get started."
                  : "Ask about job-fit checks, applications, or learning plans."}
              </p>
              {!user && (
                <p className="mt-3 text-xs text-slate-300">
                  <Link
                    href="/login"
                    className="font-semibold text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200"
                  >
                    Sign in
                  </Link>{" "}
                  for personalized career guidance.
                </p>
              )}
            </div>
            <div className="mx-auto w-full max-w-md">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Try asking
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2.5 text-left text-xs leading-5 text-slate-200 transition hover:border-blue-300/30 hover:bg-blue-400/[0.09] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg ${
                item.role === "user"
                  ? "self-end rounded-br-md border border-blue-200/30 bg-gradient-to-br from-blue-500/35 to-indigo-500/25 text-white shadow-blue-950/30"
                  : "self-start rounded-bl-md border border-white/15 bg-slate-800/80 text-slate-100 shadow-black/20"
              }`}
            >
              <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-300/80">
                {item.role === "user" ? "You" : "JobHunter assistant"}
              </span>
              {item.content}
            </div>
          ))
        )}
        {sending && (
          <div className="flex items-center gap-2 self-start rounded-2xl rounded-bl-md border border-white/15 bg-slate-800/80 px-4 py-3 text-xs text-slate-200">
            <Loader2 className="size-4 animate-spin text-blue-300" aria-hidden="true" />
            Putting together a helpful reply…
          </div>
        )}
      </div>

      <form
        onSubmit={sendMessage}
        className="space-y-3 border-t border-white/10 bg-[#0b1120]/95 p-4 sm:p-5"
      >
        {activeMode === "career" && (
          <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/75 p-3 shadow-inner shadow-white/[0.03]">
            {user && (
              <>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeProfile}
                    onChange={(event) => setIncludeProfile(event.target.checked)}
                    className="accent-blue-500"
                  />
                  Include my saved career profile in this message
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeApplication}
                    onChange={(event) => {
                      setIncludeApplication(event.target.checked);
                      setApplicationsError(null);
                      if (!event.target.checked) {
                        setApplications(null);
                        setSelectedApplicationId("");
                      }
                    }}
                    className="accent-blue-500"
                  />
                  Include one saved application
                </label>
                {includeApplication && (
                  <div className="space-y-1">
                    <label
                      htmlFor="assistant-application"
                      className="text-xs text-slate-400"
                    >
                      Choose application
                    </label>
                    <select
                      id="assistant-application"
                      value={selectedApplicationId}
                      onChange={(event) => setSelectedApplicationId(event.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-slate-950/65 px-2 py-2 text-xs text-slate-100 backdrop-blur-xl"
                    >
                      <option value="">Select an application</option>
                      {(applications ?? []).map((application) => (
                        <option key={application.id} value={application.id}>
                          {application.position} at {application.company}
                        </option>
                      ))}
                    </select>
                    {applicationsError && (
                      <p role="alert" className="text-xs text-rose-300">
                        {applicationsError}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
            <label
              htmlFor="assistant-context"
              className="block text-xs text-slate-400"
            >
              Optional context for this message (not saved by JobHunter)
            </label>
            <textarea
              id="assistant-context"
              value={typedContext}
              onChange={(event) => setTypedContext(event.target.value)}
              maxLength={6000}
              rows={compact ? 2 : 3}
              placeholder="You can paste relevant experience or a resume excerpt here."
              className="w-full resize-y rounded-xl border border-white/15 bg-slate-950/80 px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-400 focus-visible:border-blue-300/60 focus-visible:ring-2 focus-visible:ring-blue-400/20"
            />
            {!user && (
              <p className="text-[11px] leading-4 text-slate-500">
                Public chats can use text you provide here, but can’t access saved account data.
              </p>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-white/15 bg-slate-950/85 p-2 shadow-inner shadow-black/30 transition focus-within:border-blue-300/40 focus-within:ring-2 focus-within:ring-blue-400/10">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={2000}
            rows={compact ? 2 : 3}
            placeholder={
              activeMode === "career"
                ? "Ask about your next career move…"
                : "Ask a question about JobHunter…"
            }
            aria-label="Your message"
            className="w-full resize-y border-0 bg-transparent px-2 py-1.5 text-sm leading-6 text-white outline-none placeholder:text-slate-400 focus-visible:ring-0"
          />
          <div className="flex items-center justify-between gap-2 px-2 pb-1 pt-1">
            <span className="text-[10px] text-slate-500">
              {input.length.toLocaleString()} / 2,000
            </span>
            <button
              type="submit"
              disabled={
                !input.trim() ||
                !consent ||
                sending ||
                authLoading ||
                (activeMode === "career" &&
                  user !== null &&
                  includeApplication &&
                  !selectedApplicationId)
              }
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl bg-blue-500 px-4 text-xs font-semibold text-white shadow-md shadow-blue-950/40 transition hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              {sending ? "Sending" : "Send message"}
              {sending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        {!consent ? (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200/20 bg-amber-300/[0.06] p-3 text-[11px] leading-5 text-slate-200">
            <input
              type="checkbox"
              checked={false}
              onChange={(event) => setAssistantConsent(event.target.checked)}
              className="mt-1 size-4 shrink-0 accent-blue-500"
            />
            <span>
              <span className="mb-0.5 block font-semibold text-amber-100">
                One-time agreement
              </span>
              I agree to send my messages and recent chat history to the AI
              provider. This choice is remembered on this device. Saved career
              or application details are sent only when I select them.
              <span className="mt-1 block text-slate-400">
                JobHunter doesn’t save this chat. The AI provider’s privacy
                terms apply.
              </span>
            </span>
          </label>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] px-3 py-2 text-[11px] leading-4 text-emerald-100">
            <p>
              <ShieldCheck className="mr-1 inline size-3.5 align-text-bottom" aria-hidden="true" />
              Agreement saved on this device. Saved details are shared only
              when selected.
            </p>
            <button
              type="button"
              onClick={() => setAssistantConsent(false)}
              className="font-medium text-slate-300 underline underline-offset-2 hover:text-white"
            >
              Revoke agreement
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="text-xs text-rose-300">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {user
              ? "Daily assistant usage limit applies."
              : "Public usage limit applies."}
          </p>
        </div>
      </form>
    </section>
  );
}

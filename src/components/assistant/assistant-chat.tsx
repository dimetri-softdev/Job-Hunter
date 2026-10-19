"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Loader2, RotateCcw, Send, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetcher } from "@/lib/api";

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
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeMode: AssistantMode = user ? mode : "product";

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
    setConsent(false);
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
    setConsent(false);
    setError(null);
  }

  return (
    <section
      aria-label="JobHunter AI assistant"
      className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#252938] bg-[#101119] ${className}`}
    >
      <header className="flex items-center gap-3 border-b border-[#252938] p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-200">
          <Bot className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-white">JobHunter assistant</h2>
          <p className="text-xs text-slate-400">
            Helpful guidance; you stay in control.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearConversation}
            aria-label="Clear conversation"
            title="Clear conversation"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#343746] text-slate-300 transition hover:bg-white/[0.05]"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
          </button>
        )}
        <label className="sr-only" htmlFor="assistant-mode">
          Assistant mode
        </label>
        <select
          id="assistant-mode"
          value={activeMode}
          onChange={(event) => setMode(event.target.value as AssistantMode)}
          className="max-w-36 rounded-lg border border-[#343746] bg-[#090a0f] px-2 py-2 text-xs text-slate-200"
        >
          <option value="career" disabled={!user}>
            {user ? "Career guidance" : "Career guidance (sign-in required)"}
          </option>
          <option value="product">Using JobHunter</option>
        </select>
      </header>

      <div
        aria-live="polite"
        className={`flex min-h-28 flex-1 flex-col gap-3 overflow-y-auto p-4 ${compact ? "max-h-[38vh]" : "max-h-[60vh]"}`}
      >
        {messages.length === 0 ? (
          <div className="my-auto space-y-2 text-center">
            <p className="text-sm font-medium text-slate-200">
              {activeMode === "career"
                ? "What career question can I help you think through?"
                : "Need a hand finding your way around JobHunter?"}
            </p>
            <p className="text-xs leading-5 text-slate-500">
              {activeMode === "career"
                ? "Share only what you’re comfortable sending for this message."
                : "Ask about features, job-fit checks, applications, or learning plans."}
            </p>
            {!user && (
              <p className="text-xs text-slate-500">
                <Link
                  href="/login"
                  className="font-medium text-blue-300 underline underline-offset-2 hover:text-blue-200"
                >
                  Sign in
                </Link>{" "}
                to use personalized career guidance.
              </p>
            )}
          </div>
        ) : (
          messages.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={`max-w-[90%] whitespace-pre-wrap rounded-xl px-3 py-2.5 text-sm leading-6 ${
                item.role === "user"
                  ? "self-end bg-blue-600/20 text-blue-50"
                  : "self-start border border-[#2b2e3b] bg-[#171923] text-slate-200"
              }`}
            >
              {item.content}
            </div>
          ))
        )}
        {sending && (
          <div className="flex items-center gap-2 self-start text-xs text-slate-400">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Thinking…
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="space-y-3 border-t border-[#252938] p-4">
        {activeMode === "career" && (
          <div className="space-y-2 rounded-xl border border-[#252938] bg-[#0c0d13] p-3">
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
                      className="w-full rounded-lg border border-[#343746] bg-[#090a0f] px-2 py-2 text-xs text-slate-200"
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
              className="w-full resize-y rounded-lg border border-[#343746] bg-[#090a0f] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus-visible:border-blue-400"
            />
            {!user && (
              <p className="text-[11px] leading-4 text-slate-500">
                Public chats can use text you provide here, but can’t access saved account data.
              </p>
            )}
          </div>
        )}

        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={2000}
          rows={compact ? 2 : 3}
          placeholder="Write your message…"
          aria-label="Your message"
          className="w-full resize-y rounded-lg border border-[#343746] bg-[#090a0f] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus-visible:border-blue-400"
        />
        <label className="flex items-start gap-2 text-[11px] leading-4 text-slate-400">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5 accent-blue-500"
          />
          <span>
            I agree to send this message, recent chat, and any selected context
            to JobHunter&apos;s AI provider for a reply. JobHunter does not save
            this chat transcript.
          </span>
        </label>
        {error && (
          <p role="alert" className="text-xs text-rose-300">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {user
              ? "10 requests per day; failed attempts count."
              : "10 public requests per hour; failed attempts count."}
          </p>
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
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Sending" : "Send"}
            {sending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

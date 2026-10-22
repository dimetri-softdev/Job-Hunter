"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bot,
  BriefcaseBusiness,
  CircleHelp,
  FileText,
  Loader2,
  Paperclip,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetcher } from "@/lib/api";
import {
  setAssistantContextConsent,
  useAssistantContextConsent,
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
  const savedContextConsent = useAssistantContextConsent(user?.id);
  const [pendingContextPermission, setPendingContextPermission] = useState<
    "profile" | "application" | null
  >(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [confirmDocument, setConfirmDocument] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if (
      !user ||
      !savedContextConsent ||
      !includeApplication ||
      applications !== null
    ) {
      return;
    }
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
  }, [applications, includeApplication, savedContextConsent, user]);

  function requestSavedContextPermission(
    kind: "profile" | "application",
    enabled: boolean,
  ) {
    if (!enabled) {
      if (kind === "profile") setIncludeProfile(false);
      else {
        setIncludeApplication(false);
        setApplications(null);
        setApplicationsError(null);
        setSelectedApplicationId("");
      }
      return;
    }
    if (!savedContextConsent) {
      setPendingContextPermission(kind);
      return;
    }
    if (kind === "profile") setIncludeProfile(true);
    else setIncludeApplication(true);
  }

  function allowSavedContext() {
    if (!user || !pendingContextPermission) return;
    setAssistantContextConsent(user.id, true);
    if (pendingContextPermission === "profile") setIncludeProfile(true);
    else setIncludeApplication(true);
    setPendingContextPermission(null);
  }

  function revokeSavedContextConsent() {
    setAssistantContextConsent(user?.id, false);
    setIncludeProfile(false);
    setIncludeApplication(false);
    setApplications(null);
    setApplicationsError(null);
    setSelectedApplicationId("");
    setPendingContextPermission(null);
  }

  function selectDocument(file: File | undefined) {
    setFileError(null);
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "docx", "txt"].includes(extension)) {
      setAttachedFile(null);
      setFileError("Choose a PDF, DOCX, or TXT document.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAttachedFile(null);
      setFileError("Documents must be 5 MB or smaller.");
      return;
    }
    setAttachedFile(file);
    setConfirmDocument(false);
  }

  async function submitMessage(documentApproved = false) {
    const message =
      input.trim() ||
      (attachedFile
        ? "Please review this document and help me understand the information relevant to my career."
        : "");
    if (!message || sending) return;
    if (attachedFile && !documentApproved) {
      setConfirmDocument(true);
      return;
    }
    if (attachedFile && (!user || activeMode !== "career")) {
      setFileError("Sign in and switch to Career mode to send a document.");
      return;
    }

    const visibleMessage = attachedFile
      ? `${message}\n[Document attached: ${attachedFile.name}]`
      : message;
    const submittedMessages = [
      ...messages,
      { role: "user" as const, content: visibleMessage },
    ];
    const history = messages.slice(-8);
    setMessages(submittedMessages);
    setInput("");
    setError(null);
    setFileError(null);
    setSending(true);

    try {
      const savedContextParts: string[] = [];
      if (activeMode === "career" && user && includeProfile) {
        const profile = await fetcher<CareerProfileContext>("/career-profile");
        savedContextParts.push(`Selected career profile:\n${JSON.stringify(profile)}`);
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
          savedContextParts.push(
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
      const context =
        activeMode === "career" ? typedContext.trim() || null : null;
      const savedContext = savedContextParts.length
        ? savedContextParts.join("\n\n").slice(0, 15000)
        : null;
      let result: { reply: string };
      if (attachedFile && user) {
        const formData = new FormData();
        formData.append("message", message);
        formData.append("history", JSON.stringify(history));
        formData.append("mode", activeMode);
        formData.append("documentProcessingConsent", "true");
        if (context) formData.append("context", context);
        if (savedContext) {
          formData.append("savedContext", savedContext);
          formData.append("savedContextConsent", "true");
        }
        formData.append("file", attachedFile);
        result = await fetcher<{ reply: string }>("/assistant/chat/document", {
          method: "POST",
          body: formData,
        });
      } else if (user) {
        result = await fetcher<{ reply: string }>("/assistant/chat", {
          method: "POST",
          body: JSON.stringify({
            message,
            history,
            mode: activeMode,
            context,
            savedContext,
            savedContextConsent: Boolean(savedContext),
          }),
        });
      } else {
        result = await fetcher<{ reply: string }>("/assistant/public", {
          method: "POST",
          body: JSON.stringify({ message, history }),
        });
      }
      setMessages([...submittedMessages, { role: "assistant", content: result.reply }]);
      setTypedContext("");
      setAttachedFile(null);
      setConfirmDocument(false);
      setIncludeProfile(false);
      setIncludeApplication(false);
      setSelectedApplicationId("");
      setApplications(null);
      setApplicationsError(null);
    } catch (sendError: unknown) {
      setMessages(messages);
      setInput(input);
      setError(
        sendError instanceof Error
          ? sendError.message
          : "The assistant could not reply. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage();
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
    setAttachedFile(null);
    setFileError(null);
    setConfirmDocument(false);
    setPendingContextPermission(null);
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
      <header className="relative shrink-0 border-b border-white/10 bg-gradient-to-r from-blue-950/80 via-slate-900/80 to-indigo-950/70 px-4 py-3 sm:px-5 sm:py-4">
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
              disabled={Boolean(attachedFile)}
              title={
                attachedFile
                  ? "Remove the attached document before switching to product help"
                  : undefined
              }
              onClick={() => setMode("product")}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-300 ${
                activeMode === "product"
                  ? "bg-blue-500/25 text-blue-100 shadow-sm ring-1 ring-blue-300/25"
                  : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
              } disabled:cursor-not-allowed disabled:opacity-45`}
            >
              <CircleHelp className="size-3.5" aria-hidden="true" />
              Product help
            </button>
          </div>
        </div>
      </header>

      <div
        aria-live="polite"
        className={`flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-gradient-to-b from-slate-950/35 to-blue-950/[0.12] p-4 sm:p-5 ${compact ? "max-h-[38vh]" : "max-h-[60vh]"}`}
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
        className={`shrink-0 space-y-3 border-t border-white/10 bg-[#0b1120]/95 p-3 sm:p-5 ${
          compact ? "max-h-[55%] overflow-y-auto" : ""
        }`}
      >
        {activeMode === "career" && (
          <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/75 p-3 shadow-inner shadow-white/[0.03]">
            {user && (
              <>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeProfile}
                    onChange={(event) =>
                      requestSavedContextPermission("profile", event.target.checked)
                    }
                    className="accent-blue-500"
                  />
                  Include my saved career profile in this message
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeApplication}
                    onChange={(event) =>
                      requestSavedContextPermission(
                        "application",
                        event.target.checked,
                      )
                    }
                    className="accent-blue-500"
                  />
                  Include one saved application
                </label>
                {pendingContextPermission && (
                  <div className="rounded-lg border border-amber-200/20 bg-amber-300/[0.06] p-3 text-xs leading-5 text-slate-200">
                    <p className="font-semibold text-amber-100">
                      Allow saved information for the assistant?
                    </p>
                    <p className="mt-1">
                      {pendingContextPermission === "profile"
                        ? "Your saved career profile"
                        : "The application you select"}{" "}
                      will be read only when you choose it and sent with your
                      message to our AI provider. We’ll remember this choice on
                      this device until you turn it off.
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={allowSavedContext}
                        className="rounded-lg bg-blue-500 px-3 py-1.5 font-semibold text-white hover:bg-blue-400"
                      >
                        Allow and continue
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingContextPermission(null)}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:bg-white/[0.06]"
                      >
                        Not now
                      </button>
                    </div>
                  </div>
                )}
                {savedContextConsent && (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] leading-4 text-emerald-200">
                    <span>Saved-data sharing is enabled on this device.</span>
                    <button
                      type="button"
                      onClick={revokeSavedContextConsent}
                      className="underline underline-offset-2 hover:text-white"
                    >
                      Turn off
                    </button>
                  </div>
                )}
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
          {user && (
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              aria-label="Attach a PDF, DOCX, or TXT file"
              onChange={(event) => {
                selectDocument(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          )}
          {attachedFile && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-blue-200/15 bg-blue-400/[0.07] px-3 py-2 text-xs text-slate-200">
              <FileText
                className="size-4 shrink-0 text-blue-200"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate">{attachedFile.name}</span>
              <span className="shrink-0 text-slate-400">
                {(attachedFile.size / (1024 * 1024)).toFixed(1)} MB
              </span>
              <button
                type="button"
                aria-label="Remove attached document"
                onClick={() => {
                  setAttachedFile(null);
                  setConfirmDocument(false);
                  setFileError(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
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
            <div className="flex items-center gap-2">
              {user && activeMode === "career" && (
                <button
                  type="button"
                  aria-label="Attach a document"
                  title="Attach a PDF, DOCX, or TXT document (max 5 MB)"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:border-blue-300/30 hover:bg-blue-400/[0.08] hover:text-white"
                >
                  <Paperclip className="size-4" aria-hidden="true" />
                </button>
              )}
              <span className="text-[10px] text-slate-500">
                {input.length.toLocaleString()} / 2,000
              </span>
            </div>
            <button
              type="submit"
              disabled={
                (!input.trim() && !attachedFile) ||
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
        {attachedFile && (
          <p className="text-[11px] leading-4 text-slate-400">
            PDF, DOCX, or TXT · 5 MB max · not stored by JobHunter. Scanned
            image-only PDFs are not supported.
          </p>
        )}
        {confirmDocument && attachedFile && (
          <div
            role="group"
            aria-label="Confirm document sharing"
            className="rounded-xl border border-amber-200/20 bg-amber-300/[0.06] p-3 text-xs leading-5 text-slate-200"
          >
            <p className="font-semibold text-amber-100">
              Send “{attachedFile.name}” to the AI provider for analysis?
            </p>
            <p className="mt-1">
              JobHunter extracts the document text, sends it with your message,
              and does not save the uploaded file. The AI provider’s data
              practices also apply.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => void submitMessage(true)}
                className="rounded-lg bg-blue-500 px-3 py-1.5 font-semibold text-white hover:bg-blue-400"
              >
                Yes, send this document
              </button>
              <button
                type="button"
                onClick={() => setConfirmDocument(false)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:bg-white/[0.06]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <p className="text-[11px] leading-4 text-slate-400">
          Your message and recent chat history are processed by our AI provider.
          Don’t include passwords, verification codes, or financial account
          details.{" "}
          <Link
            href="/privacy"
            className="text-blue-300 underline decoration-blue-300/40 underline-offset-2 hover:text-blue-200"
          >
            Privacy details
          </Link>
        </p>
        {fileError && (
          <p role="alert" className="text-xs text-rose-300">
            {fileError}
          </p>
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

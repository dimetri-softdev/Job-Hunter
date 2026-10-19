"use client";

import { Bot } from "lucide-react";

export const ASSISTANT_OPEN_EVENT = "jobhunter:assistant:open";

export function AssistantLauncher({
  prompt = "",
  label = "Ask the AI assistant",
  className = "",
}: {
  prompt?: string;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent(ASSISTANT_OPEN_EVENT, { detail: { prompt } }),
        )
      }
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 px-4 text-sm font-medium text-blue-100 transition hover:bg-blue-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 ${className}`}
    >
      <Bot className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}

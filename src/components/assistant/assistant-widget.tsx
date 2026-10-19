"use client";

import { useEffect, useState } from "react";
import { Bot } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AssistantChat } from "@/components/assistant/assistant-chat";
import { ASSISTANT_OPEN_EVENT } from "@/components/assistant/assistant-launcher";

export function AssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const hidden =
    pathname === "/assistant" ||
    ["/login", "/signup", "/forgot-password", "/reset-password", "/admin"].some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );

  useEffect(() => {
    function handleOpen(event: Event) {
      const detail = (event as CustomEvent<{ prompt?: string }>).detail;
      setPrompt(detail?.prompt ?? "");
      setOpen(true);
    }

    window.addEventListener(ASSISTANT_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(ASSISTANT_OPEN_EVENT, handleOpen);
  }, []);

  if (hidden) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setPrompt("");
      }}
    >
      <DialogTrigger
        aria-label="Open JobHunter AI assistant"
        className="fixed bottom-5 right-5 z-40 inline-flex size-14 items-center justify-center rounded-full border border-blue-300/30 bg-blue-600 text-white shadow-xl shadow-black/40 transition hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
      >
        <Bot className="size-6" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-3 overflow-hidden border-[#252938] bg-[#090a0f] p-3 text-slate-100 sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>JobHunter AI assistant</DialogTitle>
          <DialogDescription>
            Ask for product help or career guidance. Each message is sent to
            JobHunter&apos;s AI provider only after you consent.
          </DialogDescription>
        </DialogHeader>
        <AssistantChat
          key={`${open}-${prompt}`}
          initialPrompt={prompt}
          compact
          className="h-[82vh] max-h-[50rem] min-h-0 border-0"
        />
      </DialogContent>
    </Dialog>
  );
}

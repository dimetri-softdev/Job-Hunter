"use client";

import { useState } from "react";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import { supabase } from "@/lib/supabase";
import { getAuthErrorMessage } from "@/lib/user-facing-errors";

interface OAuthButtonsProps {
  mode: "login" | "signup";
  disabled?: boolean;
  onError: (message: string | null) => void;
}

const providers = [
  { id: "github", label: "GitHub", Icon: SiGithub },
  { id: "google", label: "Google", Icon: SiGoogle },
] as const;

export function OAuthButtons({
  mode,
  disabled = false,
  onError,
}: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<
    (typeof providers)[number]["id"] | null
  >(null);

  async function handleOAuthSignIn(provider: (typeof providers)[number]["id"]) {
    if (disabled || loadingProvider) return;

    onError(null);
    setLoadingProvider(provider);

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", "/dashboard");
    if (mode === "signup") {
      callbackUrl.searchParams.set("intent", "signup");
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl.toString() },
      });

      if (error) {
        onError(
          getAuthErrorMessage(
            error,
            `We couldn’t start ${provider === "github" ? "GitHub" : "Google"} sign-in. Please try again.`,
          ),
        );
        setLoadingProvider(null);
      }
    } catch (error: unknown) {
      onError(
        getAuthErrorMessage(
          error,
          `We couldn’t start ${provider === "github" ? "GitHub" : "Google"} sign-in. Please try again.`,
        ),
      );
      setLoadingProvider(null);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {providers.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          disabled={disabled || loadingProvider !== null}
          onClick={() => handleOAuthSignIn(id)}
          aria-label={`${label} ${mode === "login" ? "sign-in" : "sign-up"}`}
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#2b2e3b] bg-[#12131a] px-4 text-sm font-medium text-slate-200 transition hover:border-blue-500/60 hover:bg-[#171923] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon className="size-4" aria-hidden="true" />
          {loadingProvider === id ? "Connecting..." : label}
        </button>
      ))}
    </div>
  );
}

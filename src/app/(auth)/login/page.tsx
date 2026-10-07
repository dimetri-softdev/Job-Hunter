"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AuthSidebar } from "@/components/auth/auth-sidebar";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = use(searchParams);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    error === "oauth_callback_failed"
      ? "Sign-in could not be completed. Please try again."
      : null,
  );
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data?.session) {
        // Force full reload/navigation so server-side proxy & cookies sync immediately
        window.location.href = "/dashboard";
      } else {
        setErrorMsg(
          "Check your email for a confirmation link or auto-confirm your user in Supabase.",
        );
        setLoading(false);
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "github" | "google") => {
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) setErrorMsg(error.message);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to initialize OAuth.",
      );
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#090a0f] text-slate-200 md:flex-row">
      <AuthSidebar mode="login" />

      <main className="flex flex-1 items-center justify-center px-6 py-9 sm:px-10 md:px-8 lg:px-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Sign in to continue to your dashboard.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
              {errorMsg}
            </div>
          )}

          {/* Social OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuthSignIn("github")}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#2b2e3b] bg-[#12131a] px-4 text-sm font-medium text-slate-200 transition-colors hover:border-blue-500/40 hover:bg-blue-600/10"
            >
              <SiGithub className="size-4" /> GitHub
            </button>
            <button
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#2b2e3b] bg-[#12131a] px-4 text-sm font-medium text-slate-200 transition-colors hover:border-blue-500/40 hover:bg-blue-600/10"
            >
              <SiGoogle className="size-4" /> Google
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[#1f212d]" />
            <span className="absolute bg-[#090a0f] px-3 font-mono text-xs text-slate-500">
              or continue with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#12131a] border border-[#1f212d] focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-slate-400">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-blue-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-[#12131a] border border-[#1f212d] focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-500/20 transition mt-2 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            No account yet?{" "}
            <Link
              href="/signup"
              className="text-blue-400 hover:underline font-medium"
            >
              Create one free
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

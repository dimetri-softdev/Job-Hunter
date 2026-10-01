"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AuthSidebar } from "@/components/auth/auth-sidebar";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else if (data.session) {
      router.push("/dashboard");
    } else {
      setSuccessMsg("Account created! Check your email for confirmation.");
    }
  };

  const handleOAuthSignIn = async (provider: "github" | "google") => {
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) setErrorMsg(error.message);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#090a0f] text-slate-200 md:flex-row">
      <AuthSidebar mode="signup" />

      <main className="flex flex-1 items-center justify-center px-6 py-9 sm:px-10 md:px-8 lg:px-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Create your account
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Free forever. No credit card required.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
              {successMsg}
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
              or register with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-[#12131a] border border-[#1f212d] focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition"
              />
            </div>

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
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
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
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-500/20 transition mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Creating account..." : "Create free account"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 pt-2">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-400 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

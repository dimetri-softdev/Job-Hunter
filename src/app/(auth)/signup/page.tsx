"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AuthSidebar } from "@/components/auth/auth-sidebar";
import { validatePassword } from "@/lib/password-validation";
import { getAuthErrorMessage } from "@/lib/user-facing-errors";

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

    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim();
    if (!normalizedName) {
      setErrorMsg("Enter your name.");
      return;
    }
    if (normalizedName.length > 100) {
      setErrorMsg("Your name must be 100 characters or fewer.");
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMsg(passwordError);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: normalizedName,
          },
        },
      });

      if (error) {
        setErrorMsg(
          getAuthErrorMessage(
            error,
            "We couldn’t create your account. Check your details and try again.",
          ),
        );
      } else if (data.session) {
        router.push("/dashboard");
      } else {
        setSuccessMsg("Account created! Check your email for confirmation.");
      }
    } catch (signUpError: unknown) {
      setErrorMsg(
        getAuthErrorMessage(
          signUpError,
          "We couldn’t create your account. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
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
            <div role="alert" className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
              {successMsg}
            </div>
          )}

          <p role="status" className="text-center text-xs text-slate-500">
            GitHub and Google sign-up are under construction and unavailable
            for now. Please register with email and password.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled
              aria-label="GitHub sign-up coming soon"
              className="flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-[#2b2e3b] bg-[#12131a] px-4 text-sm font-medium text-slate-500 opacity-70"
            >
              <SiGithub className="size-4" aria-hidden="true" />
              GitHub
            </button>
            <button
              type="button"
              disabled
              aria-label="Google sign-up coming soon"
              className="flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-[#2b2e3b] bg-[#12131a] px-4 text-sm font-medium text-slate-500 opacity-70"
            >
              <SiGoogle className="size-4" aria-hidden="true" />
              Google
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
              <label htmlFor="signup-name" className="block text-xs font-medium text-slate-400 mb-1.5">
                Full name
              </label>
              <input
                id="signup-name"
                type="text"
                required
                maxLength={100}
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-[#12131a] border border-[#1f212d] focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-medium text-slate-400 mb-1.5">
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#12131a] border border-[#1f212d] focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={7}
                  maxLength={128}
                  autoComplete="new-password"
                  aria-describedby="signup-password-requirements"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 7 characters"
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
              <p id="signup-password-requirements" className="mt-1.5 text-[11px] leading-5 text-slate-500">
                Use 7–128 characters, including at least one number and one
                symbol (for example, ! or #).
              </p>
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

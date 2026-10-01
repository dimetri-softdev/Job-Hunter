"use client";

import { useEffect, useState } from "react";
import { User, Loader2 } from "lucide-react";
import { fetcher } from "@/lib/api";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const userProfile = await fetcher<UserProfile>("/user");
        setProfile(userProfile);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load account details.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  return (
    <div className="w-full space-y-6 max-w-4xl">
      <div className="pb-4 border-b border-[#1f212d]">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Account Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review the profile associated with your account.
        </p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading account details...</span>
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-rose-400">
          {error}
        </p>
      ) : profile ? (
        <section className="max-w-2xl rounded-xl border border-[#1f212d] bg-[#12131a] p-6">
          <div className="mb-5 flex items-center gap-2 border-b border-[#1f212d] pb-4 text-sm font-semibold text-white">
            <User className="h-4 w-4 text-blue-400" />
            Account Profile
          </div>
          <dl className="grid gap-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-400">Name</dt>
              <dd className="mt-1 text-slate-100">
                {profile.name || "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Email</dt>
              <dd className="mt-1 break-all text-slate-100">{profile.email}</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  );
}

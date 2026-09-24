"use client";

import React, { useState } from "react";
import { User, Key, Bell, Shield, Save } from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="w-full space-y-6 max-w-4xl">
      <div className="pb-4 border-b border-[#1f212d]">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Account Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your developer profile, API credentials, and integration keys.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-[#12131a] border border-[#1f212d] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-sm pb-3 border-b border-[#1f212d]">
            <User className="h-4 w-4 text-blue-400" />
            Developer Profile
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-mono">Full Name</label>
              <input
                type="text"
                defaultValue="Alex Developer"
                className="w-full bg-[#090a0f] border border-[#1f212d] rounded-xl px-3.5 py-2.5 text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 font-mono">Email Address</label>
              <input
                type="email"
                defaultValue="alex@dev.io"
                className="w-full bg-[#090a0f] border border-[#1f212d] rounded-xl px-3.5 py-2.5 text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* API Credentials */}
        <div className="bg-[#12131a] border border-[#1f212d] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-sm pb-3 border-b border-[#1f212d]">
            <Key className="h-4 w-4 text-amber-400" />
            Backend & AI Integration
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-mono">
                FastAPI Backend Endpoint
              </label>
              <input
                type="text"
                defaultValue="http://127.0.0.1:8000/api/v1"
                className="w-full bg-[#090a0f] border border-[#1f212d] rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-mono">
                OpenAI API Key (Optional)
              </label>
              <input
                type="password"
                defaultValue="sk-proj-xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-[#090a0f] border border-[#1f212d] rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all"
          >
            <Save className="h-4 w-4" />
            {saved ? "Saved Changes!" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

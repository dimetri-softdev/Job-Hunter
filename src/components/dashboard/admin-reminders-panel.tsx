"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import {
  getApiErrorMessage,
  getUserFacingError,
} from "@/lib/user-facing-errors";

interface ReminderFeatureSettings {
  enabled: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function parseSettings(payload: unknown): ReminderFeatureSettings {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("enabled" in payload) ||
    typeof payload.enabled !== "boolean"
  ) {
    throw new Error("The server returned unexpected reminder settings.");
  }
  return payload as ReminderFeatureSettings;
}

export function AdminRemindersPanel() {
  const [settings, setSettings] = useState<ReminderFeatureSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSettings() {
      try {
        const response = await fetch("/api/admin/reminders", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await readJson(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(payload, response.status));
        }
        setSettings(parseSettings(payload));
      } catch (loadError: unknown) {
        if (controller.signal.aborted) return;
        setError(
          getUserFacingError(loadError, "Unable to load reminder settings."),
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadSettings();
    return () => controller.abort();
  }, []);

  async function toggleReminders() {
    if (!settings) return;
    const enabled = !settings.enabled;
    if (
      enabled &&
      !window.confirm(
        "Enable email reminders for users who opt in? Confirm that Resend sender verification, API credentials, and the protected cron job are configured first.",
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, response.status));
      }
      setSettings(parseSettings(payload));
    } catch (saveError: unknown) {
      setError(
        getUserFacingError(saveError, "Unable to update reminder settings."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-5">
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200"
        >
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Bell className="size-4 text-amber-300" aria-hidden="true" />
            Email reminder feature switch
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            This global switch controls Resend delivery. It is off by default.
            Turn it on only after the verified sender, private API environment
            variables, and scheduled cron job are ready. Users must still opt
            in individually in Settings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void toggleReminders()}
          disabled={loading || saving || !settings}
          aria-pressed={settings?.enabled ?? false}
          className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            settings?.enabled
              ? "border border-amber-300/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"
              : "bg-violet-500 text-white hover:bg-violet-400"
          }`}
        >
          {loading || saving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {loading
            ? "Loading"
            : settings?.enabled
              ? "Disable email reminders"
              : "Enable email reminders"}
        </button>
      </div>
      <p
        className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
          settings?.enabled
            ? "bg-amber-400/10 text-amber-200"
            : "bg-slate-700/50 text-slate-300"
        }`}
      >
        {settings?.enabled
          ? "Email reminders are globally enabled"
          : "Email reminders are globally disabled"}
      </p>
    </section>
  );
}

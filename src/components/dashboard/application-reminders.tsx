"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { fetcher } from "@/lib/api";

interface ReminderApplication {
  id: string;
  company: string;
  position: string;
  status: string;
  followUpAt?: string | null;
}

interface ReminderPreferences {
  emailEnabled: boolean;
}

const ACTIVE_STATUSES = new Set([
  "SAVED",
  "APPLIED",
  "PHONE_SCREEN",
  "INTERVIEWING",
]);

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ApplicationReminderWatcher() {
  useEffect(() => {
    if (!("Notification" in window)) return;

    let active = true;
    async function checkDueReminders() {
      if (!active || Notification.permission !== "granted") return;

      try {
        const applications = await fetcher<ReminderApplication[]>("/applications");
        if (!active) return;

        const today = getLocalDateKey();
        for (const application of applications) {
          const followUpDate = application.followUpAt?.slice(0, 10);
          if (
            !followUpDate ||
            followUpDate > today ||
            !ACTIVE_STATUSES.has(application.status)
          ) {
            continue;
          }

          const notificationKey = `jobhunter-reminder:${application.id}:${followUpDate}`;
          try {
            if (window.localStorage.getItem(notificationKey)) continue;
            const notification = new Notification(
              `Follow up: ${application.position} at ${application.company}`,
              {
                body:
                  followUpDate < today
                    ? "This application follow-up is overdue."
                    : "Your application follow-up is due today.",
                tag: notificationKey,
              },
            );
            window.localStorage.setItem(notificationKey, "shown");
            notification.onclick = () => {
              window.focus();
              window.location.assign("/applications");
              notification.close();
            };
          } catch (notificationError) {
            console.error("Could not show an application reminder notification.", notificationError);
          }
        }
      } catch (loadError) {
        if (active) {
          console.error("Could not load applications for browser reminders.", loadError);
        }
      }
    }

    void checkDueReminders();
    const intervalId = window.setInterval(() => void checkDueReminders(), 30 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}

export function ApplicationReminderSettings() {
  const [preferences, setPreferences] = useState<ReminderPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");

  useEffect(() => {
    const permissionTimer = window.setTimeout(() => {
      setPermission(
        "Notification" in window ? Notification.permission : "unsupported",
      );
    }, 0);

    fetcher<ReminderPreferences>("/reminders/preferences")
      .then(setPreferences)
      .catch((loadError: unknown) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load reminder preferences.",
        );
      })
      .finally(() => setLoading(false));

    return () => window.clearTimeout(permissionTimer);
  }, []);

  async function updateEmailPreference(emailEnabled: boolean) {
    setSaving(true);
    setError(null);
    try {
      const updated = await fetcher<ReminderPreferences>("/reminders/preferences", {
        method: "PUT",
        body: JSON.stringify({ emailEnabled }),
      });
      setPreferences(updated);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save reminder preferences.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function enableBrowserNotifications() {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }

    try {
      setPermission(await Notification.requestPermission());
    } catch (permissionError) {
      setError(
        permissionError instanceof Error
          ? permissionError.message
          : "Unable to request browser notification permission.",
      );
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#252836] bg-[#12131a]">
      <div className="border-b border-[#1f212d] px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-200">
            <Bell className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">Follow-up reminders</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
              Get a nudge when an application follow-up date arrives. You can
              change either reminder option at any time.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-slate-200">Email reminders</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Receive one email for each due application at your account email.
              Email reminders can arrive when you are away from JobHunter.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences?.emailEnabled ?? false}
            disabled={loading || saving || !preferences}
            onClick={() =>
              void updateEmailPreference(!preferences?.emailEnabled)
            }
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
              preferences?.emailEnabled
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-[#303342] bg-[#0d0e14] text-slate-300"
            }`}
          >
            {saving ? "Saving…" : preferences?.emailEnabled ? "Enabled" : "Enable email"}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#1f212d] pt-5">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-slate-200">Browser notifications</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              These alerts work only while JobHunter is open in this browser.
              Your browser may require permission and a secure connection.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void enableBrowserNotifications()}
            disabled={permission === "unsupported" || permission === "granted"}
            className="inline-flex items-center gap-2 rounded-lg border border-[#303342] bg-[#0d0e14] px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-blue-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <BellRing className="size-3.5" />
            {permission === "granted"
              ? "Enabled"
              : permission === "denied"
                ? "Blocked in browser settings"
                : permission === "unsupported"
                  ? "Not supported"
                  : "Enable browser alerts"}
          </button>
        </div>

        {loading && (
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="size-3.5 animate-spin" />
            Loading reminder settings…
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-rose-300">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

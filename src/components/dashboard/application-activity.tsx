"use client";

import { useState } from "react";
import { Activity, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/api";

interface ApplicationActivityItem {
  id: string;
  kind: string;
  detail: string;
  createdAt: string;
}

const activityLabels: Record<string, string> = {
  APPLICATION_SAVED: "Application added",
  STATUS_CHANGED: "Status update",
  NOTE: "Note",
  FOLLOW_UP: "Follow-up",
  INTERVIEW: "Interview",
  EMAIL: "Email or message",
  OFFER: "Offer update",
  APPLICATION_DRAFT: "Saved application drafts",
  OTHER: "Update",
};

export function ApplicationActivity({
  applicationId,
}: {
  applicationId: string;
}) {
  const [activities, setActivities] = useState<ApplicationActivityItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadActivities() {
    if (loaded || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher<ApplicationActivityItem[]>(
        `/applications/${encodeURIComponent(applicationId)}/activities`,
      );
      setActivities(result);
      setLoaded(true);
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load this application’s history.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const detail = String(formData.get("detail") ?? "").trim();
    if (!detail) {
      setError("Add a short note before saving this update.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const activity = await fetcher<ApplicationActivityItem>(
        `/applications/${encodeURIComponent(applicationId)}/activities`,
        {
          method: "POST",
          body: JSON.stringify({
            kind: formData.get("kind"),
            detail,
          }),
        },
      );
      setActivities((current) => [activity, ...current]);
      form.reset();
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save this update.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <details
      className="mt-2"
      onToggle={(event) => {
        if (event.currentTarget.open) void loadActivities();
      }}
    >
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-violet-500/25 px-2.5 py-1.5 text-[10px] font-medium text-violet-300 transition hover:bg-violet-500/10">
        <Activity className="size-3.5" aria-hidden="true" />
        History &amp; updates
      </summary>
      <div className="mt-3 w-[min(30rem,calc(100vw-3rem))] space-y-4 rounded-xl border border-[#282b39] bg-[#0d0e14] p-4">
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-[9rem_1fr]">
            <select
              name="kind"
              aria-label="Update type"
              className="h-9 rounded-lg border border-[#2b2e3b] bg-[#090a0f] px-2 text-xs text-white outline-none focus-visible:border-blue-400"
            >
              <option value="NOTE">Note</option>
              <option value="FOLLOW_UP">Follow-up</option>
              <option value="INTERVIEW">Interview</option>
              <option value="EMAIL">Email or message</option>
              <option value="OFFER">Offer update</option>
              <option value="OTHER">Other update</option>
            </select>
            <Textarea
              name="detail"
              maxLength={2000}
              rows={2}
              required
              aria-label="Write an application update"
              placeholder="What happened? Add useful details for your future self."
              className="min-h-9 resize-y border-[#2b2e3b] bg-[#090a0f] text-xs text-white placeholder:text-slate-500"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="h-8 bg-violet-600 text-[11px] text-white hover:bg-violet-500"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-3.5" aria-hidden="true" />
              )}
              Add to history
            </Button>
          </div>
        </form>

        {error && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p role="alert" className="text-xs text-rose-300">
              {error}
            </p>
            {!loaded && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void loadActivities()}
                className="h-7 text-[10px] text-blue-300 hover:bg-blue-500/10 hover:text-blue-200"
              >
                Retry
              </Button>
            )}
          </div>
        )}
        {loading ? (
          <p className="inline-flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Loading history...
          </p>
        ) : loaded && activities.length === 0 ? (
          <p className="text-xs text-slate-500">
            No updates yet. Add an interview, follow-up, or note to build this
            application&apos;s history.
          </p>
        ) : (
          <ol className="space-y-3 border-l border-[#2b2e3b] pl-3">
            {activities.map((activity) => (
              <li key={activity.id} className="relative space-y-1">
                <span className="absolute -left-[1.05rem] top-1 size-2 rounded-full border border-violet-300 bg-[#0d0e14]" />
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="text-[11px] font-medium text-slate-200">
                    {activityLabels[activity.kind] ?? "Update"}
                  </span>
                  <time
                    dateTime={activity.createdAt}
                    className="text-[10px] text-slate-500"
                  >
                    {new Date(activity.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="whitespace-pre-wrap break-words text-[11px] leading-4 text-slate-400">
                  {activity.detail}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}

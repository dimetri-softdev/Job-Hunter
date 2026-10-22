"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Mail, Save } from "lucide-react";
import {
  getApiErrorMessage,
  getUserFacingError,
} from "@/lib/user-facing-errors";
import { DEFAULT_SUPPORT_EMAIL } from "@/lib/support-contact";

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function AdminSupportPanel() {
  const [supportEmail, setSupportEmail] = useState(DEFAULT_SUPPORT_EMAIL);
  const [savedEmail, setSavedEmail] = useState(DEFAULT_SUPPORT_EMAIL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadSettings() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/support-contact", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await readJson(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(payload, response.status));
        }
        if (
          !payload ||
          typeof payload !== "object" ||
          !("supportEmail" in payload) ||
          typeof payload.supportEmail !== "string"
        ) {
          throw new Error("Support settings could not be read.");
        }
        setSupportEmail(payload.supportEmail);
        setSavedEmail(payload.supportEmail);
      } catch (loadError: unknown) {
        if (controller.signal.aborted) return;
        setError(
          getUserFacingError(loadError, "Unable to load support settings."),
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadSettings();
    return () => controller.abort();
  }, []);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/support-contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supportEmail: supportEmail.trim() }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, response.status));
      }
      if (
        !payload ||
        typeof payload !== "object" ||
        !("supportEmail" in payload) ||
        typeof payload.supportEmail !== "string"
      ) {
        throw new Error("The updated support email could not be confirmed.");
      }
      setSupportEmail(payload.supportEmail);
      setSavedEmail(payload.supportEmail);
      setSuccess("Support email updated. The public site will use it shortly.");
    } catch (saveError: unknown) {
      setError(
        getUserFacingError(saveError, "Unable to update the support email."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200"
        >
          {success}
        </p>
      )}

      <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-200">
            <Mail className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">
              Public support email
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              This address appears in the public site footer and the privacy
              contact section.
            </p>
          </div>
        </div>

        <form onSubmit={saveSettings} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="support-email"
              className="text-xs font-medium text-slate-300"
            >
              Support email address
            </label>
            <input
              id="support-email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={supportEmail}
              onChange={(event) => {
                setSupportEmail(event.target.value);
                setSuccess(null);
              }}
              placeholder="support@example.com"
              className="min-h-11 w-full rounded-lg border border-[#2b2e3b] bg-[#0b0c12] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Currently published:{" "}
              <span className="text-slate-300">{savedEmail}</span>
            </p>
            <button
              type="submit"
              disabled={
                loading ||
                saving ||
                supportEmail.trim().toLowerCase() === savedEmail.toLowerCase()
              }
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving || loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {loading ? "Loading…" : saving ? "Saving…" : "Save support email"}
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}

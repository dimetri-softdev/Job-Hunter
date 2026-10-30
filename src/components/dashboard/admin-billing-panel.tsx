"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  getApiErrorMessage,
  getUserFacingError,
} from "@/lib/user-facing-errors";

interface BillingConfiguration {
  enabled: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
}

interface BillingSettingsResponse {
  configuration: BillingConfiguration;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function AdminBillingPanel() {
  const [settings, setSettings] = useState<BillingSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadSettings() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/billing", {
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
          !("configuration" in payload) ||
          !payload.configuration ||
          typeof payload.configuration !== "object" ||
          !("enabled" in payload.configuration) ||
          typeof payload.configuration.enabled !== "boolean"
        ) {
          throw new Error("The server returned unexpected billing settings.");
        }
        setSettings(payload as BillingSettingsResponse);
      } catch (loadError: unknown) {
        if (controller.signal.aborted) return;
        setError(
          getUserFacingError(loadError, "Unable to load billing settings."),
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadSettings();
    return () => controller.abort();
  }, []);

  async function toggleBilling() {
    if (!settings) return;
    const enabled = !settings.configuration.enabled;
    if (
      enabled &&
      !window.confirm(
        "Enable paid-access enforcement? Basic accounts keep Basic access, while expired paid accounts become read-only. This switch does not enable checkout or change PayFast mode. Keep it off until sandbox payments are verified.",
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, response.status));
      }
      if (
        !payload ||
        typeof payload !== "object" ||
        !("configuration" in payload) ||
        !payload.configuration ||
        typeof payload.configuration !== "object" ||
        !("enabled" in payload.configuration) ||
        typeof payload.configuration.enabled !== "boolean"
      ) {
        throw new Error("The server returned unexpected billing settings.");
      }
      setSettings(payload as BillingSettingsResponse);
    } catch (saveError: unknown) {
      setError(
        getUserFacingError(saveError, "Unable to update billing settings."),
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

      <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck className="size-4 text-violet-300" aria-hidden="true" />
              Paid-access launch switch
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              When enabled, accounts without a paid subscription receive Basic
              access and its limits. Expired paid access becomes read-only.
              Public product guidance remains available, and existing
              information stays available to view and export.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void toggleBilling()}
            disabled={loading || saving || !settings}
            aria-pressed={settings?.configuration.enabled ?? false}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              settings?.configuration.enabled
                ? "border border-amber-300/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"
                : "bg-violet-500 text-white hover:bg-violet-400"
            }`}
          >
            {loading || saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {loading
              ? "Loading"
              : settings?.configuration.enabled
                ? "Disable paid access"
                : "Enable paid access"}
          </button>
        </div>
        <p
          className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            settings?.configuration.enabled
              ? "bg-amber-400/10 text-amber-200"
              : "bg-emerald-400/10 text-emerald-200"
          }`}
        >
          {settings?.configuration.enabled
            ? "Paid access enforcement is on"
            : "Pilot mode · access remains free"}
        </p>
      </section>

      <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-5">
        <h2 className="text-sm font-semibold text-white">PayFast sandbox setup</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Sandbox subscriptions are available from the user-facing Plans &amp;
          usage page when the FastAPI service has all PayFast sandbox settings.
          This switch controls entitlement enforcement only. It does not enable
          checkout or permit live payments. Grant testers a 14-day Standard
          trial from the Users &amp; admins tab.
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg border border-[#252735] p-3">
            <dt className="text-xs text-slate-500">Payment provider</dt>
            <dd className="mt-1 text-slate-200">PayFast sandbox only</dd>
          </div>
          <div className="rounded-lg border border-[#252735] p-3">
            <dt className="text-xs text-slate-500">Currency and prices</dt>
            <dd className="mt-1 text-slate-200">ZAR · R29–R179.99 monthly</dd>
          </div>
          <div className="rounded-lg border border-[#252735] p-3">
            <dt className="text-xs text-slate-500">Annual discount</dt>
            <dd className="mt-1 text-slate-200">20%</dd>
          </div>
        </dl>
      </section>
    </section>
  );
}

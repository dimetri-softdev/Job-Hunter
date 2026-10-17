"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

interface BillingConfiguration {
  enabled: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
}

interface BillingSettingsResponse {
  configuration: BillingConfiguration;
  checkoutEnabled: false;
  currency: string | null;
  pricesConfigured: boolean;
}

function responseError(payload: unknown, status: number) {
  return payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
    ? payload.error
    : `Request failed (${status}).`;
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
        if (!response.ok) throw new Error(responseError(payload, response.status));
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
          loadError instanceof Error
            ? loadError.message
            : "Unable to load billing settings.",
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
        "Enable paid-access enforcement? Accounts without an active plan or admin-granted trial will become read-only, and AI tools will require an entitled plan. Checkout is still disabled.",
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
      if (!response.ok) throw new Error(responseError(payload, response.status));
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
        saveError instanceof Error
          ? saveError.message
          : "Unable to update billing settings.",
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
              When enabled, users need an active plan or an administrator-granted
              trial to make changes or use AI features. Existing information stays
              available to view and export.
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
        <h2 className="text-sm font-semibold text-white">Checkout and pricing</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Checkout is intentionally unavailable. No payment provider, prices, or
          merchant settlement details have been configured, so enabling paid
          access will not charge anyone. Grant testers a 14-day Standard trial
          from the Users &amp; admins tab.
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg border border-[#252735] p-3">
            <dt className="text-xs text-slate-500">Payment provider</dt>
            <dd className="mt-1 text-slate-200">Not selected</dd>
          </div>
          <div className="rounded-lg border border-[#252735] p-3">
            <dt className="text-xs text-slate-500">Currency and prices</dt>
            <dd className="mt-1 text-slate-200">Not configured</dd>
          </div>
          <div className="rounded-lg border border-[#252735] p-3">
            <dt className="text-xs text-slate-500">Annual discount</dt>
            <dd className="mt-1 text-slate-200">20% planned</dd>
          </div>
        </dl>
      </section>
    </section>
  );
}

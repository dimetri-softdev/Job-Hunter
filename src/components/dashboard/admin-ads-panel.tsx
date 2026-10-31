"use client";

import { useEffect, useState } from "react";
import { Loader2, Megaphone } from "lucide-react";
import {
  getApiErrorMessage,
  getUserFacingError,
} from "@/lib/user-facing-errors";

interface AdsFeatureSettings {
  enabled: boolean;
  configured: boolean;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isAdsFeatureSettings(payload: unknown): payload is AdsFeatureSettings {
  return (
    payload !== null &&
    typeof payload === "object" &&
    "enabled" in payload &&
    typeof payload.enabled === "boolean" &&
    "configured" in payload &&
    typeof payload.configured === "boolean"
  );
}

export function AdminAdsPanel() {
  const [settings, setSettings] = useState<AdsFeatureSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSettings() {
      try {
        const response = await fetch("/api/admin/ads", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await readJson(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(payload, response.status));
        }
        if (!isAdsFeatureSettings(payload)) {
          throw new Error("The server returned unexpected advertising settings.");
        }
        setSettings(payload);
      } catch (loadError: unknown) {
        if (controller.signal.aborted) return;
        setError(
          getUserFacingError(loadError, "Unable to load advertising settings."),
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadSettings();
    return () => controller.abort();
  }, []);

  async function toggleAds() {
    if (!settings) return;
    const enabled = !settings.enabled;

    if (
      enabled &&
      !window.confirm(
        "Enable AdSense ads on public and signed-in pages? Confirm that your AdSense site is approved, the publisher and ad slot IDs are configured, and the privacy notice and required consent experience are ready.",
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, response.status));
      }
      if (!isAdsFeatureSettings(payload)) {
        throw new Error("The updated advertising setting could not be confirmed.");
      }
      setSettings(payload);
    } catch (saveError: unknown) {
      setError(
        getUserFacingError(saveError, "Unable to update advertising settings."),
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
            <Megaphone className="size-4 text-violet-300" aria-hidden="true" />
            Advertising feature switch
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            This global switch controls Google AdSense placements on the public
            home page and signed-in workspace. It is off by default. Ads load
            only when this switch is on and the provider IDs are configured.
          </p>
          {!settings?.configured && (
            <p className="mt-3 text-sm leading-6 text-amber-200">
              AdSense is not configured. Set a valid publisher ID and both ad
              slot IDs in the public environment variables, then rebuild and
              redeploy before enabling ads.
            </p>
          )}
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Before enabling, verify AdSense site approval and set up the privacy
            notice and consent experience required for your audience.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void toggleAds()}
          disabled={
            loading ||
            saving ||
            !settings ||
            (!settings.configured && !settings.enabled)
          }
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
            : saving
              ? "Saving"
              : settings?.enabled
                ? "Disable ads"
                : "Enable ads"}
        </button>
      </div>
      <p
        className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
          settings?.enabled
            ? "bg-amber-400/10 text-amber-200"
            : "bg-slate-700/50 text-slate-300"
        }`}
      >
        {settings?.enabled ? "Ads are globally enabled" : "Ads are disabled"}
      </p>
    </section>
  );
}

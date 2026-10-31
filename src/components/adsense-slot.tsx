"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ADSENSE_CLIENT_ID,
  ADSENSE_DASHBOARD_SLOT_ID,
  ADSENSE_PUBLIC_SLOT_ID,
  isAdsenseConfigured,
} from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

interface AdsenseSlotProps {
  placement: "public" | "dashboard";
}

export function AdsenseSlot({ placement }: AdsenseSlotProps) {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const isAdminPage =
    pathname === "/admin" || pathname.startsWith("/admin/");
  const slotId =
    placement === "public"
      ? ADSENSE_PUBLIC_SLOT_ID
      : ADSENSE_DASHBOARD_SLOT_ID;

  useEffect(() => {
    if (isAdminPage) return;

    const controller = new AbortController();

    async function loadAdSettings() {
      try {
        const response = await fetch("/api/ads/config", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload: unknown = await response.json();
        if (!response.ok) {
          throw new Error(
            payload &&
              typeof payload === "object" &&
              "error" in payload &&
              typeof payload.error === "string"
              ? payload.error
              : `Unable to load advertising settings (${response.status}).`,
          );
        }
        if (
          !payload ||
          typeof payload !== "object" ||
          !("enabled" in payload) ||
          typeof payload.enabled !== "boolean"
        ) {
          throw new Error("The server returned invalid advertising settings.");
        }
        setEnabled(payload.enabled);
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        console.error("Unable to load advertising settings", error);
      }
    }

    void loadAdSettings();
    return () => controller.abort();
  }, [isAdminPage]);

  if (isAdminPage || !enabled || !isAdsenseConfigured()) return null;

  function requestAd() {
    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
    } catch (error: unknown) {
      console.error("Unable to request an AdSense ad", error);
    }
  }

  return (
    <aside
      aria-label="Advertisement"
      className="mx-auto my-6 w-full max-w-[970px] px-4 sm:px-6"
    >
      <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
        Advertisement
      </p>
      <Script
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
        strategy="lazyOnload"
        crossOrigin="anonymous"
        onReady={requestAd}
        onError={(error) => {
          console.error("Unable to load the AdSense script", error);
        }}
      />
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: "90px" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}

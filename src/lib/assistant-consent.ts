"use client";

import { useSyncExternalStore } from "react";

const CONSENT_STORAGE_KEY = "jobhunter-assistant-consent";
const CONSENT_CHANGE_EVENT = "jobhunter:assistant-consent-change";

function getConsentSnapshot() {
  return (
    typeof window !== "undefined" &&
    window.localStorage.getItem(CONSENT_STORAGE_KEY) === "granted"
  );
}

function subscribeToConsent(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onChange);
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
  };
}

export function useAssistantConsent() {
  return useSyncExternalStore(subscribeToConsent, getConsentSnapshot, () => false);
}

export function setAssistantConsent(granted: boolean) {
  if (typeof window === "undefined") return;
  if (granted) {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
  } else {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  }
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

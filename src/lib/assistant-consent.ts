import { useSyncExternalStore } from "react";

const CONSENT_CHANGE_EVENT = "jobhunter:assistant-context-consent-change";

function storageKey(userId: string | undefined) {
  return userId ? `jobhunter-assistant-context-consent:${userId}` : null;
}

function getConsentSnapshot(userId: string | undefined) {
  const key = storageKey(userId);
  return (
    typeof window !== "undefined" &&
    key !== null &&
    window.localStorage.getItem(key) === "granted"
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

export function useAssistantContextConsent(userId: string | undefined) {
  return useSyncExternalStore(
    subscribeToConsent,
    () => getConsentSnapshot(userId),
    () => false,
  );
}

export function setAssistantContextConsent(
  userId: string | undefined,
  granted: boolean,
) {
  const key = storageKey(userId);
  if (typeof window === "undefined" || !key) return;
  if (granted) {
    window.localStorage.setItem(key, "granted");
  } else {
    window.localStorage.removeItem(key);
  }
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

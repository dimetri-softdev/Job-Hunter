import { mapApplicationFields } from "./autofill-field-mapper.js";

const API_BASE_URL = "https://jobhunter-api-6c47.onrender.com/api/v1";
const SESSION_KEY = "jobhunterSupabaseSession";
const CONFIG_KEY = "jobhunterPublicClientConfig";
const AUTOFILL_CONSENT_KEY = "jobhunterAutofillAiConsentV1";

async function getConfig() {
  const stored = await chrome.storage.local.get(CONFIG_KEY);
  const cached = stored[CONFIG_KEY];
  if (cached?.supabaseUrl && cached?.supabaseAnonKey && cached.cachedAt > Date.now() - 3600000) {
    return cached;
  }

  const response = await fetch(`${API_BASE_URL}/extension/config`);
  if (!response.ok) {
    throw new Error("JobHunter's backend config is unavailable. Deploy the backend update and try again.");
  }
  const config = await response.json();
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error("JobHunter returned incomplete sign-in configuration.");
  }
  const savedConfig = { ...config, cachedAt: Date.now() };
  await chrome.storage.local.set({ [CONFIG_KEY]: savedConfig });
  return savedConfig;
}

async function storeSession(session) {
  const storedSession = {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at
      ? session.expires_at * 1000
      : Date.now() + (session.expires_in || 3600) * 1000,
    email: session.user?.email || "",
  };
  await chrome.storage.local.set({ [SESSION_KEY]: storedSession });
  return storedSession;
}

async function signIn(email, password) {
  const config = await getConfig();
  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.msg || result.message || "Check your email and password and try again.");
  }
  return storeSession(result);
}

async function getSession() {
  const stored = await chrome.storage.local.get(SESSION_KEY);
  const session = stored[SESSION_KEY];
  if (!session?.accessToken || !session.refreshToken) return null;
  if (session.expiresAt > Date.now() + 60000) return session;

  const config = await getConfig();
  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    await chrome.storage.local.remove(SESSION_KEY);
    throw new Error("Your JobHunter session expired. Sign in again to continue.");
  }
  return storeSession(result);
}

async function signOut() {
  const session = await getSession().catch(() => null);
  await chrome.storage.local.remove(SESSION_KEY);
  if (!session) return;

  const config = await getConfig();
  await fetch(`${config.supabaseUrl}/auth/v1/logout`, {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${session.accessToken}`,
    },
  }).catch(() => undefined);
}

async function getAutofillConsent() {
  const stored = await chrome.storage.local.get(AUTOFILL_CONSENT_KEY);
  return typeof stored[AUTOFILL_CONSENT_KEY] === "boolean"
    ? stored[AUTOFILL_CONSENT_KEY]
    : null;
}

async function setAutofillConsent(accepted) {
  if (typeof accepted !== "boolean") {
    throw new Error("Choose Yes or No to save your autofill consent.");
  }
  await chrome.storage.local.set({ [AUTOFILL_CONSENT_KEY]: accepted });
  return accepted;
}

async function apiRequest(path, options = {}) {
  const session = await getSession();
  if (!session) throw new Error("Sign in to JobHunter to continue.");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof result?.detail === "string" ? result.detail : "JobHunter could not complete that request.";
    throw new Error(message);
  }
  return result;
}

async function mapPageFields(fields) {
  if (await getAutofillConsent() !== true) {
    throw new Error("Allow autofill assistance in the extension before scanning or matching fields.");
  }
  if (!Array.isArray(fields) || fields.length > 250) {
    throw new Error("This page has too many form fields to review at once.");
  }
  const profile = await apiRequest("/application-profile");
  return mapApplicationFields(fields, profile);
}

async function createApplication(application) {
  const company = String(application?.company || "").trim();
  const position = String(application?.position || "").trim();
  if (!company || !position) {
    throw new Error("Enter both the company and position before logging this application.");
  }

  let jobUrl = null;
  try {
    const parsed = new URL(application.jobUrl);
    if (["http:", "https:"].includes(parsed.protocol)) jobUrl = parsed.href;
  } catch {
    jobUrl = null;
  }

  return apiRequest("/applications", {
    method: "POST",
    body: JSON.stringify({
      company: company.slice(0, 160),
      position: position.slice(0, 160),
      status: "SAVED",
      source: application.source || "Other",
      jobUrl,
    }),
  });
}

async function openReview(message) {
  const tabId = Number(message?.tabId);
  const fields = message?.fields;
  if (!Number.isInteger(tabId) || !Array.isArray(fields) || fields.length > 250) {
    throw new Error("Unable to prepare this page for review.");
  }

  const pageUrl = new URL(String(message.pageUrl || ""));
  if (!["http:", "https:"].includes(pageUrl.protocol)) {
    throw new Error("Only http and https application pages can be reviewed.");
  }

  const profileMatches = await mapPageFields(fields);
  const fieldsById = new Map(fields.map((field) => [field.fieldId, field]));
  let aiSuggestions = [];
  let aiError = null;
  if (fields.length > 0) {
    try {
      const aiResult = await apiRequest("/extension/autofill-suggestions", {
        method: "POST",
        body: JSON.stringify({
          aiProcessingConsent: true,
          pageTitle: String(message.pageTitle || "").slice(0, 300),
          siteHost: pageUrl.hostname.slice(0, 253),
          fields: fields.map((field) => ({
            fieldId: String(field.fieldId || "").slice(0, 16),
            label: typeof field.label === "string" ? field.label.slice(0, 300) : null,
            name: typeof field.name === "string" ? field.name.slice(0, 160) : null,
            id: typeof field.id === "string" ? field.id.slice(0, 160) : null,
            placeholder:
              typeof field.placeholder === "string" ? field.placeholder.slice(0, 200) : null,
            autocomplete:
              typeof field.autocomplete === "string" ? field.autocomplete.slice(0, 100) : null,
            type: typeof field.type === "string" ? field.type.slice(0, 40) : null,
            options: Array.isArray(field.options)
              ? field.options.filter((option) => typeof option === "string").slice(0, 25)
              : [],
          })),
        }),
      });
      aiSuggestions = Array.isArray(aiResult?.suggestions) ? aiResult.suggestions : [];
    } catch (error) {
      aiError = error instanceof Error ? error.message : "AI suggestions are unavailable.";
    }
  }

  const aiByFieldId = new Map(
    aiSuggestions
      .filter(
        (suggestion) =>
          typeof suggestion?.fieldId === "string" &&
          typeof suggestion?.suggestedValue === "string" &&
          typeof suggestion?.confidence === "number",
      )
      .map((suggestion) => [suggestion.fieldId, suggestion]),
  );
  const matches = profileMatches.map((match) => {
    const aiSuggestion = aiByFieldId.get(match.fieldId);
    if (
      !aiSuggestion ||
      match.reason === "matched" ||
      match.reason === "sensitive-review" ||
      match.reason === "sensitive-consent-required" ||
      match.reason === "profile-consent-required"
    ) {
      return match;
    }

    return {
      ...match,
      fieldLabel: fieldsById.get(match.fieldId)?.label || match.fieldLabel || null,
      profileKey: "AI suggestion",
      suggestedValue: aiSuggestion.suggestedValue,
      confidence: aiSuggestion.confidence,
      requiresReview: true,
      reason: "ai-suggestion",
      source: "ai",
    };
  });
  const autoFills = matches
    .filter((match) => match.reason === "matched" && !match.requiresReview && match.suggestedValue !== null)
    .map((match) => ({ fieldId: match.fieldId, value: match.suggestedValue }));
  let autoFilledCount = 0;
  if (autoFills.length > 0) {
    const page = await chrome.tabs.get(tabId);
    if (page.url !== pageUrl.href) {
      throw new Error("The application page changed. Scan it again before filling fields.");
    }
    const fillResponse = await chrome.tabs.sendMessage(tabId, {
      type: "FILL_FIELDS",
      fills: autoFills,
    });
    if (!fillResponse?.ok) {
      throw new Error(fillResponse?.error || "The application page is no longer available.");
    }
    autoFilledCount = Number(fillResponse.data?.filled) || 0;
  }
  const reviewId = crypto.randomUUID();
  const storageKey = `jobhunterReview:${reviewId}`;
  await chrome.storage.session.set({
    [storageKey]: {
      tabId,
      pageUrl: pageUrl.href,
      pageTitle: String(message.pageTitle || "Job application").slice(0, 300),
      matches: matches.filter((match) => match.requiresReview),
      autoFilledCount,
      aiError,
    },
  });

  await chrome.tabs.create({
    url: chrome.runtime.getURL(`review.html?reviewId=${encodeURIComponent(reviewId)}`),
  });
  return { reviewId };
}

async function getReviewData(reviewId) {
  if (typeof reviewId !== "string" || !/^[0-9a-f-]{36}$/i.test(reviewId)) {
    throw new Error("This review link is invalid or expired.");
  }
  const storageKey = `jobhunterReview:${reviewId}`;
  const stored = await chrome.storage.session.get(storageKey);
  const review = stored[storageKey];
  if (!review) throw new Error("This review has expired. Scan the application page again.");
  return review;
}

async function fillReviewFields(message) {
  if (await getAutofillConsent() !== true) {
    throw new Error("Autofill assistance is off. Change your consent in the extension to continue.");
  }
  const review = await getReviewData(message.reviewId);
  const selectedIds = new Set(
    Array.isArray(message.fieldIds)
      ? message.fieldIds.filter((fieldId) => typeof fieldId === "string")
      : [],
  );
  const fills = review.matches
    .filter((match) => selectedIds.has(match.fieldId) && match.suggestedValue !== null)
    .map((match) => ({ fieldId: match.fieldId, value: match.suggestedValue }));

  if (fills.length === 0) throw new Error("Select at least one suggested field to fill.");
  const page = await chrome.tabs.get(review.tabId);
  if (page.url !== review.pageUrl) {
    throw new Error("The application page changed. Scan it again before filling fields.");
  }
  const response = await chrome.tabs.sendMessage(review.tabId, {
    type: "FILL_FIELDS",
    fills,
  });
  if (!response?.ok) {
    throw new Error(response?.error || "The application page is no longer available. Scan it again.");
  }
  return response.data;
}

async function handleMessage(message) {
  switch (message?.type) {
    case "GET_CONFIG":
      return getConfig();
    case "GET_SESSION": {
      const session = await getSession();
      return session ? { email: session.email } : null;
    }
    case "GET_AUTOFILL_CONSENT":
      return getAutofillConsent();
    case "SET_AUTOFILL_CONSENT":
      return setAutofillConsent(message.accepted);
    case "SIGN_IN":
      return signIn(String(message.email || "").trim(), String(message.password || ""));
    case "SIGN_OUT":
      return signOut();
    case "MAP_FIELDS":
      return { matches: await mapPageFields(message.fields) };
    case "OPEN_REVIEW":
      return openReview(message);
    case "GET_REVIEW":
      return getReviewData(message.reviewId);
    case "FILL_REVIEW_FIELDS":
      return fillReviewFields(message);
    case "CREATE_APPLICATION":
      return createApplication(message.application);
    default:
      throw new Error("Unsupported extension request.");
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) =>
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "The extension request failed.",
      }),
    );
  return true;
});
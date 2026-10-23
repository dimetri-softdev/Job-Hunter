import { mapApplicationFields } from "./autofill-field-mapper.js";

const API_BASE_URL = "https://jobhunter-api-6c47.onrender.com/api/v1";
const SESSION_KEY = "jobhunterSupabaseSession";
const CONFIG_KEY = "jobhunterPublicClientConfig";

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

async function handleMessage(message) {
  switch (message?.type) {
    case "GET_CONFIG":
      return getConfig();
    case "GET_SESSION": {
      const session = await getSession();
      return session ? { email: session.email } : null;
    }
    case "SIGN_IN":
      return signIn(String(message.email || "").trim(), String(message.password || ""));
    case "SIGN_OUT":
      return signOut();
    case "MAP_FIELDS":
      return { matches: await mapPageFields(message.fields) };
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
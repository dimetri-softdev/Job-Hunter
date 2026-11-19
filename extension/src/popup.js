const statusElement = document.querySelector("#status");
const errorElement = document.querySelector("#error");
const signInForm = document.querySelector("#sign-in-form");
const signedInPanel = document.querySelector("#signed-in-panel");
const signInButton = document.querySelector("#sign-in");
const accountEmail = document.querySelector("#account-email");
const consentPanel = document.querySelector("#consent-panel");
const consentDenied = document.querySelector("#consent-denied");
const changeConsentButton = document.querySelector("#change-consent");
const scanButton = document.querySelector("#scan-page");

let clientConfig = null;
let autofillConsent = null;
let editingConsent = false;

function showError(message) {
  errorElement.textContent = message;
  errorElement.hidden = false;
}

function clearError() {
  errorElement.textContent = "";
  errorElement.hidden = true;
}

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const runtimeError = chrome.runtime.lastError;
      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }
      if (!response?.ok) {
        reject(new Error(response?.error || "The extension request failed."));
        return;
      }
      resolve(response.data);
    });
  });
}

function renderSignedOut() {
  signInForm.hidden = false;
  signedInPanel.hidden = true;
  statusElement.textContent = "Sign in to use your saved application profile.";
}

function renderSignedIn(email) {
  signInForm.hidden = true;
  signedInPanel.hidden = false;
  accountEmail.textContent = email || "JobHunter account";
  renderConsent();
}

function renderConsent() {
  consentPanel.hidden = autofillConsent !== null && !editingConsent;
  consentDenied.hidden = autofillConsent !== false || editingConsent;
  changeConsentButton.hidden = autofillConsent !== false || editingConsent;
  scanButton.hidden = autofillConsent !== true;
  statusElement.textContent = autofillConsent === true
    ? "Ready when you are."
    : autofillConsent === false
      ? "Autofill assistance is off."
      : "Choose whether to allow autofill assistance.";
}

async function saveConsent(accepted) {
  await sendMessage({ type: "SET_AUTOFILL_CONSENT", accepted });
  autofillConsent = accepted;
  editingConsent = false;
  renderConsent();
}

async function initialize() {
  try {
    clientConfig = await sendMessage({ type: "GET_CONFIG" });
    signInButton.disabled = false;
    const session = await sendMessage({ type: "GET_SESSION" });
    if (session?.email) {
      renderSignedIn(session.email);
      autofillConsent = await sendMessage({ type: "GET_AUTOFILL_CONSENT" });
      renderConsent();
    } else {
      renderSignedOut();
    }
  } catch (error) {
    statusElement.textContent = "Setup needed";
    showError(error instanceof Error ? error.message : "Unable to connect to JobHunter.");
  }
}

signInForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();
  signInButton.disabled = true;
  signInButton.textContent = "Signing in...";

  try {
    const supabaseOrigin = new URL(clientConfig.supabaseUrl).origin;
    const permissionGranted = await chrome.permissions.request({
      origins: [`${supabaseOrigin}/*`],
    });
    if (!permissionGranted) {
      throw new Error("Supabase host access is required to sign in and refresh your session.");
    }

    const formData = new FormData(signInForm);
    const session = await sendMessage({
      type: "SIGN_IN",
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || ""),
    });
    signInForm.reset();
    renderSignedIn(session.email);
    autofillConsent = await sendMessage({ type: "GET_AUTOFILL_CONSENT" });
    renderConsent();
  } catch (error) {
    showError(error instanceof Error ? error.message : "Sign-in failed.");
  } finally {
    signInButton.disabled = false;
    signInButton.textContent = "Sign in to JobHunter";
  }
});

document.querySelector("#sign-out").addEventListener("click", async () => {
  clearError();
  try {
    await sendMessage({ type: "SIGN_OUT" });
    renderSignedOut();
  } catch (error) {
    showError(error instanceof Error ? error.message : "Sign-out failed.");
  }
});

document.querySelector("#consent-yes").addEventListener("click", () => {
  saveConsent(true).catch((error) =>
    showError(error instanceof Error ? error.message : "Unable to save your choice."),
  );
});

document.querySelector("#consent-no").addEventListener("click", () => {
  saveConsent(false).catch((error) =>
    showError(error instanceof Error ? error.message : "Unable to save your choice."),
  );
});

changeConsentButton.addEventListener("click", () => {
  editingConsent = true;
  renderConsent();
});

scanButton.addEventListener("click", async () => {
  if (autofillConsent !== true) return;
  clearError();
  const button = scanButton;
  button.disabled = true;
  button.textContent = "Scanning page...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:/.test(tab.url || "")) {
      throw new Error("Open an http or https job application page first.");
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    const response = await chrome.tabs.sendMessage(tab.id, { type: "SCAN_PAGE" });
    if (!response?.ok) throw new Error(response?.error || "Unable to scan this page.");
    const review = await sendMessage({
      type: "OPEN_REVIEW",
      tabId: tab.id,
      pageUrl: tab.url,
      pageTitle: tab.title || "Job application",
      fields: response.data?.fields,
    });
    if (!review?.reviewId) throw new Error("Unable to open the review tab.");
    window.close();
  } catch (error) {
    showError(error instanceof Error ? error.message : "Unable to inspect this page.");
  } finally {
    button.disabled = false;
    button.textContent = "Scan and autofill this page";
  }
});

initialize();
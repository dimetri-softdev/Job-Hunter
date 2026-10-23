const statusElement = document.querySelector("#status");
const errorElement = document.querySelector("#error");
const titleElement = document.querySelector("#source-title");
const linkElement = document.querySelector("#source-link");
const suggestionsElement = document.querySelector("#suggestions");
const matchCountElement = document.querySelector("#match-count");
const fillButton = document.querySelector("#fill-selected");
const trackerForm = document.querySelector("#tracker-form");
const logButton = document.querySelector("#log-application");

const reviewId = new URLSearchParams(location.search).get("reviewId");
let review = null;

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

function showError(message) {
  errorElement.textContent = message;
  errorElement.hidden = false;
  statusElement.hidden = true;
}

function setStatus(message, kind = "info") {
  statusElement.className = `notice ${kind}`;
  statusElement.textContent = message;
  statusElement.hidden = false;
  errorElement.hidden = true;
}

function renderSuggestion(match) {
  const row = document.createElement("label");
  row.className = "suggestion";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = !match.requiresReview;
  checkbox.dataset.fieldId = match.fieldId;

  const copy = document.createElement("span");
  copy.className = "suggestion-copy";
  const value = document.createElement("strong");
  value.textContent = match.suggestedValue;
  const detail = document.createElement("small");
  detail.textContent = `${match.profileKey} · ${Math.round(match.confidence * 100)}% confidence`;
  copy.append(value, detail);

  const badge = document.createElement("span");
  badge.className = `review-badge${match.requiresReview ? "" : " ready"}`;
  badge.textContent = match.requiresReview
    ? match.reason.replaceAll("-", " ")
    : "Ready to fill";

  row.append(checkbox, copy, badge);
  return row;
}

function renderReview(data) {
  review = data;
  titleElement.textContent = data.pageTitle || "Job application";
  linkElement.href = data.pageUrl;
  linkElement.title = data.pageUrl;

  const matches = data.matches.filter((match) => match.suggestedValue !== null);
  matchCountElement.textContent = String(matches.length);
  if (matches.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No profile matches found. Check that your JobHunter autofill profile has values saved, then scan the page again.";
    suggestionsElement.replaceChildren(empty);
  } else {
    suggestionsElement.replaceChildren(...matches.map(renderSuggestion));
  }

  const position = trackerForm.elements.namedItem("position");
  position.value = (data.pageTitle || "").trim().slice(0, 160);
  const source = trackerForm.elements.namedItem("source");
  source.value = new URL(data.pageUrl).hostname.includes("linkedin.com")
    ? "LinkedIn"
    : "Job board";

  fillButton.disabled = matches.length === 0;
  setStatus(`${matches.length} suggested match${matches.length === 1 ? "" : "es"}. Review before filling.`, "success");
}

fillButton.addEventListener("click", async () => {
  fillButton.disabled = true;
  setStatus("Filling selected fields...");
  const fieldIds = Array.from(
    suggestionsElement.querySelectorAll("input[type=checkbox]:checked"),
  ).map((checkbox) => checkbox.dataset.fieldId);

  try {
    const result = await sendMessage({
      type: "FILL_REVIEW_FIELDS",
      reviewId,
      fieldIds,
    });
    setStatus(`${result.filled} field${result.filled === 1 ? "" : "s"} filled. The employer's form was not submitted.`, "success");
  } catch (error) {
    showError(error instanceof Error ? error.message : "Unable to fill the selected fields.");
  } finally {
    fillButton.disabled = false;
  }
});

trackerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  logButton.disabled = true;
  setStatus("Saving application to your tracker...");
  const formData = new FormData(trackerForm);

  try {
    await sendMessage({
      type: "CREATE_APPLICATION",
      application: {
        company: formData.get("company"),
        position: formData.get("position"),
        source: formData.get("source"),
        jobUrl: review.pageUrl,
      },
    });
    setStatus("Application saved in your JobHunter tracker.", "success");
  } catch (error) {
    showError(error instanceof Error ? error.message : "Unable to save this application.");
  } finally {
    logButton.disabled = false;
  }
});

async function initialize() {
  if (!reviewId) {
    showError("This review link is missing its ID. Scan the application page again.");
    fillButton.disabled = true;
    logButton.disabled = true;
    return;
  }

  try {
    renderReview(await sendMessage({ type: "GET_REVIEW", reviewId }));
  } catch (error) {
    showError(error instanceof Error ? error.message : "Unable to load the page review.");
    fillButton.disabled = true;
    logButton.disabled = true;
  }
}

initialize();
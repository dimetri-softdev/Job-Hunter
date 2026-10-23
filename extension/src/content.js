(() => {
  if (globalThis.__jobhunterAutofillInstalled) return;
  globalThis.__jobhunterAutofillInstalled = true;

  const elementByFieldId = new Map();
  const excludedTypes = new Set([
    "button",
    "checkbox",
    "color",
    "file",
    "hidden",
    "image",
    "radio",
    "reset",
    "submit",
  ]);

  function isVisible(element) {
    const style = window.getComputedStyle(element);
    const rectangle = element.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      rectangle.width > 0 &&
      rectangle.height > 0
    );
  }

  function fieldLabel(element) {
    const associated = element.labels
      ? Array.from(element.labels).map((label) => label.innerText)
      : [];
    const labelledBy = (element.getAttribute("aria-labelledby") || "")
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.innerText || "");
    const wrappingLabel = element.closest("label")?.innerText || "";
    return [
      ...associated,
      ...labelledBy,
      wrappingLabel,
      element.getAttribute("aria-label") || "",
    ]
      .filter(Boolean)
      .join(" ")
      .slice(0, 300);
  }

  function collectFields() {
    elementByFieldId.clear();
    let index = 0;
    const fields = [];
    const controls = document.querySelectorAll("input, textarea, select");

    for (const element of controls) {
      const type = (element.getAttribute("type") || element.tagName).toLowerCase();
      if (
        excludedTypes.has(type) ||
        element.disabled ||
        element.readOnly ||
        !isVisible(element) ||
        ("value" in element && String(element.value || "").trim())
      ) {
        continue;
      }

      const fieldId = `field-${index++}`;
      elementByFieldId.set(fieldId, element);
      fields.push({
        fieldId,
        name: element.getAttribute("name"),
        id: element.id,
        label: fieldLabel(element),
        placeholder: element.getAttribute("placeholder"),
        autocomplete: element.getAttribute("autocomplete"),
        type,
      });
    }

    return fields;
  }

  function setControlValue(element, value) {
    if (element instanceof HTMLSelectElement) {
      const normalized = value.trim().toLocaleLowerCase();
      const option = Array.from(element.options).find(
        (candidate) =>
          candidate.value.trim().toLocaleLowerCase() === normalized ||
          candidate.text.trim().toLocaleLowerCase() === normalized,
      );
      if (!option) return false;
      element.value = option.value;
    } else {
      const prototype =
        element instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
      if (setter) setter.call(element, value);
      else element.value = value;
    }

    element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function createOverlay(matches) {
    document.getElementById("jobhunter-autofill-host")?.remove();
    const host = document.createElement("div");
    host.id = "jobhunter-autofill-host";
    host.style.cssText = "all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none";
    const shadow = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = `
      :host { all: initial; color-scheme: light; font-family: "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      .panel { position: fixed; top: 16px; right: 16px; width: min(390px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; padding: 16px; border: 1px solid #c9d7cb; border-radius: 12px; background: #f6f8f4; color: #1d2a20; box-shadow: 0 16px 48px #08140c55; pointer-events: auto; font-size: 13px; }
      .head { display: flex; align-items: start; justify-content: space-between; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid #dce5dc; }
      h2 { margin: 0; font-size: 16px; }
      p { margin: 5px 0 0; color: #58665a; font-size: 11px; line-height: 1.45; }
      button { min-height: 34px; padding: 0 11px; border: 0; border-radius: 6px; background: #285334; color: white; font: 600 12px "Segoe UI", sans-serif; cursor: pointer; }
      button.secondary { border: 1px solid #c9d7cb; background: transparent; color: #334437; }
      button.close { min-width: 32px; padding: 0; background: transparent; color: #47564a; font-size: 19px; }
      button:disabled { opacity: .55; cursor: wait; }
      .section { margin-top: 15px; }
      .section h3 { margin: 0 0 8px; color: #435346; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
      .suggestions { display: grid; gap: 7px; }
      .suggestion { display: grid; grid-template-columns: 18px minmax(0, 1fr); align-items: start; gap: 8px; padding: 9px; border: 1px solid #dce5dc; border-radius: 7px; background: white; }
      .suggestion input { width: 15px; height: 15px; margin: 2px 0 0; accent-color: #285334; }
      .suggestion strong { display: block; overflow-wrap: anywhere; font-size: 11px; }
      .suggestion small { display: block; margin-top: 3px; color: #647166; font-size: 10px; }
      .actions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
      .job-form { display: grid; gap: 7px; }
      .job-form label { display: grid; gap: 4px; color: #566357; font-size: 10px; font-weight: 600; }
      .job-form input, .job-form select { width: 100%; min-height: 34px; padding: 0 8px; border: 1px solid #c9d7cb; border-radius: 6px; background: white; color: #1d2a20; font: 12px "Segoe UI", sans-serif; }
      .message { min-height: 16px; margin-top: 8px; color: #285334; font-size: 11px; }
      @media (max-width: 480px) { .panel { top: 8px; right: 8px; width: calc(100vw - 16px); max-height: calc(100vh - 16px); } }
    `;

    const panel = document.createElement("section");
    panel.className = "panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "JobHunter application assistant");

    const head = document.createElement("div");
    head.className = "head";
    const heading = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = "Review application fields";
    const intro = document.createElement("p");
    intro.textContent = "Suggestions are local to this page. Nothing is filled or submitted until you choose an action.";
    heading.append(title, intro);
    const close = document.createElement("button");
    close.className = "close";
    close.type = "button";
    close.setAttribute("aria-label", "Close assistant");
    close.textContent = "×";
    head.append(heading, close);

    const suggestionsSection = document.createElement("section");
    suggestionsSection.className = "section";
    const suggestionsTitle = document.createElement("h3");
    suggestionsTitle.textContent = "Profile matches";
    const suggestions = document.createElement("div");
    suggestions.className = "suggestions";
    const matched = matches.filter((match) => match.suggestedValue !== null);

    if (matched.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No matching saved profile fields were found on this page.";
      suggestions.append(empty);
    }

    for (const match of matched) {
      const row = document.createElement("label");
      row.className = "suggestion";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = !match.requiresReview;
      checkbox.dataset.fieldId = match.fieldId;
      const details = document.createElement("span");
      const value = document.createElement("strong");
      value.textContent = match.suggestedValue;
      const metadata = document.createElement("small");
      metadata.textContent = `${match.profileKey} · ${Math.round(match.confidence * 100)}% · ${match.reason.replaceAll("-", " ")}`;
      details.append(value, metadata);
      row.append(checkbox, details);
      suggestions.append(row);
    }

    const fillButton = document.createElement("button");
    fillButton.type = "button";
    fillButton.textContent = "Fill selected fields";
    fillButton.disabled = matched.length === 0;
    const reviewNote = document.createElement("p");
    reviewNote.textContent = "Sensitive and lower-confidence matches are unchecked. Review them before selecting.";
    const fillActions = document.createElement("div");
    fillActions.className = "actions";
    fillActions.append(fillButton);
    suggestionsSection.append(suggestionsTitle, suggestions, reviewNote, fillActions);

    const trackerSection = document.createElement("section");
    trackerSection.className = "section";
    const trackerTitle = document.createElement("h3");
    trackerTitle.textContent = "Log in JobHunter";
    const trackerIntro = document.createElement("p");
    trackerIntro.textContent = "Confirm these details to add a saved application. This does not submit the employer's form.";
    const trackerForm = document.createElement("form");
    trackerForm.className = "job-form";
    trackerForm.innerHTML = `
      <label>Company<input name="company" maxlength="160" required></label>
      <label>Position<input name="position" maxlength="160" required></label>
      <label>Source<select name="source"><option>Job board</option><option>Company website</option><option>LinkedIn</option><option>Recruiter</option><option>Referral</option><option>Networking</option><option>Other</option></select></label>
      <button type="submit" class="secondary">Log application</button>
    `;
    trackerForm.querySelector('[name="position"]').value = document.title.trim().slice(0, 160);
    trackerForm.querySelector('[name="source"]').value = location.hostname.includes("linkedin.com") ? "LinkedIn" : "Job board";
    const trackerMessage = document.createElement("p");
    trackerMessage.className = "message";
    trackerMessage.setAttribute("role", "status");
    trackerSection.append(trackerTitle, trackerIntro, trackerForm, trackerMessage);

    close.addEventListener("click", () => host.remove());
    fillButton.addEventListener("click", () => {
      let filled = 0;
      for (const checkbox of suggestions.querySelectorAll("input[type=checkbox]:checked")) {
        const match = matched.find((item) => item.fieldId === checkbox.dataset.fieldId);
        const element = elementByFieldId.get(checkbox.dataset.fieldId);
        if (match?.suggestedValue != null && element && setControlValue(element, match.suggestedValue)) {
          filled += 1;
        }
      }
      trackerMessage.textContent = `Filled ${filled} selected field${filled === 1 ? "" : "s"}. The application form was not submitted.`;
    });

    trackerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitButton = trackerForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      trackerMessage.textContent = "Saving application...";
      const formData = new FormData(trackerForm);
      try {
        const response = await chrome.runtime.sendMessage({
          type: "CREATE_APPLICATION",
          application: {
            company: formData.get("company"),
            position: formData.get("position"),
            source: formData.get("source"),
            jobUrl: location.href,
          },
        });
        if (!response?.ok) throw new Error(response?.error || "Unable to save application.");
        trackerMessage.textContent = "Application saved to your JobHunter tracker.";
      } catch (error) {
        trackerMessage.textContent = error instanceof Error ? error.message : "Unable to save application.";
      } finally {
        submitButton.disabled = false;
      }
    });

    panel.append(head, suggestionsSection, trackerSection);
    shadow.append(style, panel);
    document.documentElement.append(host);
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "SCAN_PAGE") return false;

    const fields = collectFields();
    chrome.runtime.sendMessage({ type: "MAP_FIELDS", fields }, (response) => {
      const runtimeError = chrome.runtime.lastError;
      if (runtimeError || !response?.ok) {
        sendResponse({
          ok: false,
          error: response?.error || runtimeError?.message || "Unable to load your saved profile.",
        });
        return;
      }

      createOverlay(response.data.matches);
      sendResponse({ ok: true });
    });

    return true;
  });
})();
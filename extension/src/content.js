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

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "SCAN_PAGE") {
      sendResponse({ ok: true, data: { fields: collectFields() } });
      return false;
    }

    if (message?.type === "FILL_FIELDS") {
      if (!Array.isArray(message.fills) || message.fills.length > 250) {
        sendResponse({ ok: false, error: "The selected fields could not be filled." });
        return false;
      }

      let filled = 0;
      for (const fill of message.fills) {
        const element = elementByFieldId.get(fill.fieldId);
        if (
          !element?.isConnected ||
          element.disabled ||
          element.readOnly ||
          !isVisible(element) ||
          typeof fill.value !== "string"
        ) {
          continue;
        }
        if (setControlValue(element, fill.value)) filled += 1;
      }

      sendResponse({ ok: true, data: { filled } });
      return false;
    }

    return false;
  });
})();
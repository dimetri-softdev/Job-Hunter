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
    "password",
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

  function optionText(element) {
    return (
      element.getAttribute("aria-label") ||
      element.innerText ||
      element.textContent ||
      element.value ||
      ""
    ).trim().slice(0, 200);
  }

  function groupLabel(group, options) {
    const legend = group.querySelector(":scope > legend");
    const labelledBy = (group.getAttribute("aria-labelledby") || "")
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.innerText || "")
      .filter(Boolean)
      .join(" ");
    const explicit = group.getAttribute("aria-label") || legend?.innerText || labelledBy;
    if (explicit) return explicit.trim().slice(0, 300);

    let text = (group.innerText || group.textContent || "").trim();
    for (const option of options) {
      if (option) text = text.replace(option, " ");
    }
    return text.replace(/\s+/g, " ").trim().slice(0, 300);
  }

  function listedOptions(element) {
    const ids = [
      ...(element.getAttribute("aria-controls") || "").split(/\s+/),
      ...(element.getAttribute("aria-owns") || "").split(/\s+/),
    ].filter(Boolean);
    const containers = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    return containers
      .flatMap((container) =>
        Array.from(container.querySelectorAll('[role="option"], option')),
      )
      .map(optionText)
      .filter(Boolean)
      .slice(0, 100);
  }

  function collectFields() {
    elementByFieldId.clear();
    let index = 0;
    const fields = [];
    const groupedControls = new Set();
    const seenControls = new Set();
    const groups = Array.from(
      document.querySelectorAll('fieldset, [role="radiogroup"], [role="group"]'),
    );

    for (const button of document.querySelectorAll('button, [role="button"]')) {
      if (!isVisible(button) || !/^(?:yes|no)(?:\b|[,])/i.test(optionText(button))) continue;
      let ancestor = button.parentElement;
      for (let depth = 0; ancestor && depth < 4; depth += 1, ancestor = ancestor.parentElement) {
        const controls = Array.from(
          ancestor.querySelectorAll('button, [role="button"], [role="radio"]'),
        ).filter(isVisible);
        const hasYes = controls.some((control) => /^yes(?:\b|[,])/i.test(optionText(control)));
        const hasNo = controls.some((control) => /^no(?:\b|[,])/i.test(optionText(control)));
        if (hasYes && hasNo && controls.length <= 8) {
          groups.push(ancestor);
          break;
        }
      }
    }

    for (const group of new Set(groups)) {
      if (!isVisible(group)) continue;
      const options = Array.from(
        group.querySelectorAll('button, [role="button"], [role="radio"], input[type="radio"]'),
      ).filter(isVisible);
      const yesOption = options.find((option) => /^yes(?:\b|[,])/i.test(optionText(option)));
      const noOption = options.find((option) => /^no(?:\b|[,])/i.test(optionText(option)));
      if (!yesOption || !noOption || options.some((option) => groupedControls.has(option))) continue;
      const alreadySelected = options.some(
        (option) =>
          option.checked === true ||
          option.getAttribute("aria-checked") === "true" ||
          option.getAttribute("aria-pressed") === "true" ||
          option.getAttribute("aria-selected") === "true" ||
          ["checked", "on"].includes(option.getAttribute("data-state") || ""),
      );
      if (alreadySelected) continue;

      const optionLabels = options.map(optionText);
      const fieldId = `field-${index++}`;
      elementByFieldId.set(fieldId, {
        kind: "yes-no",
        options: [
          { element: yesOption, label: optionText(yesOption) },
          { element: noOption, label: optionText(noOption) },
        ],
      });
      fields.push({
        fieldId,
        name: yesOption.getAttribute("name") || noOption.getAttribute("name"),
        id: group.id || null,
        label: groupLabel(group, optionLabels),
        type: "custom-yes-no",
        options: ["Yes", "No"],
      });
      for (const option of options) groupedControls.add(option);
    }

    const controls = document.querySelectorAll("input, textarea, select, [role=combobox]");
    for (const element of controls) {
      if (seenControls.has(element) || groupedControls.has(element)) continue;
      seenControls.add(element);
      const isCustomDropdown =
        (element.getAttribute("role") === "combobox" ||
          (element.getAttribute("aria-autocomplete") &&
            (element.hasAttribute("aria-controls") || element.hasAttribute("aria-owns")))) &&
        !(element instanceof HTMLSelectElement);
      const type = (
        element.getAttribute("type") ||
        (isCustomDropdown ? "combobox" : element.tagName)
      ).toLowerCase();
      if (
        (!isCustomDropdown && excludedTypes.has(type)) ||
        element.disabled ||
        element.readOnly ||
        !isVisible(element) ||
        ("value" in element && String(element.value || "").trim())
      ) {
        continue;
      }

      const fieldId = `field-${index++}`;
      const kind = isCustomDropdown
        ? "custom-dropdown"
        : element instanceof HTMLSelectElement
          ? "select"
          : "input";
      elementByFieldId.set(fieldId, { kind, element });
      const associated = element.labels
        ? Array.from(element.labels).map((label) => label.innerText).filter(Boolean).join(" ")
        : "";
      const labelledBy = (element.getAttribute("aria-labelledby") || "")
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.innerText || "")
        .filter(Boolean)
        .join(" ");
      fields.push({
        fieldId,
        name: element.getAttribute("name"),
        id: element.id,
        label: [
          associated,
          labelledBy,
          element.closest("label")?.innerText || "",
          element.getAttribute("aria-label") || "",
        ]
          .filter(Boolean)
          .join(" ")
          .slice(0, 300),
        placeholder: element.getAttribute("placeholder"),
        autocomplete: element.getAttribute("autocomplete"),
        type,
        options:
          kind === "select"
            ? Array.from(element.options)
                .filter((option) => !option.disabled)
                .map(optionText)
                .filter(Boolean)
                .slice(0, 100)
            : kind === "custom-dropdown"
              ? listedOptions(element)
              : undefined,
      });
    }

    return fields;
  }

  function setValue(element, value) {
    const prototype =
      element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) setter.call(element, value);
    else element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function normalized(value) {
    return String(value || "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
  }

  function setControlValue(element, value) {
    if (element instanceof HTMLSelectElement) {
      const normalizedValue = normalized(value);
      const option = Array.from(element.options).find(
        (candidate) =>
          normalized(candidate.value) === normalizedValue ||
          normalized(candidate.text) === normalizedValue,
      );
      if (!option) return false;
      element.value = option.value;
      element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    setValue(element, value);
    return true;
  }

  function matchingOption(options, value) {
    const expected = normalized(value);
    return options.find((option) => normalized(optionText(option)) === expected);
  }

  async function fillYesNo(reference, value) {
    const expected = normalized(value);
    const choice = reference.options.find((option) => {
      const label = normalized(option.label);
      return label === expected || label.startsWith(`${expected},`);
    });
    if (!choice || !choice.element.isConnected || choice.element.disabled) return false;
    choice.element.click();
    return true;
  }

  async function fillCustomDropdown(reference, value) {
    const element = reference.element;
    if (!element?.isConnected) return false;
    const controlledIds = [
      ...(element.getAttribute("aria-controls") || "").split(/\s+/),
      ...(element.getAttribute("aria-owns") || "").split(/\s+/),
    ].filter(Boolean);

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      setValue(element, value);
    }
    element.click();

    for (let attempt = 0; attempt < 8; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 75));
      const containers = controlledIds
        .map((id) => document.getElementById(id))
        .filter((container) => container && isVisible(container));
      const options = containers.flatMap((container) =>
        Array.from(container.querySelectorAll('[role="option"]')),
      );
      const option = matchingOption(options, value);
      if (option && isVisible(option) && option.getAttribute("aria-disabled") !== "true") {
        option.click();
        return true;
      }
    }
    return false;
  }

  async function fillFields(fills) {
    let filled = 0;
    const formPrototype = HTMLFormElement.prototype;
    const originalSubmit = formPrototype.submit;
    const originalRequestSubmit = formPrototype.requestSubmit;
    const preventSubmit = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    document.addEventListener("submit", preventSubmit, true);
    formPrototype.submit = function () {};
    if (originalRequestSubmit) formPrototype.requestSubmit = function () {};
    try {
      for (const fill of fills) {
        const reference = elementByFieldId.get(fill.fieldId);
        if (
          !reference ||
          typeof fill.value !== "string" ||
          (reference.element &&
            (!reference.element.isConnected ||
              reference.element.disabled ||
              reference.element.readOnly ||
              !isVisible(reference.element)))
        ) {
          continue;
        }

        let succeeded = false;
        if (reference.kind === "yes-no") {
          succeeded = await fillYesNo(reference, fill.value);
        } else if (reference.kind === "custom-dropdown") {
          succeeded = await fillCustomDropdown(reference, fill.value);
        } else {
          succeeded = setControlValue(reference.element, fill.value);
        }
        if (succeeded) filled += 1;
      }
    } finally {
      document.removeEventListener("submit", preventSubmit, true);
      formPrototype.submit = originalSubmit;
      if (originalRequestSubmit) formPrototype.requestSubmit = originalRequestSubmit;
    }
    return filled;
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
      fillFields(message.fills)
        .then((filled) => sendResponse({ ok: true, data: { filled } }))
        .catch(() =>
          sendResponse({ ok: false, error: "The selected fields could not be filled." }),
        );
      return true;
    }

    return false;
  });
})();

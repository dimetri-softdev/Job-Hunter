import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../src/lib/autofill-field-mapper.ts", import.meta.url),
  "utf8",
);
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { mapApplicationFields } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

const profile = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  workAuthorization: "Yes",
  workAuthorizationConsent: true,
  privacyConsentAccepted: true,
};

test("high-confidence non-sensitive values are eligible for automatic fill", () => {
  const [match] = mapApplicationFields(
    [{ fieldId: "email", label: "Email address", type: "email" }],
    profile,
  );
  assert.equal(match.reason, "matched");
  assert.equal(match.requiresReview, false);
  assert.equal(match.suggestedValue, "ada@example.com");
});

test("sensitive questions remain in review even when the profile consent exists", () => {
  const [match] = mapApplicationFields(
    [{ fieldId: "work", label: "Are you authorized to work?", type: "custom-yes-no" }],
    profile,
  );
  assert.equal(match.reason, "sensitive-review");
  assert.equal(match.requiresReview, true);
});

test("demographic answers are treated as sensitive based on the page field", () => {
  const [match] = mapApplicationFields(
    [{ fieldId: "gender", label: "Gender", type: "text" }],
    {
      privacyConsentAccepted: true,
      savedAnswers: [
        { questionKey: "gender", answerText: "Prefer not to say", consentGiven: true },
      ],
    },
  );
  assert.equal(match.reason, "sensitive-review");
  assert.equal(match.requiresReview, true);
});

test("dropdown values require an exact available option before automatic fill", () => {
  const [exact, unavailable] = mapApplicationFields(
    [
      { fieldId: "exact", label: "Email address", type: "select", options: ["", "ada@example.com"] },
      { fieldId: "unavailable", label: "Email address", type: "combobox", options: ["Other"] },
    ],
    profile,
  );
  assert.equal(exact.reason, "matched");
  assert.equal(exact.suggestedValue, "ada@example.com");
  assert.equal(unavailable.requiresReview, true);
  assert.equal(unavailable.reason, "low-confidence");
});

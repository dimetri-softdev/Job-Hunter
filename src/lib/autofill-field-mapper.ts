export interface DetectedApplicationField {
  fieldId: string;
  name?: string | null;
  id?: string | null;
  label?: string | null;
  placeholder?: string | null;
  autocomplete?: string | null;
  type?: string | null;
}

export interface AutofillProfileData {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  linkedInUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  noticePeriod?: string | null;
  workAuthorization?: string | null;
  workAuthorizationConsent?: boolean;
  salaryExpectation?: string | null;
  salaryExpectationConsent?: boolean;
  eeoData?: Record<string, unknown> | null;
  eeoDataConsent?: boolean;
  privacyConsentAccepted: boolean;
  savedAnswers?: Array<{
    questionKey: string;
    answerText: string;
    isSensitive?: boolean;
    consentGiven?: boolean;
  }>;
}

export type AutofillMatchReason =
  | "matched"
  | "low-confidence"
  | "sensitive-review"
  | "sensitive-consent-required"
  | "profile-consent-required"
  | "ambiguous"
  | "no-match";

export interface AutofillFieldMatch {
  fieldId: string;
  profileKey: string | null;
  suggestedValue: string | null;
  confidence: number;
  requiresReview: boolean;
  reason: AutofillMatchReason;
}

export const AUTOFILL_AUTO_MATCH_THRESHOLD = 0.9;

interface ProfileValue {
  key: string;
  value: string;
  aliases: string[];
  autocomplete: string[];
  sensitive: boolean;
  consentGiven: boolean;
}

const PROFILE_FIELD_RULES: Array<{
  key: keyof AutofillProfileData;
  aliases: string[];
  autocomplete: string[];
  sensitive?: boolean;
  consentKey?: "workAuthorizationConsent" | "salaryExpectationConsent";
}> = [
  { key: "fullName", aliases: ["full name", "applicant name", "candidate name"], autocomplete: ["name"] },
  { key: "email", aliases: ["email", "email address", "e-mail"], autocomplete: ["email"] },
  { key: "phone", aliases: ["phone", "phone number", "mobile", "telephone"], autocomplete: ["tel", "tel-national"] },
  { key: "addressLine1", aliases: ["street address", "address line 1", "address1", "mailing address"], autocomplete: ["street-address", "address-line1"] },
  { key: "addressLine2", aliases: ["address line 2", "address2", "apartment", "suite"], autocomplete: ["address-line2"] },
  { key: "city", aliases: ["city", "town"], autocomplete: ["address-level2"] },
  { key: "state", aliases: ["state", "province", "region"], autocomplete: ["address-level1"] },
  { key: "postalCode", aliases: ["postal code", "zip code", "zipcode", "postcode"], autocomplete: ["postal-code"] },
  { key: "country", aliases: ["country", "country name"], autocomplete: ["country-name", "country"] },
  { key: "linkedInUrl", aliases: ["linkedin", "linkedin url", "linkedin profile"], autocomplete: [] },
  { key: "githubUrl", aliases: ["github", "github url", "github profile"], autocomplete: [] },
  { key: "portfolioUrl", aliases: ["portfolio", "portfolio url", "personal website"], autocomplete: ["url"] },
  { key: "noticePeriod", aliases: ["notice period", "availability to start"], autocomplete: [] },
  {
    key: "workAuthorization",
    aliases: ["work authorization", "visa status", "authorized to work", "sponsorship"],
    autocomplete: [],
    sensitive: true,
    consentKey: "workAuthorizationConsent",
  },
  {
    key: "salaryExpectation",
    aliases: ["salary expectation", "desired salary", "salary requirements", "compensation expectation"],
    autocomplete: [],
    sensitive: true,
    consentKey: "salaryExpectationConsent",
  },
];

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function asText(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

function getProfileValues(profile: AutofillProfileData): ProfileValue[] {
  const values: ProfileValue[] = [];

  for (const rule of PROFILE_FIELD_RULES) {
    const value = asText(profile[rule.key]);
    if (!value) continue;

    values.push({
      key: rule.key,
      value,
      aliases: rule.aliases,
      autocomplete: rule.autocomplete,
      sensitive: rule.sensitive ?? false,
      consentGiven: rule.consentKey
        ? profile[rule.consentKey] === true
        : true,
    });
  }

  if (profile.eeoData && profile.eeoDataConsent) {
    for (const [key, rawValue] of Object.entries(profile.eeoData)) {
      const value = asText(rawValue);
      if (!value) continue;
      values.push({
        key: `eeoData.${key}`,
        value,
        aliases: [key],
        autocomplete: [],
        sensitive: true,
        consentGiven: true,
      });
    }
  }

  for (const answer of profile.savedAnswers ?? []) {
    const value = asText(answer.answerText);
    if (!value || !answer.questionKey.trim()) continue;
    values.push({
      key: `savedAnswers.${answer.questionKey}`,
      value,
      aliases: [answer.questionKey],
      autocomplete: [],
      sensitive: answer.isSensitive ?? false,
      consentGiven: answer.consentGiven ?? false,
    });
  }

  return values;
}

function scoreField(field: DetectedApplicationField, value: ProfileValue): number {
  const autocomplete = normalize(field.autocomplete);
  if (autocomplete && value.autocomplete.includes(autocomplete)) return 0.99;

  const inputType = normalize(field.type);
  if (inputType === "email" && value.key === "email") return 0.98;
  if (inputType === "tel" && value.key === "phone") return 0.98;

  const sources = [
    { text: normalize(field.label), exact: 0.94, contains: 0.9 },
    { text: normalize(field.name), exact: 0.86, contains: 0.82 },
    { text: normalize(field.id), exact: 0.84, contains: 0.8 },
    { text: normalize(field.placeholder), exact: 0.83, contains: 0.79 },
  ].filter((source) => source.text);

  let bestScore = 0;
  for (const source of sources) {
    for (const alias of value.aliases) {
      const normalizedAlias = normalize(alias);
      if (!normalizedAlias) continue;
      if (source.text === normalizedAlias) {
        bestScore = Math.max(bestScore, source.exact);
      } else if (` ${source.text} `.includes(` ${normalizedAlias} `)) {
        bestScore = Math.max(bestScore, source.contains);
      }
    }
  }

  return bestScore;
}

function makeUnmatched(
  fieldId: string,
  reason: AutofillMatchReason,
  confidence = 0,
): AutofillFieldMatch {
  return {
    fieldId,
    profileKey: null,
    suggestedValue: null,
    confidence,
    requiresReview: reason !== "no-match",
    reason,
  };
}

export function mapApplicationFields(
  fields: DetectedApplicationField[],
  profile: AutofillProfileData,
): AutofillFieldMatch[] {
  if (!profile.privacyConsentAccepted) {
    return fields.map((field) =>
      makeUnmatched(field.fieldId, "profile-consent-required"),
    );
  }

  const profileValues = getProfileValues(profile);

  return fields.map((field) => {
    const ranked = profileValues
      .map((value) => ({ value, confidence: scoreField(field, value) }))
      .filter((candidate) => candidate.confidence > 0)
      .sort((left, right) => right.confidence - left.confidence);

    const best = ranked[0];
    if (!best) return makeUnmatched(field.fieldId, "no-match");

    const second = ranked[1];
    if (second && best.confidence - second.confidence < 0.05) {
      return makeUnmatched(field.fieldId, "ambiguous", best.confidence);
    }

    if (!best.value.consentGiven) {
      return {
        fieldId: field.fieldId,
        profileKey: best.value.key,
        suggestedValue: null,
        confidence: best.confidence,
        requiresReview: true,
        reason: "sensitive-consent-required",
      };
    }

    if (best.value.sensitive) {
      return {
        fieldId: field.fieldId,
        profileKey: best.value.key,
        suggestedValue: best.value.value,
        confidence: best.confidence,
        requiresReview: true,
        reason: "sensitive-review",
      };
    }

    if (best.confidence < AUTOFILL_AUTO_MATCH_THRESHOLD) {
      return {
        fieldId: field.fieldId,
        profileKey: best.value.key,
        suggestedValue: best.value.value,
        confidence: best.confidence,
        requiresReview: true,
        reason: "low-confidence",
      };
    }

    return {
      fieldId: field.fieldId,
      profileKey: best.value.key,
      suggestedValue: best.value.value,
      confidence: best.confidence,
      requiresReview: false,
      reason: "matched",
    };
  });
}
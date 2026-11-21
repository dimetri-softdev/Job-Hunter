export const BILLING_FEATURES = [
  { key: "job_fit", label: "Job-fit checks" },
  { key: "roadmap_generation", label: "Roadmap generations" },
  { key: "role_suggestions", label: "Role suggestions" },
  { key: "application_drafts", label: "Application drafts" },
  { key: "interview_prep", label: "Interview practice" },
  { key: "resume_updates", label: "Resume updates" },
  { key: "assistant_chat", label: "AI assistant" },
] as const;

export type BillingFeatureKey = (typeof BILLING_FEATURES)[number]["key"];

export function isBillingFeatureKey(value: unknown): value is BillingFeatureKey {
  return (
    typeof value === "string" &&
    BILLING_FEATURES.some((feature) => feature.key === value)
  );
}

"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Clock3, Loader2, LockKeyhole } from "lucide-react";
import { fetcher } from "@/lib/api";

interface FeatureUsage {
  label: string;
  limit: number | null;
  used: number;
  remaining: number | null;
  available: boolean;
  includedFrom: string;
}

interface BillingStatus {
  billingEnabled: boolean;
  checkoutEnabled: false;
  currency: string | null;
  annualDiscountPercent: number;
  plan: string | null;
  status: string;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  paymentFailedAt: string | null;
  canceledAt: string | null;
  usagePeriodStartsAt: string;
  features: Record<string, FeatureUsage>;
  plans: Record<string, Record<string, number>>;
}

const FEATURE_ORDER = [
  "job_fit",
  "roadmap_generation",
  "role_suggestions",
  "application_drafts",
  "resume_updates",
  "assistant_chat",
];

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function BillingOverview() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetcher<BillingStatus>("/billing/status")
      .then((result) => {
        if (active) setStatus(result);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load plan and usage information.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <p
        role="alert"
        className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200"
      >
        {error}
      </p>
    );
  }
  if (!status) {
    return (
      <p className="flex items-center gap-2 py-8 text-sm text-slate-400">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading plan and usage…
      </p>
    );
  }

  const activeTrial = status.status === "TRIALING";
  const entitled = ["TRIALING", "ACTIVE", "CANCELED", "PAST_DUE"].includes(
    status.status,
  );
  const trialEnd = formatDate(status.trialEndsAt);
  const periodEnd = formatDate(status.currentPeriodEnd);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-300">
              Current access
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {status.plan ? `${titleCase(status.plan)} plan` : "No plan assigned"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              {!status.billingEnabled
                ? "Pilot mode is active. Paid access and monthly usage limits are not being enforced; the AI assistant has a separate daily cap."
                : activeTrial
                  ? `Your Standard trial is active${trialEnd ? ` until ${trialEnd}` : ""}.`
                  : status.status === "EXPIRED"
                    ? "Your access period has ended. Your saved information remains available to view and export."
                    : entitled
                      ? `Your access is ${titleCase(status.status)}${periodEnd ? ` through ${periodEnd}` : ""}.`
                      : "No plan or trial is assigned. Your saved information remains available to view and export; ask the administrator about a tester trial."}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status.billingEnabled
                ? entitled
                  ? "bg-emerald-400/10 text-emerald-200"
                  : "bg-amber-400/10 text-amber-200"
                : "bg-blue-400/10 text-blue-200"
            }`}
          >
            {!status.billingEnabled
              ? "Free pilot"
              : entitled
                ? titleCase(status.status)
                : status.status === "EXPIRED"
                  ? "Expired"
                  : "Read-only"}
          </span>
        </div>
        {status.billingEnabled && !entitled && (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Checkout has not been enabled. No payment can be made from this app
            yet; an administrator must grant a tester trial.
          </p>
        )}
        {status.checkoutEnabled === false && (
          <p className="mt-3 text-xs text-slate-500">
            Prices are not set. Checkout is disabled until a payment provider,
            South African merchant eligibility, settlement currency, and fees are
            confirmed.
          </p>
        )}
      </section>

      {status.billingEnabled && status.plan && (
        <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-5">
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-violet-300" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-white">This month’s usage</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Usage resets on the first day of each month. Job-fit allowance also
            covers job-post analysis and Proof Sprints. The AI assistant also
            has a separate daily cap.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_ORDER.map((key) => {
              const feature = status.features[key];
              if (!feature) return null;
              return (
                <li
                  key={key}
                  className="rounded-lg border border-[#252735] bg-[#0d0e14] p-3"
                >
                  <p className="text-sm font-medium text-slate-200">
                    {titleCase(feature.label)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {feature.limit === null
                      ? "Not included in this plan"
                      : `${feature.used} of ${feature.limit} used`}
                  </p>
                  {feature.limit !== null && !feature.available && (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-amber-200">
                      <LockKeyhole className="size-3" aria-hidden="true" />
                      Included from {titleCase(feature.includedFrom)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-white">Plan allowances</h2>
          <p className="mt-1 text-xs text-slate-500">
            Monthly AI allowances. Prices will be published after payment setup
            and operating costs are confirmed.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {Object.entries(status.plans).map(([plan, limits]) => (
            <article
              key={plan}
              className={`rounded-xl border bg-[#12131a] p-4 ${
                status.plan === plan
                  ? "border-violet-400/50"
                  : "border-[#1f212d]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-white">
                  {titleCase(plan)}
                </h3>
                {status.plan === plan && (
                  <span className="rounded-full bg-violet-400/10 px-2 py-1 text-[10px] font-medium text-violet-200">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">Price to be announced</p>
              <ul className="mt-4 space-y-2">
                {FEATURE_ORDER.map((key) => {
                  const feature = status.features[key];
                  const included = limits[key] !== undefined &&
                    (plan === "premium" ||
                      (plan === "standard" &&
                        key !== "resume_updates") ||
                      (plan === "basic" &&
                        [
                          "job_fit",
                          "roadmap_generation",
                          "assistant_chat",
                        ].includes(key)));
                  return (
                    <li key={key} className="flex items-start gap-2 text-xs">
                      {included ? (
                        <Check
                          className="mt-0.5 size-3.5 shrink-0 text-emerald-300"
                          aria-hidden="true"
                        />
                      ) : (
                        <LockKeyhole
                          className="mt-0.5 size-3.5 shrink-0 text-slate-600"
                          aria-hidden="true"
                        />
                      )}
                      <span className={included ? "text-slate-300" : "text-slate-500"}>
                        {feature?.label ?? titleCase(key)}
                        {included ? ` · ${limits[key]} / month` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 border-t border-[#252735] pt-3 text-[11px] text-slate-500">
                {plan === "basic"
                  ? "Job-fit checks, roadmap generation, and AI assistant"
                  : plan === "standard"
                    ? "Adds role suggestions and application drafts"
                    : "Adds resume updates and the highest allowances"}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Annual billing is planned with a {status.annualDiscountPercent}% discount.
          No payment details are collected during the testing period.
        </p>
      </section>
    </div>
  );
}

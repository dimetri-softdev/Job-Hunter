"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Clock3, Loader2, LockKeyhole } from "lucide-react";
import { fetcher } from "@/lib/api";

interface FeatureUsage {
  label: string;
  limit: number | null;
  used: number;
  remaining: number | null;
  included: boolean;
  available: boolean;
  includedFrom: string;
}

interface BillingStatus {
  billingEnabled: boolean;
  checkoutEnabled: boolean;
  checkoutMode: "sandbox" | null;
  currency: string | null;
  annualDiscountPercent: number;
  plan: string | null;
  provider: string | null;
  billingInterval: string | null;
  status: string;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  paymentFailedAt: string | null;
  canceledAt: string | null;
  usagePeriodStartsAt: string;
  features: Record<string, FeatureUsage>;
  plans: Record<string, Record<string, number | null>>;
  prices: Record<string, { monthly: number; annual: number }>;
}

interface CheckoutResponse {
  action: string;
  fields: Record<string, string>;
  mode: "sandbox";
}

const PLAN_ORDER: Record<string, number> = {
  basic: 0,
  starter: 1,
  standard: 2,
  lite: 3,
  premium: 4,
};

const FEATURE_ORDER = [
  "job_fit",
  "roadmap_generation",
  "role_suggestions",
  "application_drafts",
  "interview_prep",
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

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(value);
}

export function BillingOverview() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState<string | null>(null);
  const [checkoutInterval, setCheckoutInterval] = useState<"monthly" | "annual">(
    "monthly",
  );

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

  async function startCheckout(plan: string) {
    setCheckoutError(null);
    setCheckoutPending(plan);
    try {
      const checkout = await fetcher<CheckoutResponse>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan, billingInterval: checkoutInterval }),
      });
      if (
        checkout.mode !== "sandbox" ||
        checkout.action !== "https://sandbox.payfast.co.za/eng/process"
      ) {
        throw new Error("The checkout response did not use the PayFast sandbox.");
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = checkout.action;
      for (const [name, value] of Object.entries(checkout.fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (checkoutLoadError: unknown) {
      setCheckoutError(
        checkoutLoadError instanceof Error
          ? checkoutLoadError.message
          : "Unable to start PayFast sandbox checkout.",
      );
      setCheckoutPending(null);
    }
  }

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
            {!status.checkoutEnabled
              ? "Checkout is not configured. An administrator must grant a tester trial."
              : "Complete sandbox checkout to test the payment flow. Access changes only after PayFast's server-verified notification."}
          </p>
        )}
        {status.checkoutEnabled ? (
          <p className="mt-3 text-xs text-emerald-200">
            Sandbox checkout is enabled. No real charge will be made, and paid
            feature enforcement remains separate.
          </p>
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            Sandbox checkout is not configured. No live PayFast payment mode is
            available in this release.
          </p>
        )}
        {status.provider === "payfast" && (
          <p className="mt-3 text-xs text-slate-400">
            A PayFast subscription is already linked to this account. Contact
            support to make subscription changes.
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
                      ? feature.included
                        ? "Unlimited"
                        : "Not included in this plan"
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
            Monthly AI allowances. Premium includes unlimited monthly usage for
            the listed features.
          </p>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-slate-400">Billing period</span>
          {(["monthly", "annual"] as const).map((interval) => (
            <button
              key={interval}
              type="button"
              aria-pressed={checkoutInterval === interval}
              onClick={() => setCheckoutInterval(interval)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                checkoutInterval === interval
                  ? "border-violet-400/50 bg-violet-400/10 text-violet-100"
                  : "border-[#252735] text-slate-400 hover:text-white"
              }`}
            >
              {interval === "monthly"
                ? "Monthly"
                : `Annual · ${status.annualDiscountPercent}% off`}
            </button>
          ))}
        </div>
        {checkoutError && (
          <p
            role="alert"
            className="mb-3 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-xs text-rose-200"
          >
            {checkoutError}
          </p>
        )}
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
              <p className="mt-1 text-xs text-slate-500">
                {plan === "basic"
                  ? "Free"
                  : status.prices[plan]
                    ? checkoutInterval === "monthly"
                      ? `${formatPrice(status.prices[plan].monthly)} / month`
                      : `${formatPrice(status.prices[plan].annual)} / year`
                    : "Price unavailable"}
              </p>
              <ul className="mt-4 space-y-2">
                {FEATURE_ORDER.map((key) => {
                  const feature = status.features[key];
                  const included =
                    PLAN_ORDER[plan] >=
                    PLAN_ORDER[feature?.includedFrom ?? "basic"];
                  const limit = limits[key];
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
                        {included
                          ? ` · ${limit === null ? "Unlimited" : `${limit} / month`}`
                          : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 border-t border-[#252735] pt-3 text-[11px] text-slate-500">
                {plan === "basic"
                  ? "Free access to core job-fit checks, roadmaps, and the AI assistant"
                  : plan === "starter"
                    ? "Core features with monthly usage limits"
                    : plan === "standard"
                      ? "Adds role suggestions, application drafts, and AI interview practice"
                      : plan === "lite"
                        ? "Adds resume updates and higher monthly allowances"
                        : "Unlimited monthly allowances for normal personal use"}
              </p>
              {plan !== "basic" && status.checkoutEnabled && (
                <button
                  type="button"
                  onClick={() => void startCheckout(plan)}
                  disabled={
                    checkoutPending !== null || status.provider === "payfast"
                  }
                  className="mt-4 w-full rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checkoutPending === plan
                    ? "Opening PayFast…"
                    : status.provider === "payfast"
                      ? "Subscription already active"
                      : "Subscribe in sandbox"}
                </button>
              )}
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Annual billing is {status.annualDiscountPercent}% off. Payments in
          this stage use PayFast sandbox only; no live payment details are
          collected.
        </p>
      </section>
    </div>
  );
}

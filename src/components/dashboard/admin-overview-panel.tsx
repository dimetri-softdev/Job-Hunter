"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, CreditCard, Users } from "lucide-react";
import { fetcher } from "@/lib/api";
import {
  getApiErrorMessage,
  getUserFacingError,
} from "@/lib/user-facing-errors";

interface SubscriptionBucket {
  status: string;
  count: number;
}

interface PlanBucket extends SubscriptionBucket {
  plan: string;
  billingInterval: string;
  provider: string | null;
  providerEnvironment: string | null;
}

interface AdminOverviewData {
  generatedAt: string;
  totalAccounts: number;
  signupsLast7Days: number;
  signupsLast30Days: number;
  signedInLast30Days: number;
  signupTrend: { date: string; count: number }[];
  subscriptionsByStatus: SubscriptionBucket[];
  subscriptionsByPlan: PlanBucket[];
  cancellationsScheduled: number;
  cancellationRequestsPending: number;
  recentAdminActions: {
    actorEmail: string;
    subjectUserId: string | null;
    action: string;
    createdAt: string;
  }[];
}

interface BillingStatus {
  billingEnabled: boolean;
  checkoutEnabled: boolean;
  cancellationEnabled: boolean;
  checkoutMode: "sandbox" | "live" | null;
  prices: Record<string, { monthly: number; annual: number }>;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function AdminOverviewPanel() {
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadOverview() {
      setLoading(true);
      setError(null);
      setBillingError(null);
      try {
        const overviewRequest = fetch("/api/admin/overview", {
            cache: "no-store",
            signal: controller.signal,
          }).then(async (overviewResponse) => {
            const overviewPayload = await readJson(overviewResponse);
            if (!overviewResponse.ok) {
              throw new Error(
                getApiErrorMessage(overviewPayload, overviewResponse.status),
              );
            }
            if (
              !overviewPayload ||
              typeof overviewPayload !== "object" ||
              !("totalAccounts" in overviewPayload) ||
              !("signupTrend" in overviewPayload) ||
              !Array.isArray(overviewPayload.signupTrend)
            ) {
              throw new Error("The server returned unexpected overview data.");
            }
            return overviewPayload as AdminOverviewData;
          });
        const [overviewResult, billingResult] = await Promise.allSettled([
          overviewRequest,
          fetcher<BillingStatus>("/billing/status", {
            signal: controller.signal,
          }),
        ]);
        if (overviewResult.status === "rejected") {
          throw overviewResult.reason;
        }
        setOverview(overviewResult.value);
        if (billingResult.status === "fulfilled") {
          setBilling(billingResult.value);
        } else {
          setBilling(null);
          setBillingError(
            getUserFacingError(
              billingResult.reason,
              "Payment operations are unavailable.",
            ),
          );
        }
      } catch (loadError: unknown) {
        if (controller.signal.aborted) return;
        setError(getUserFacingError(loadError, "Unable to load the overview."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadOverview();
    return () => controller.abort();
  }, []);

  const estimatedMrr = useMemo(() => {
    if (!overview || !billing) return null;
    return overview.subscriptionsByPlan.reduce((total, subscription) => {
      if (
        subscription.status !== "ACTIVE" ||
        subscription.provider !== "payfast" ||
        subscription.providerEnvironment !== "live"
      ) {
        return total;
      }
      const price = billing.prices[subscription.plan.toLowerCase()]?.[
        subscription.billingInterval.toLowerCase() === "annual"
          ? "annual"
          : "monthly"
      ];
      if (typeof price !== "number" || !Number.isFinite(price)) return total;
      return total + price / (subscription.billingInterval.toLowerCase() === "annual" ? 12 : 1)
        * subscription.count;
    }, 0);
  }, [billing, overview]);

  const activeSubscriptions =
    overview?.subscriptionsByPlan.reduce(
      (count, subscription) =>
        subscription.status === "ACTIVE" &&
        subscription.provider === "payfast" &&
        subscription.providerEnvironment === "live"
          ? count + subscription.count
          : count,
      0,
    ) ?? 0;
  const trials =
    overview?.subscriptionsByStatus.find((row) => row.status === "TRIALING")
      ?.count ?? 0;
  const maxSignupCount = Math.max(
    1,
    ...(overview?.signupTrend.map((day) => day.count) ?? []),
  );

  return (
    <section className="space-y-5">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200"
        >
          {error}
        </p>
      )}
      {loading && !overview ? (
        <p className="py-8 text-sm text-slate-400">Loading admin overview…</p>
      ) : overview ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewStat
              icon={<Users className="size-4" aria-hidden="true" />}
              label="Total accounts"
              value={overview.totalAccounts}
              detail={`${overview.signupsLast30Days} joined in 30 days`}
            />
            <OverviewStat
              icon={<CalendarDays className="size-4" aria-hidden="true" />}
              label="New accounts"
              value={overview.signupsLast7Days}
              detail="Last 7 days"
            />
            <OverviewStat
              icon={<Activity className="size-4" aria-hidden="true" />}
              label="Recently signed in"
              value={overview.signedInLast30Days}
              detail="At least one sign-in in 30 days"
            />
            <OverviewStat
              icon={<CreditCard className="size-4" aria-hidden="true" />}
              label="Live active subscriptions"
              value={activeSubscriptions}
              detail={`${trials} trial${trials === 1 ? "" : "s"} currently active · sandbox rows shown separately`}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Account growth
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    New accounts per day · last 30 days
                  </p>
                </div>
                <span className="text-sm font-semibold text-violet-200">
                  {overview.signupsLast30Days} total
                </span>
              </div>
              <div
                className="mt-6 grid h-36 grid-cols-[repeat(30,minmax(0,1fr))] items-end gap-1"
                role="img"
                aria-label={`Daily signups over the last 30 days. ${overview.signupsLast30Days} new accounts.`}
              >
                {overview.signupTrend.map((day) => (
                  <div
                    key={day.date}
                    className="min-w-0 rounded-t bg-violet-400/80"
                    title={`${formatDate(day.date)}: ${day.count} signups`}
                    style={{
                      height: day.count
                        ? `${Math.max(4, (day.count / maxSignupCount) * 100)}%`
                        : "0%",
                    }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-slate-600">
                <span>{overview.signupTrend[0] ? formatDate(overview.signupTrend[0].date) : ""}</span>
                <span>{overview.signupTrend[29] ? formatDate(overview.signupTrend[29].date) : ""}</span>
              </div>
            </section>

            <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-5">
              <h2 className="text-sm font-semibold text-white">Billing operations</h2>
              <p className="mt-1 text-xs text-slate-500">
                Read-only status from the billing service
              </p>
              {billingError && (
                <p className="mt-2 text-xs text-amber-200">{billingError}</p>
              )}
              <dl className="mt-4 space-y-3 text-sm">
                <BillingRow
                  label="PayFast checkout"
                  value={
                    billing?.checkoutEnabled
                      ? `${label(billing.checkoutMode ?? "unknown")} configured`
                      : "Not configured"
                }
                />
                <BillingRow
                  label="Paid-access enforcement"
                  value={billing ? (billing.billingEnabled ? "On" : "Off · pilot access") : "Unavailable"}
                />
                <BillingRow
                  label="Cancellation operations"
                  value={billing ? (billing.cancellationEnabled ? "Enabled" : "Disabled") : "Unavailable"}
                />
                <BillingRow
                  label="Scheduled cancellations"
                  value={String(overview.cancellationsScheduled)}
                />
                <BillingRow
                  label="Cancellation requests pending"
                  value={String(overview.cancellationRequestsPending)}
                />
                <BillingRow
                  label="Estimated monthly recurring value"
                  value={estimatedMrr === null ? "Unavailable" : formatCurrency(estimatedMrr)}
                />
              </dl>
              <p className="mt-4 border-t border-[#1f212d] pt-3 text-[11px] leading-5 text-slate-500">
                MRR is an estimate from active live PayFast plans; annual plans
                are divided by 12. Sandbox records are excluded. It is not a
                payment ledger and excludes refunds, fees, discounts, and failed
                collections.
              </p>
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-5">
              <h2 className="text-sm font-semibold text-white">
                Subscription status
              </h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {overview.subscriptionsByStatus.length ? (
                  overview.subscriptionsByStatus.map((row) => (
                    <div
                      key={row.status}
                      className="flex items-center justify-between rounded-lg border border-[#252735] px-3 py-2"
                    >
                      <span className="text-xs text-slate-400">{label(row.status)}</span>
                      <span className="text-sm font-semibold text-white">{row.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No subscriptions recorded.</p>
                )}
              </div>
            </section>
            <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-5">
              <h2 className="text-sm font-semibold text-white">Recent admin actions</h2>
              {overview.recentAdminActions.length ? (
                <ul className="mt-3 divide-y divide-[#1f212d]">
                  {overview.recentAdminActions.map((action, index) => (
                    <li
                      key={`${action.createdAt}-${action.action}-${index}`}
                      className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-xs font-medium text-slate-200">
                          {label(action.action)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {action.actorEmail}
                          {action.subjectUserId
                            ? ` · account ${action.subjectUserId.slice(0, 8)}…`
                            : ""}
                        </p>
                      </div>
                      <time className="text-[11px] text-slate-600">
                        {formatDate(action.createdAt)}
                      </time>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-slate-500">No admin actions recorded.</p>
              )}
            </section>
          </div>
          <p className="text-right text-[11px] text-slate-600">
            Metrics updated {formatDate(overview.generatedAt)}
          </p>
        </>
      ) : null}
    </section>
  );
}

function OverviewStat({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <article className="rounded-xl border border-[#1f212d] bg-[#12131a] p-4">
      <div className="flex items-center gap-2 text-violet-300">
        {icon}
        <p className="text-xs font-medium text-slate-400">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{detail}</p>
    </article>
  );
}

function BillingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-right text-xs font-medium text-slate-200">{value}</dd>
    </div>
  );
}

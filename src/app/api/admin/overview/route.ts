import { adminJson, getSupabaseAdminClient, requireAdmin } from "@/lib/admin-auth";
import { getAdminSubscriptionStatus } from "@/lib/admin-subscriptions";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const USERS_PER_PAGE = 1000;
const MAX_USER_PAGES = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return adminJson(
      { error: "User management is not configured on the server." },
      503,
    );
  }

  const now = new Date();
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const signupDays = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today.getTime() - (29 - index) * DAY_MS);
    return { date: date.toISOString().slice(0, 10), count: 0 };
  });
  const signupCounts = new Map(signupDays.map((day) => [day.date, day]));
  const weekStart = now.getTime() - 7 * DAY_MS;
  const monthStart = now.getTime() - 30 * DAY_MS;
  let totalAccounts = 0;
  let signupsLast7Days = 0;
  let signupsLast30Days = 0;
  let signedInLast30Days = 0;

  for (let page = 1; page <= MAX_USER_PAGES + 1; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: USERS_PER_PAGE,
    });
    if (error) {
      console.error("Admin overview account aggregation failed", error);
      return adminJson(
        { error: "Unable to load account metrics from the identity provider." },
        502,
      );
    }

    if (page > MAX_USER_PAGES && data.users.length > 0) {
      return adminJson(
        {
          error:
            "Account metrics exceed the current aggregation limit. A searchable account index is required.",
        },
        503,
      );
    }

    totalAccounts += data.users.length;
    for (const user of data.users) {
      const createdAt = new Date(user.created_at).getTime();
      if (Number.isFinite(createdAt)) {
        if (createdAt >= weekStart && createdAt <= now.getTime()) {
          signupsLast7Days += 1;
        }
        if (createdAt >= monthStart && createdAt <= now.getTime()) {
          signupsLast30Days += 1;
        }
        const day = signupCounts.get(
          new Date(createdAt).toISOString().slice(0, 10),
        );
        if (day) day.count += 1;
      }

      const lastSignInAt = user.last_sign_in_at
        ? new Date(user.last_sign_in_at).getTime()
        : Number.NaN;
      if (
        Number.isFinite(lastSignInAt) &&
        lastSignInAt >= monthStart &&
        lastSignInAt <= now.getTime()
      ) {
        signedInLast30Days += 1;
      }
    }

    if (data.users.length < USERS_PER_PAGE) break;
  }

  const [
    subscriptions,
    cancellationsScheduled,
    cancellationRequestsPending,
    recentAdminActions,
  ] = await Promise.all([
    db.userSubscription.findMany({
      select: {
        plan: true,
        status: true,
        billingInterval: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        paymentFailedAt: true,
      },
    }),
    db.userSubscription.count({
      where: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: { gt: now },
      },
    }),
    db.userSubscription.count({
      where: {
        cancellationRequestedAt: { not: null },
        cancellationRequestSentAt: null,
        currentPeriodEnd: { gt: now },
      },
    }),
    db.billingAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        actorEmail: true,
        subjectUserId: true,
        action: true,
        createdAt: true,
      },
    }),
  ]);
  const statusCounts = new Map<string, number>();
  const planCounts = new Map<string, {
    plan: string;
    billingInterval: string;
    status: string;
    count: number;
  }>();
  for (const subscription of subscriptions) {
    const status =
      getAdminSubscriptionStatus(subscription, now) ?? subscription.status;
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    const key = `${subscription.plan}\u0000${subscription.billingInterval}\u0000${status}`;
    const bucket = planCounts.get(key);
    if (bucket) {
      bucket.count += 1;
    } else {
      planCounts.set(key, {
        plan: subscription.plan,
        billingInterval: subscription.billingInterval,
        status,
        count: 1,
      });
    }
  }

  return adminJson({
    generatedAt: now.toISOString(),
    totalAccounts,
    signupsLast7Days,
    signupsLast30Days,
    signedInLast30Days,
    signupTrend: signupDays,
    subscriptionsByStatus: [...statusCounts].map(([status, count]) => ({
      status,
      count,
    })),
    subscriptionsByPlan: [...planCounts.values()],
    cancellationsScheduled,
    cancellationRequestsPending,
    recentAdminActions,
  });
}

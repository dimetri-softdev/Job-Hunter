import { adminJson, getSupabaseAdminClient, isBootstrapAdmin, requireAdmin } from "@/lib/admin-auth";
import { getAdminSubscriptionStatus } from "@/lib/admin-subscriptions";
import { db } from "@/lib/db";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export const runtime = "nodejs";
const PAGE_SIZE = 25;
const USERS_PER_PAGE = 1000;
const MAX_USER_PAGES = 100;
const ALLOWED_STATUSES = new Set([
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "CANCELED",
  "EXPIRED",
  "NONE",
]);

export async function GET(request: Request) {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return adminJson(
      { error: "User management is not configured on the server." },
      503,
    );
  }
  const params = new URL(request.url).searchParams;
  const page = Number(params.get("page") ?? "1");
  const search = params.get("q")?.trim().toLowerCase() ?? "";
  const statusFilter = params.get("status")?.trim().toUpperCase() ?? "";
  const planFilter = params.get("plan")?.trim().toLowerCase() ?? "";
  const adminFilter = params.get("admin") ?? "";
  const suspendedFilter = params.get("suspended") ?? "";
  if (!Number.isSafeInteger(page) || page < 1 || page > 10_000) {
    return adminJson({ error: "Invalid page number." }, 400);
  }
  if (search.length > 200) {
    return adminJson({ error: "Search text must be 200 characters or fewer." }, 400);
  }
  if (statusFilter && !ALLOWED_STATUSES.has(statusFilter)) {
    return adminJson({ error: "Invalid subscription status filter." }, 400);
  }
  if (planFilter && !/^[a-z0-9_-]{1,40}$/.test(planFilter)) {
    return adminJson({ error: "Invalid subscription plan filter." }, 400);
  }
  if (adminFilter && adminFilter !== "true" && adminFilter !== "false") {
    return adminJson({ error: "Invalid administrator filter." }, 400);
  }
  if (suspendedFilter && suspendedFilter !== "true" && suspendedFilter !== "false") {
    return adminJson({ error: "Invalid suspension filter." }, 400);
  }

  const identityUsers: SupabaseUser[] = [];
  for (let userPage = 1; userPage <= MAX_USER_PAGES + 1; userPage += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: userPage,
      perPage: USERS_PER_PAGE,
    });
    if (error) {
      console.error("Admin user listing failed", error);
      return adminJson(
        { error: "Unable to load accounts from the identity provider." },
        502,
      );
    }
    if (userPage > MAX_USER_PAGES && data.users.length > 0) {
      return adminJson(
        {
          error:
            "The account directory exceeds the current search limit. A searchable account index is required.",
        },
        503,
      );
    }
    identityUsers.push(...data.users);
    if (data.users.length < USERS_PER_PAGE) break;
  }

  const [adminRecords, subscriptions] = await Promise.all([
    db.adminAccess.findMany({ select: { userId: true, email: true } }),
    db.userSubscription.findMany({
      select: {
        userId: true,
        plan: true,
        status: true,
        billingInterval: true,
        provider: true,
        providerEnvironment: true,
        trialEndsAt: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        paymentFailedAt: true,
        canceledAt: true,
        cancelAtPeriodEnd: true,
        cancellationRequestedAt: true,
        cancellationRequestSentAt: true,
      },
    }),
  ]);
  const adminIds = new Set(adminRecords.map((record) => record.userId));
  const allAdminEmails = new Set([
    ...adminRecords.map((record) => record.email.toLowerCase()),
    ...(process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  ]);
  const now = new Date();
  const subscriptionByUserId = new Map(
    subscriptions.map((subscription) => {
      return [
        subscription.userId,
        {
          ...subscription,
          status: getAdminSubscriptionStatus(subscription, now) ?? "EXPIRED",
        },
      ];
    }),
  );
  const allUsers = identityUsers.map((user) => {
    const subscription = subscriptionByUserId.get(user.id) ?? null;
    return {
      id: user.id,
      email: user.email ?? "",
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      bannedUntil: user.banned_until ?? null,
      isSuspended:
        user.banned_until != null &&
        new Date(user.banned_until).getTime() > Date.now(),
      isAdmin:
        adminIds.has(user.id) || isBootstrapAdmin(user.email),
      isBootstrapAdmin: isBootstrapAdmin(user.email),
      subscription,
    };
  });
  allUsers.sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  const filteredUsers = allUsers.filter((user) => {
    if (
      search &&
      !user.email.toLowerCase().includes(search) &&
      !user.id.toLowerCase().includes(search)
    ) {
      return false;
    }
    if (statusFilter && (user.subscription?.status ?? "NONE") !== statusFilter) {
      return false;
    }
    if (
      planFilter &&
      user.subscription?.plan.toLowerCase() !== planFilter
    ) {
      return false;
    }
    if (adminFilter && user.isAdmin !== (adminFilter === "true")) return false;
    if (
      suspendedFilter &&
      user.isSuspended !== (suspendedFilter === "true")
    ) {
      return false;
    }
    return true;
  });
  const pageUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const usageCounts = pageUsers.length
    ? await db.billingUsageEvent.groupBy({
        by: ["userId"],
        where: {
          userId: { in: pageUsers.map((user) => user.id) },
          status: "USED",
          createdAt: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _count: { _all: true },
      })
    : [];
  const usageByUserId = new Map(
    usageCounts.map((usage) => [usage.userId, usage._count._all]),
  );
  const users = pageUsers.map((user) => ({
    ...user,
    featureUsesLast30Days: usageByUserId.get(user.id) ?? 0,
  }));

  return adminJson({
    users,
    page,
    pageSize: PAGE_SIZE,
    total: filteredUsers.length,
    hasMore: page * PAGE_SIZE < filteredUsers.length,
    totalAdmins: allAdminEmails.size,
    currentUserId: authorization.user.id,
  });
}

export async function PATCH(request: Request) {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return adminJson(
      { error: "User management is not configured on the server." },
      503,
    );
  }
  const actorEmail = authorization.user.email?.trim().toLowerCase();
  if (!actorEmail) {
    return adminJson({ error: "The administrator account has no email address." }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return adminJson({ error: "Request body must be valid JSON." }, 400);
  }

  if (!body || typeof body !== "object") {
    return adminJson({ error: "Invalid account update." }, 400);
  }
  const input = body as { userId?: unknown; suspended?: unknown };
  if (
    typeof input.userId !== "string" ||
    !/^[0-9a-f-]{20,64}$/i.test(input.userId) ||
    typeof input.suspended !== "boolean"
  ) {
    return adminJson({ error: "Provide a valid account and suspension status." }, 400);
  }
  if (input.userId === authorization.user.id) {
    return adminJson({ error: "You cannot suspend your own account." }, 400);
  }

  const { data: targetResult, error: targetError } =
    await supabaseAdmin.auth.admin.getUserById(input.userId);
  if (targetError || !targetResult.user) {
    return adminJson({ error: "Account not found." }, 404);
  }
  if (
    isBootstrapAdmin(targetResult.user.email) ||
    (await db.adminAccess.findUnique({
      where: { userId: input.userId },
      select: { userId: true },
    }))
  ) {
    return adminJson(
      { error: "Remove administrator access before suspending this account." },
      409,
    );
  }

  const action = input.suspended ? "ACCOUNT_SUSPENSION" : "ACCOUNT_UNSUSPENSION";
  let auditRecordId: string;
  try {
    const auditRecord = await db.billingAuditLog.create({
      data: {
        actorId: authorization.user.id,
        actorEmail,
        subjectUserId: input.userId,
        action: `${action}_REQUESTED`,
        details: {},
      },
      select: { id: true },
    });
    auditRecordId = auditRecord.id;
  } catch (auditError: unknown) {
    console.error("Admin account update request audit failed", auditError);
    return adminJson(
      { error: "The account update could not be audited, so no change was made." },
      500,
    );
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    input.userId,
    { ban_duration: input.suspended ? "876000h" : "none" },
  );
  if (error) {
    console.error("Admin account suspension update failed", error);
    try {
      await db.billingAuditLog.update({
        where: { id: auditRecordId },
        data: {
          action: `${action}_FAILED`,
          details: {},
        },
      });
    } catch (auditError: unknown) {
      console.error("Admin account update failure audit failed", auditError);
    }
    return adminJson({ error: "Unable to update this account." }, 502);
  }

  try {
    await db.billingAuditLog.update({
      where: { id: auditRecordId },
      data: {
        action: input.suspended ? "ACCOUNT_SUSPENDED" : "ACCOUNT_UNSUSPENDED",
        details: {
          bannedUntil: data.user.banned_until ?? null,
        },
      },
    });
  } catch (auditError: unknown) {
    console.error("Admin account update audit failed", auditError);
    return adminJson(
      {
        error:
          "The account changed, but its audit record remains marked as requested.",
      },
      500,
    );
  }

  return adminJson({
    id: data.user.id,
    bannedUntil: data.user.banned_until ?? null,
  });
}

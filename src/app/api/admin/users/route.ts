import { adminJson, getSupabaseAdminClient, isBootstrapAdmin, requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const PAGE_SIZE = 100;

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
  if (!Number.isSafeInteger(page) || page < 1 || page > 10_000) {
    return adminJson({ error: "Invalid page number." }, 400);
  }
  if (search.length > 200) {
    return adminJson({ error: "Search text must be 200 characters or fewer." }, 400);
  }

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page,
    perPage: PAGE_SIZE,
  });
  if (error) {
    console.error("Admin user listing failed", error);
    return adminJson({ error: "Unable to load accounts from the identity provider." }, 502);
  }

  const adminRecords = await db.adminAccess.findMany({
    select: { userId: true, email: true },
  });
  const adminIds = new Set(adminRecords.map((record) => record.userId));
  const allAdminEmails = new Set([
    ...adminRecords.map((record) => record.email.toLowerCase()),
    ...(process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  ]);
  const pageUsers = data.users
    .filter((user) => {
      if (!search) return true;
      return (
        user.email?.toLowerCase().includes(search) ||
        user.id.toLowerCase().includes(search)
      );
    })
    .map((user) => ({
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
    }));
  const subscriptions = pageUsers.length
    ? await db.userSubscription.findMany({
        where: { userId: { in: pageUsers.map((user) => user.id) } },
        select: {
          userId: true,
          plan: true,
          status: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
        },
      })
    : [];
  const now = Date.now();
  const subscriptionByUserId = new Map(
    subscriptions.map((subscription) => {
      const trialExpired =
        subscription.status === "TRIALING" &&
        subscription.trialEndsAt !== null &&
        subscription.trialEndsAt.getTime() <= now;
      return [
        subscription.userId,
        {
          ...subscription,
          status: trialExpired ? "EXPIRED" : subscription.status,
        },
      ];
    }),
  );
  const users = pageUsers.map((user) => ({
    ...user,
    subscription: subscriptionByUserId.get(user.id) ?? null,
  }));

  return adminJson({
    users,
    page,
    pageSize: PAGE_SIZE,
    hasMore: data.users.length === PAGE_SIZE,
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

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    input.userId,
    { ban_duration: input.suspended ? "876000h" : "none" },
  );
  if (error) {
    console.error("Admin account suspension update failed", error);
    return adminJson({ error: "Unable to update this account." }, 502);
  }

  return adminJson({
    id: data.user.id,
    bannedUntil: data.user.banned_until ?? null,
  });
}

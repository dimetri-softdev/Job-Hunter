import {
  adminJson,
  getSupabaseAdminClient,
  isBootstrapAdmin,
  requireAdmin,
} from "@/lib/admin-auth";
import { getAdminSubscriptionStatus } from "@/lib/admin-subscriptions";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return adminJson(
      { error: "User management is not configured on the server." },
      503,
    );
  }

  const { userId } = await params;
  if (!userId || !/^[0-9a-f-]{20,64}$/i.test(userId)) {
    return adminJson({ error: "Invalid account ID." }, 400);
  }

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data.user) {
    if (error?.status !== 404) {
      console.error("Admin account detail lookup failed", error);
    }
    return adminJson({ error: "Account not found." }, 404);
  }

  const now = new Date();
  const [
    profile,
    subscription,
    applicationCount,
    roadmapCount,
    usage,
    featureUsage,
    recentAdminActions,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    }),
    db.userSubscription.findUnique({
      where: { userId },
      select: {
        plan: true,
        status: true,
        billingInterval: true,
        provider: true,
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
    db.application.count({ where: { userId } }),
    db.roadmap.count({ where: { userId } }),
    db.billingUsageEvent.aggregate({
      where: { userId, status: "USED" },
      _count: { _all: true },
      _min: { createdAt: true },
      _max: { createdAt: true },
    }),
    db.billingUsageEvent.groupBy({
      by: ["feature"],
      where: {
        userId,
        status: "USED",
        createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
      _count: { _all: true },
    }),
    db.billingAuditLog.findMany({
      where: { subjectUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        actorEmail: true,
        action: true,
        createdAt: true,
      },
    }),
  ]);
  const effectiveSubscription = subscription
    ? {
        ...subscription,
        status: getAdminSubscriptionStatus(subscription, now) ?? "EXPIRED",
      }
    : null;

  return adminJson({
    account: {
      id: data.user.id,
      email: data.user.email ?? "",
      createdAt: data.user.created_at,
      localProfileCreatedAt: profile?.createdAt.toISOString() ?? null,
      lastSignInAt: data.user.last_sign_in_at ?? null,
      bannedUntil: data.user.banned_until ?? null,
      isSuspended:
        data.user.banned_until != null &&
        new Date(data.user.banned_until).getTime() > now.getTime(),
    },
    subscription: effectiveSubscription,
    usage: {
      featureUsesTotal: usage._count._all,
      firstFeatureUseAt: usage._min.createdAt?.toISOString() ?? null,
      lastFeatureUseAt: usage._max.createdAt?.toISOString() ?? null,
      featureUsesLast30Days: featureUsage.map((item) => ({
        feature: item.feature,
        count: item._count._all,
      })),
      trackedApplications: applicationCount,
      savedRoadmaps: roadmapCount,
    },
    recentAdminActions,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return adminJson(
      { error: "User management is not configured on the server." },
      503,
    );
  }

  const { userId } = await params;
  if (!userId || !/^[0-9a-f-]{20,64}$/i.test(userId)) {
    return adminJson({ error: "Invalid account ID." }, 400);
  }
  if (userId === authorization.user.id) {
    return adminJson({ error: "You cannot delete your own account." }, 400);
  }
  const actorEmail = authorization.user.email?.trim().toLowerCase();
  if (!actorEmail) {
    return adminJson({ error: "The administrator account has no email address." }, 400);
  }

  const existingAdmin = await db.adminAccess.findUnique({
    where: { userId },
    select: { userId: true },
  });
  if (existingAdmin) {
    return adminJson(
      { error: "Remove admin access before deleting this account." },
      409,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return adminJson({ error: "Confirm the account email to continue." }, 400);
  }
  if (!body || typeof body !== "object" || !("confirmEmail" in body)) {
    return adminJson({ error: "Confirm the account email to continue." }, 400);
  }
  const confirmEmail = body.confirmEmail;
  if (typeof confirmEmail !== "string") {
    return adminJson({ error: "Invalid email confirmation." }, 400);
  }

  const { data: targetData, error: targetError } =
    await supabaseAdmin.auth.admin.getUserById(userId);
  let targetEmail = targetData.user?.email?.trim().toLowerCase() ?? null;

  if (!targetError && targetData.user) {
    if (isBootstrapAdmin(targetEmail)) {
      return adminJson({ error: "Protected bootstrap admin accounts cannot be deleted here." }, 409);
    }
    if (!targetEmail || confirmEmail.trim().toLowerCase() !== targetEmail) {
      return adminJson({ error: "The confirmation email does not match this account." }, 400);
    }
  } else if (targetError?.status === 404) {
    const existingProfile = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (existingProfile && isBootstrapAdmin(existingProfile.email)) {
      return adminJson({ error: "Protected bootstrap admin accounts cannot be deleted here." }, 409);
    }
    if (
      !existingProfile ||
      existingProfile.email.trim().toLowerCase() !==
        confirmEmail.trim().toLowerCase()
    ) {
      return adminJson({ error: "Account not found or email confirmation does not match." }, 404);
    }
    targetEmail = existingProfile.email.trim().toLowerCase();
  } else {
    console.error("Supabase account lookup failed", targetError);
    return adminJson({ error: "Unable to verify the account with the identity provider." }, 502);
  }

  let auditRecordId: string;
  try {
    const auditRecord = await db.billingAuditLog.create({
      data: {
        actorId: authorization.user.id,
        actorEmail,
        subjectUserId: userId,
        action: "ACCOUNT_DELETION_REQUESTED",
        details: { email: targetEmail },
      },
      select: { id: true },
    });
    auditRecordId = auditRecord.id;
  } catch (auditError: unknown) {
    console.error("Admin account deletion request audit failed", auditError);
    return adminJson(
      { error: "The deletion request could not be audited, so no account was deleted." },
      500,
    );
  }

  if (!targetError && targetData.user) {
    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("Supabase account deletion failed", deleteAuthError);
      return adminJson({ error: "The account could not be deleted from the identity provider." }, 502);
    }
  }

  try {
    await db.user.deleteMany({ where: { id: userId } });
  } catch (error: unknown) {
    console.error("App data cleanup failed after account deletion", {
      userId,
      error,
    });
    return adminJson(
      {
        error:
          "The identity was deleted, but app data cleanup failed. Retry this same deletion with the account email to finish cleanup.",
      },
      500,
    );
  }

  try {
    await db.billingAuditLog.update({
      where: { id: auditRecordId },
      data: {
        action: "ACCOUNT_DELETED",
        details: { email: targetEmail },
      },
    });
  } catch (auditError: unknown) {
    console.error("Admin account deletion audit failed", auditError);
    return adminJson(
      {
        error:
          "The account was deleted, but its audit record remains marked as requested.",
      },
      500,
    );
  }

  return adminJson({ deleted: true });
}

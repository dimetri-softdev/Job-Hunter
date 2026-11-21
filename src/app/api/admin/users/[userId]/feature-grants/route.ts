import { Prisma } from "@prisma/client";
import {
  adminJson,
  getSupabaseAdminClient,
  requireAdmin,
} from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isBillingFeatureKey } from "@/lib/billing-features";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  const { userId } = await params;
  if (!userId || !/^[0-9a-f-]{20,64}$/i.test(userId)) {
    return adminJson({ error: "Invalid account ID." }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return adminJson({ error: "Request body must be valid JSON." }, 400);
  }
  if (!body || typeof body !== "object") {
    return adminJson({ error: "Provide feature grants and a duration." }, 400);
  }

  const input = body as { features?: unknown; durationDays?: unknown };
  if (
    !Array.isArray(input.features) ||
    input.features.length < 1 ||
    input.features.length > 7 ||
    !input.features.every(isBillingFeatureKey) ||
    new Set(input.features).size !== input.features.length
  ) {
    return adminJson({ error: "Choose one or more valid features without duplicates." }, 400);
  }
  const features = input.features.filter(isBillingFeatureKey);
  if (
    typeof input.durationDays !== "number" ||
    !Number.isInteger(input.durationDays) ||
    input.durationDays < 1 ||
    input.durationDays > 365
  ) {
    return adminJson({ error: "Duration must be a whole number from 1 to 365 days." }, 400);
  }

  const actorEmail = authorization.user.email?.trim().toLowerCase();
  if (!actorEmail) {
    return adminJson({ error: "The administrator account has no email address." }, 400);
  }

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return adminJson(
      { error: "User management is not configured on the server." },
      503,
    );
  }
  const { data: targetResult, error: targetError } =
    await supabaseAdmin.auth.admin.getUserById(userId);
  if (targetError || !targetResult.user?.email) {
    if (targetError && targetError.status !== 404) {
      console.error("Temporary feature grant account lookup failed", targetError);
      return adminJson({ error: "Unable to verify this account." }, 502);
    }
    return adminJson({ error: "Account not found or has no email address." }, 404);
  }

  const existingUser = await db.user.findFirst({
    where: { email: { equals: targetResult.user.email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existingUser && existingUser.id !== userId) {
    return adminJson(
      { error: "This email is linked to another account. Have the user sign in before granting access." },
      409,
    );
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + input.durationDays * 24 * 60 * 60 * 1000,
  );
  const metadata = targetResult.user.user_metadata;
  const name =
    metadata && typeof metadata.full_name === "string"
      ? metadata.full_name
      : null;

  try {
    await db.$transaction([
      db.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: targetResult.user.email,
          name,
        },
        update: { email: targetResult.user.email },
      }),
      db.userFeatureGrant.createMany({
        data: features.map((feature) => ({
          userId,
          feature,
          expiresAt,
        })),
      }),
      db.billingAuditLog.create({
        data: {
          actorId: authorization.user.id,
          actorEmail,
          subjectUserId: userId,
          action: "TEMPORARY_FEATURE_ACCESS_GRANTED",
          details: {
            features,
            durationDays: input.durationDays,
            expiresAt: expiresAt.toISOString(),
          },
        },
      }),
    ]);
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return adminJson(
        { error: "This account is linked to a different profile. Have the user sign in before granting access." },
        409,
      );
    }
    console.error("Temporary feature grant failed", error);
    return adminJson({ error: "Unable to grant temporary feature access." }, 500);
  }

  return adminJson({
    features,
    durationDays: input.durationDays,
    expiresAt: expiresAt.toISOString(),
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  const { userId } = await params;
  if (!userId || !/^[0-9a-f-]{20,64}$/i.test(userId)) {
    return adminJson({ error: "Invalid account ID." }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return adminJson({ error: "Request body must be valid JSON." }, 400);
  }
  const grantId =
    body && typeof body === "object" && "grantId" in body
      ? body.grantId
      : null;
  if (typeof grantId !== "string" || !/^[0-9a-f-]{20,64}$/i.test(grantId)) {
    return adminJson({ error: "Provide a valid feature grant ID." }, 400);
  }

  const actorEmail = authorization.user.email?.trim().toLowerCase();
  if (!actorEmail) {
    return adminJson({ error: "The administrator account has no email address." }, 400);
  }

  const now = new Date();
  let result: boolean;
  try {
    result = await db.$transaction(async (transaction) => {
      const grant = await transaction.userFeatureGrant.findFirst({
        where: { id: grantId, userId },
        select: { feature: true, expiresAt: true, revokedAt: true },
      });
      if (!grant || grant.revokedAt || grant.expiresAt <= now) return false;

      const updated = await transaction.userFeatureGrant.updateMany({
        where: {
          id: grantId,
          userId,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: now },
      });
      if (!updated.count) return false;

      await transaction.billingAuditLog.create({
        data: {
          actorId: authorization.user.id,
          actorEmail,
          subjectUserId: userId,
          action: "TEMPORARY_FEATURE_ACCESS_REVOKED",
          details: {
            feature: grant.feature,
            expiresAt: grant.expiresAt.toISOString(),
          },
        },
      });
      return true;
    });
  } catch (error: unknown) {
    console.error("Temporary feature grant revocation failed", error);
    return adminJson({ error: "Unable to revoke temporary feature access." }, 500);
  }

  if (!result) {
    return adminJson({ error: "This feature grant is no longer active." }, 409);
  }
  return adminJson({ revoked: true });
}

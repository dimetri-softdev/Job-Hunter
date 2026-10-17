import { Prisma } from "@prisma/client";
import {
  adminJson,
  getSupabaseAdminClient,
  requireAdmin,
} from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const TRIAL_LENGTH_DAYS = 14;

export async function POST(request: Request) {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return adminJson({ error: "Request body must be valid JSON." }, 400);
  }

  const userId =
    body && typeof body === "object" && "userId" in body
      ? body.userId
      : null;
  if (typeof userId !== "string" || !/^[0-9a-f-]{20,64}$/i.test(userId)) {
    return adminJson({ error: "Provide a valid account ID." }, 400);
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
  if (targetError || !targetResult.user || !targetResult.user.email) {
    return adminJson({ error: "Account not found or has no email address." }, 404);
  }

  const existingSubscription = await db.userSubscription.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (existingSubscription) {
    return adminJson(
      { error: "A trial or subscription has already been assigned to this account." },
      409,
    );
  }

  const existingUser = await db.user.findFirst({
    where: { email: { equals: targetResult.user.email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existingUser && existingUser.id !== userId) {
    return adminJson(
      { error: "This email is linked to another account. Have the user sign in before granting a trial." },
      409,
    );
  }

  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + TRIAL_LENGTH_DAYS * 24 * 60 * 60 * 1000);
  const actorEmail = authorization.user.email?.trim().toLowerCase();
  if (!actorEmail) {
    return adminJson({ error: "The administrator account has no email address." }, 400);
  }
  const metadata = targetResult.user.user_metadata;
  const name =
    metadata && typeof metadata.full_name === "string"
      ? metadata.full_name
      : null;

  try {
    const [, subscription] = await db.$transaction([
      db.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: targetResult.user.email,
          name,
        },
        update: {
          email: targetResult.user.email,
        },
      }),
      db.userSubscription.create({
        data: {
          userId,
          plan: "standard",
          status: "TRIALING",
          currentPeriodStart: now,
          currentPeriodEnd: trialEndsAt,
          trialEndsAt,
        },
      }),
      db.billingAuditLog.create({
        data: {
          actorId: authorization.user.id,
          actorEmail,
          subjectUserId: userId,
          action: "STANDARD_TRIAL_GRANTED",
          details: { durationDays: TRIAL_LENGTH_DAYS },
        },
      }),
    ]);
    return adminJson({ subscription });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return adminJson(
        { error: "A trial or subscription has already been assigned to this account." },
        409,
      );
    }
    console.error("Admin trial grant failed", error);
    return adminJson({ error: "Unable to grant this trial." }, 500);
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return adminJson({ error: "Request body must be valid JSON." }, 400);
  }

  const userId =
    body && typeof body === "object" && "userId" in body
      ? body.userId
      : null;
  if (typeof userId !== "string" || !/^[0-9a-f-]{20,64}$/i.test(userId)) {
    return adminJson({ error: "Provide a valid account ID." }, 400);
  }

  const subscription = await db.userSubscription.findUnique({
    where: { userId },
    select: { id: true, status: true, trialEndsAt: true },
  });
  if (!subscription || subscription.status !== "TRIALING") {
    return adminJson({ error: "No active administrator-granted trial was found." }, 409);
  }

  const actorEmail = authorization.user.email?.trim().toLowerCase();
  if (!actorEmail) {
    return adminJson({ error: "The administrator account has no email address." }, 400);
  }
  const now = new Date();

  await db.$transaction([
    db.userSubscription.update({
      where: { userId },
      data: {
        status: "EXPIRED",
        trialEndsAt: now,
        currentPeriodEnd: now,
        canceledAt: now,
      },
    }),
    db.billingAuditLog.create({
      data: {
        actorId: authorization.user.id,
        actorEmail,
        subjectUserId: userId,
        action: "STANDARD_TRIAL_REVOKED",
        details: { previousTrialEndsAt: subscription.trialEndsAt?.toISOString() ?? null },
      },
    }),
  ]);

  return adminJson({ revoked: true });
}

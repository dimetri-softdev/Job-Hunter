import { adminJson, requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  const configuration = await db.billingConfiguration.findUnique({
    where: { id: "global" },
    select: {
      reminderEmailsEnabled: true,
      updatedBy: true,
      updatedAt: true,
    },
  });

  return adminJson({
    enabled: configuration?.reminderEmailsEnabled ?? false,
    updatedBy: configuration?.updatedBy ?? null,
    updatedAt: configuration?.updatedAt ?? null,
  });
}

export async function PATCH(request: Request) {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return adminJson({ error: "Request body must be valid JSON." }, 400);
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("enabled" in body) ||
    typeof body.enabled !== "boolean"
  ) {
    return adminJson({ error: "Provide a boolean reminder-enabled value." }, 400);
  }

  const actorEmail = authorization.user.email?.trim().toLowerCase();
  if (!actorEmail) {
    return adminJson(
      { error: "The administrator account has no email address." },
      400,
    );
  }

  const enabled = body.enabled;
  const [configuration] = await db.$transaction([
    db.billingConfiguration.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        enabled: false,
        reminderEmailsEnabled: enabled,
        updatedBy: authorization.user.id,
      },
      update: {
        reminderEmailsEnabled: enabled,
        updatedBy: authorization.user.id,
      },
      select: {
        reminderEmailsEnabled: true,
        updatedBy: true,
        updatedAt: true,
      },
    }),
    db.billingAuditLog.create({
      data: {
        actorId: authorization.user.id,
        actorEmail,
        action: enabled ? "REMINDER_EMAILS_ENABLED" : "REMINDER_EMAILS_DISABLED",
        details: { enabled },
      },
    }),
  ]);

  return adminJson({
    enabled: configuration.reminderEmailsEnabled,
    updatedBy: configuration.updatedBy,
    updatedAt: configuration.updatedAt,
  });
}

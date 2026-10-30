import { adminJson, requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  const configuration = await db.billingConfiguration.findUnique({
    where: { id: "global" },
  });
  return adminJson({
    configuration: configuration ?? {
      id: "global",
      enabled: false,
      updatedBy: null,
      updatedAt: null,
    },
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
    return adminJson({ error: "Provide a boolean billing-enabled value." }, 400);
  }

  const enabled = body.enabled;
  const actorEmail = authorization.user.email?.trim().toLowerCase();
  if (!actorEmail) {
    return adminJson({ error: "The administrator account has no email address." }, 400);
  }

  const [configuration] = await db.$transaction([
    db.billingConfiguration.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        enabled,
        updatedBy: authorization.user.id,
      },
      update: {
        enabled,
        updatedBy: authorization.user.id,
      },
    }),
    db.billingAuditLog.create({
      data: {
        actorId: authorization.user.id,
        actorEmail,
        action: enabled ? "BILLING_ENABLED" : "BILLING_DISABLED",
        details: { billingEnforcementEnabled: enabled },
      },
    }),
  ]);

  return adminJson({
    configuration,
  });
}

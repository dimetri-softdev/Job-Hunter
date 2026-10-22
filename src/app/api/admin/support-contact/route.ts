import { adminJson, requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { DEFAULT_SUPPORT_EMAIL } from "@/lib/support-contact";

export const runtime = "nodejs";

export async function GET() {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  try {
    const configuration = await db.billingConfiguration.findUnique({
      where: { id: "global" },
      select: { supportEmail: true, updatedBy: true, updatedAt: true },
    });
    return adminJson({
      supportEmail: configuration?.supportEmail ?? DEFAULT_SUPPORT_EMAIL,
      updatedBy: configuration?.updatedBy ?? null,
      updatedAt: configuration?.updatedAt ?? null,
    });
  } catch (error: unknown) {
    console.error("Unable to load admin support settings", error);
    return adminJson({ error: "Unable to load support settings." }, 500);
  }
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

  const supportEmail =
    body && typeof body === "object" && "supportEmail" in body
      ? body.supportEmail
      : null;
  if (
    typeof supportEmail !== "string" ||
    supportEmail.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail.trim())
  ) {
    return adminJson(
      { error: "Enter a valid support email address." },
      400,
    );
  }

  const normalizedEmail = supportEmail.trim().toLowerCase();
  const actorEmail = authorization.user.email?.trim().toLowerCase();
  if (!actorEmail) {
    return adminJson(
      { error: "The administrator account has no email address." },
      400,
    );
  }

  try {
    const previous = await db.billingConfiguration.findUnique({
      where: { id: "global" },
      select: { supportEmail: true },
    });
    const [configuration] = await db.$transaction([
      db.billingConfiguration.upsert({
        where: { id: "global" },
        create: {
          id: "global",
          enabled: false,
          supportEmail: normalizedEmail,
          updatedBy: authorization.user.id,
        },
        update: {
          supportEmail: normalizedEmail,
          updatedBy: authorization.user.id,
        },
        select: { supportEmail: true, updatedBy: true, updatedAt: true },
      }),
      db.billingAuditLog.create({
        data: {
          actorId: authorization.user.id,
          actorEmail,
          action: "SUPPORT_EMAIL_UPDATED",
          details: {
            previousSupportEmail:
              previous?.supportEmail ?? DEFAULT_SUPPORT_EMAIL,
            supportEmail: normalizedEmail,
          },
        },
      }),
    ]);
    return adminJson(configuration);
  } catch (error: unknown) {
    console.error("Admin support email update failed", error);
    return adminJson({ error: "Unable to update the support email." }, 500);
  }
}

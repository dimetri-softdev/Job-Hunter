import { adminJson, requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isAdsenseConfigured } from "@/lib/ads";

export const runtime = "nodejs";

export async function GET() {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  try {
    const configuration = await db.billingConfiguration.findUnique({
      where: { id: "global" },
      select: { adsEnabled: true, updatedBy: true, updatedAt: true },
    });

    return adminJson({
      enabled: configuration?.adsEnabled ?? false,
      configured: isAdsenseConfigured(),
      updatedBy: configuration?.updatedBy ?? null,
      updatedAt: configuration?.updatedAt ?? null,
    });
  } catch (error: unknown) {
    console.error("Unable to load admin advertising settings", error);
    return adminJson({ error: "Unable to load advertising settings." }, 500);
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

  if (
    !body ||
    typeof body !== "object" ||
    !("enabled" in body) ||
    typeof body.enabled !== "boolean"
  ) {
    return adminJson({ error: "Provide a boolean ads-enabled value." }, 400);
  }

  const enabled = body.enabled;
  if (enabled && !isAdsenseConfigured()) {
    return adminJson(
      {
        error:
          "Configure a valid AdSense publisher ID and both ad slot IDs before enabling ads.",
      },
      400,
    );
  }

  const actorEmail = authorization.user.email?.trim().toLowerCase();
  if (!actorEmail) {
    return adminJson(
      { error: "The administrator account has no email address." },
      400,
    );
  }

  try {
    const [configuration] = await db.$transaction([
      db.billingConfiguration.upsert({
        where: { id: "global" },
        create: {
          id: "global",
          adsEnabled: enabled,
          updatedBy: authorization.user.id,
        },
        update: {
          adsEnabled: enabled,
          updatedBy: authorization.user.id,
        },
        select: { adsEnabled: true, updatedBy: true, updatedAt: true },
      }),
      db.billingAuditLog.create({
        data: {
          actorId: authorization.user.id,
          actorEmail,
          action: enabled ? "ADS_ENABLED" : "ADS_DISABLED",
          details: { adsEnabled: enabled },
        },
      }),
    ]);

    return adminJson({
      enabled: configuration.adsEnabled,
      configured: isAdsenseConfigured(),
      updatedBy: configuration.updatedBy,
      updatedAt: configuration.updatedAt,
    });
  } catch (error: unknown) {
    console.error("Admin advertising setting update failed", error);
    return adminJson({ error: "Unable to update advertising settings." }, 500);
  }
}

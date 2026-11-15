import {
  adminJson,
  isBootstrapAdmin,
  requireAdmin,
} from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;
  const { userId } = await params;

  if (!userId || !/^[0-9a-f-]{20,64}$/i.test(userId)) {
    return adminJson({ error: "Invalid account ID." }, 400);
  }
  if (userId === authorization.user.id) {
    return adminJson({ error: "You cannot remove your own admin access." }, 400);
  }

  const admin = await db.adminAccess.findUnique({
    where: { userId },
    select: { userId: true, email: true },
  });
  if (!admin) {
    return adminJson(
      { error: "Only database-managed admin access can be removed here." },
      409,
    );
  }
  if (isBootstrapAdmin(admin.email)) {
    return adminJson(
      { error: "Remove this email from ADMIN_EMAILS to change its protected access." },
      409,
    );
  }

  const actorEmail = authorization.user.email?.trim().toLowerCase();
  if (!actorEmail) {
    return adminJson({ error: "The administrator account has no email address." }, 400);
  }

  await db.$transaction([
    db.adminAccess.delete({ where: { userId } }),
    db.billingAuditLog.create({
      data: {
        actorId: authorization.user.id,
        actorEmail,
        subjectUserId: userId,
        action: "ADMIN_ACCESS_REMOVED",
        details: { email: admin.email },
      },
    }),
  ]);
  return adminJson({ removed: true });
}

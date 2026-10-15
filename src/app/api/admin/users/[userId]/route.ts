import {
  adminJson,
  getSupabaseAdminClient,
  isBootstrapAdmin,
  requireAdmin,
} from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

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
  const targetEmail = targetData.user?.email?.trim().toLowerCase();

  if (!targetError && targetData.user) {
    if (isBootstrapAdmin(targetEmail)) {
      return adminJson({ error: "Protected bootstrap admin accounts cannot be deleted here." }, 409);
    }
    if (!targetEmail || confirmEmail.trim().toLowerCase() !== targetEmail) {
      return adminJson({ error: "The confirmation email does not match this account." }, 400);
    }

    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("Supabase account deletion failed", deleteAuthError);
      return adminJson({ error: "The account could not be deleted from the identity provider." }, 502);
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
  } else {
    console.error("Supabase account lookup failed", targetError);
    return adminJson({ error: "Unable to verify the account with the identity provider." }, 502);
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

  return adminJson({ deleted: true });
}

import {
  adminJson,
  getSupabaseAdminClient,
  isBootstrapAdmin,
  requireAdmin,
} from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  const storedAdmins = await db.adminAccess.findMany({
    select: {
      userId: true,
      email: true,
      addedBy: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  const bootstrapEmails = [
    ...new Set(
      (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  return adminJson({
    admins: [
      ...bootstrapEmails.map((email) => ({
        userId: null,
        email,
        source: "environment" as const,
        createdAt: null,
        addedBy: null,
      })),
      ...storedAdmins
        .filter((admin) => !isBootstrapAdmin(admin.email))
        .map((admin) => ({
          ...admin,
          source: "database" as const,
        })),
    ],
  });
}

export async function POST(request: Request) {
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
  if (!body || typeof body !== "object" || !("userId" in body)) {
    return adminJson({ error: "Choose an existing account to promote." }, 400);
  }
  const userId = body.userId;
  if (typeof userId !== "string" || !/^[0-9a-f-]{20,64}$/i.test(userId)) {
    return adminJson({ error: "Invalid account ID." }, 400);
  }

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error && error.status !== 404) {
    console.error("Administrator promotion account lookup failed", error);
    return adminJson({ error: "Unable to verify the account." }, 502);
  }
  if (error || !data.user?.email) {
    return adminJson({ error: "A registered account with an email is required." }, 404);
  }

  const email = data.user.email.trim().toLowerCase();
  if (isBootstrapAdmin(email)) {
    return adminJson({ error: "This account already has protected admin access." }, 409);
  }

  const admin = await db.adminAccess.upsert({
    where: { userId },
    update: { email, addedBy: authorization.user.id },
    create: {
      userId,
      email,
      addedBy: authorization.user.id,
    },
    select: {
      userId: true,
      email: true,
      addedBy: true,
      createdAt: true,
    },
  });

  return adminJson(admin, 201);
}

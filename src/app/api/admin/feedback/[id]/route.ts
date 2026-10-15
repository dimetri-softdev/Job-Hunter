import { Prisma } from "@prisma/client";
import { adminJson, requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return adminJson({ error: "Request body must be valid JSON." }, 400);
  }

  if (!body || typeof body !== "object") {
    return adminJson({ error: "Invalid feedback update." }, 400);
  }

  const input = body as { reviewed?: unknown; adminNotes?: unknown };
  if (
    typeof input.reviewed !== "boolean" ||
    typeof input.adminNotes !== "string" ||
    input.adminNotes.length > 2000
  ) {
    return adminJson(
      { error: "Choose a review status and provide notes of 2,000 characters or fewer." },
      400,
    );
  }

  const { id } = await params;
  if (!id || id.length > 80) {
    return adminJson({ error: "Invalid feedback ID." }, 400);
  }

  try {
    const updated = await db.feedbackResponse.update({
      where: { id },
      data: {
        reviewed: input.reviewed,
        adminNotes: input.adminNotes.trim() || null,
      },
      select: {
        id: true,
        reviewed: true,
        adminNotes: true,
      },
    });
    return adminJson(updated);
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return adminJson({ error: "Feedback response not found." }, 404);
    }
    throw error;
  }
}

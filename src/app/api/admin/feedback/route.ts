import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const PAGE_SIZE = 50;

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Vary: "Cookie",
    },
  });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonResponse({ error: "Authentication required." }, 401);
  }

  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
  const userEmail = user.email?.trim().toLowerCase();

  if (adminEmails.size === 0) {
    return jsonResponse({ error: "Admin access is not configured." }, 503);
  }

  if (!userEmail || !adminEmails.has(userEmail)) {
    return jsonResponse({ error: "Admin access required." }, 403);
  }

  const pageValue = new URL(request.url).searchParams.get("page") ?? "0";
  const page = Number(pageValue);
  if (!Number.isSafeInteger(page) || page < 0 || page > 10_000) {
    return jsonResponse({ error: "Invalid page number." }, 400);
  }

  const [total, items] = await Promise.all([
    db.feedbackResponse.count(),
    db.feedbackResponse.findMany({
      select: {
        id: true,
        answers: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return jsonResponse({
    items,
    page,
    pageSize: PAGE_SIZE,
    total,
  });
}

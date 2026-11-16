import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { siteUrl } from "@/lib/site-url";

function getSafeDestination(next: string | null): string {
  return next === "/reset-password" ? next : "/dashboard";
}

function getCallbackFailureUrl(requestUrl: URL, redirectOrigin: string): URL {
  const isSignup = requestUrl.searchParams.get("intent") === "signup";
  return new URL(
    `/${isSignup ? "signup" : "login"}?error=oauth_callback_failed`,
    redirectOrigin,
  );
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const redirectOrigin =
    process.env.NODE_ENV === "production" ? siteUrl.origin : requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(getCallbackFailureUrl(requestUrl, redirectOrigin));
  }

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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(getCallbackFailureUrl(requestUrl, redirectOrigin));
  }

  if (requestUrl.searchParams.get("intent") === "signup") {
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { age_confirmed: true },
    });
    if (metadataError) {
      console.error(
        "Failed to save OAuth signup age confirmation:",
        metadataError.message,
      );
      return NextResponse.json(
        { error: "Could not save your signup details. Please try again." },
        { status: 500 },
      );
    }
  }

  return NextResponse.redirect(
    new URL(
      getSafeDestination(requestUrl.searchParams.get("next")),
      redirectOrigin,
    ),
  );
}

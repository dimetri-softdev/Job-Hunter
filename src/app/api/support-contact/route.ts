import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_SUPPORT_EMAIL } from "@/lib/support-contact";

export const runtime = "nodejs";

export async function GET() {
  try {
    const configuration = await db.billingConfiguration.findUnique({
      where: { id: "global" },
      select: { supportEmail: true },
    });
    return NextResponse.json(
      { supportEmail: configuration?.supportEmail ?? DEFAULT_SUPPORT_EMAIL },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    console.error("Unable to load the public support email", error);
    return NextResponse.json(
      { error: "Support contact is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

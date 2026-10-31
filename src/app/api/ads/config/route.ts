import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const configuration = await db.billingConfiguration.findUnique({
      where: { id: "global" },
      select: { adsEnabled: true },
    });

    return NextResponse.json(
      { enabled: configuration?.adsEnabled ?? false },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    console.error("Unable to load public advertising settings", error);
    return NextResponse.json(
      { error: "Unable to load advertising settings." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

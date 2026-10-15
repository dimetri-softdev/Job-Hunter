import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { adminJson, requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const PAGE_SIZE = 50;
const EXPORT_LIMIT = 10_000;

interface FeedbackRow {
  id: string;
  answers: Prisma.JsonValue;
  reviewed: boolean;
  adminNotes: string | null;
  createdAt: Date;
}

interface RatingCount {
  rating: number;
  count: number;
}

function parseDate(value: string | null) {
  if (!value) return { date: null, invalid: false };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { date: null, invalid: true };
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  const isValidDate =
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  return {
    date: isValidDate ? date : null,
    invalid: !isValidDate,
  };
}

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[\u0000-\u0020]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function answerText(answers: Prisma.JsonValue, field: string) {
  if (!answers || Array.isArray(answers) || typeof answers !== "object") {
    return "";
  }
  const value = answers[field];
  if (field === "featureRatings" && Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item || Array.isArray(item) || typeof item !== "object") return "";
        const feature = item.feature;
        const usefulness = item.usefulness;
        return `${String(feature ?? "")}: ${String(usefulness ?? "")}/5`;
      })
      .filter(Boolean)
      .join("; ");
  }
  return value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);
}

function makeFilter(search: string | null, rating: number | null, from: Date | null, to: Date | null) {
  return Prisma.sql`
    WHERE (${search}::text IS NULL OR strpos(lower("answers"::text), lower(${search})) > 0)
      AND (
        ${rating}::int IS NULL
        OR CASE
          WHEN ("answers"->>'overallRating') ~ '^[1-5]$'
          THEN ("answers"->>'overallRating')::int
          ELSE NULL
        END = ${rating}
      )
      AND (${from}::timestamptz IS NULL OR "createdAt" >= ${from})
      AND (${to}::timestamptz IS NULL OR "createdAt" < ${to})
  `;
}

export async function GET(request: Request) {
  const authorization = await requireAdmin();
  if (authorization.response) return authorization.response;

  const params = new URL(request.url).searchParams;
  const pageText = params.get("page") ?? "0";
  const page = Number(pageText);
  const search = params.get("q")?.trim() ?? "";
  const ratingText = params.get("rating");
  const rating = ratingText ? Number(ratingText) : null;
  const fromParsed = parseDate(params.get("from"));
  const toParsed = parseDate(params.get("to"));

  if (!Number.isSafeInteger(page) || page < 0 || page > 10_000) {
    return adminJson({ error: "Invalid page number." }, 400);
  }
  if (search.length > 200) {
    return adminJson({ error: "Search text must be 200 characters or fewer." }, 400);
  }
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return adminJson({ error: "Rating must be between 1 and 5." }, 400);
  }
  if (fromParsed.invalid || toParsed.invalid) {
    return adminJson({ error: "Dates must use YYYY-MM-DD format." }, 400);
  }

  const from = fromParsed.date;
  const to = toParsed.date
    ? new Date(toParsed.date.getTime() + 24 * 60 * 60 * 1000)
    : null;
  if (from && to && from >= to) {
    return adminJson({ error: "The date range is invalid." }, 400);
  }

  const filter = makeFilter(search || null, rating, from, to);
  const [
    totals,
    ratingCounts,
    items,
  ] = await Promise.all([
    db.$queryRaw<
      { total: number; averageRating: number | null; recent: number }[]
    >`
      SELECT
        COUNT(*)::int AS "total",
        AVG(
          CASE
            WHEN ("answers"->>'overallRating') ~ '^[1-5]$'
            THEN ("answers"->>'overallRating')::int
            ELSE NULL
          END
        )::float AS "averageRating",
        COUNT(*) FILTER (
          WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        )::int AS "recent"
      FROM "FeedbackResponse"
      ${filter}
    `,
    db.$queryRaw<RatingCount[]>`
      SELECT
        ("answers"->>'overallRating')::int AS "rating",
        COUNT(*)::int AS "count"
      FROM "FeedbackResponse"
      ${filter}
        AND ("answers"->>'overallRating') ~ '^[1-5]$'
      GROUP BY 1
      ORDER BY 1
    `,
    params.get("format") === "csv"
      ? Promise.resolve([])
      : db.$queryRaw<FeedbackRow[]>`
          SELECT "id", "answers", "reviewed", "adminNotes", "createdAt"
          FROM "FeedbackResponse"
          ${filter}
          ORDER BY "createdAt" DESC, "id" DESC
          LIMIT ${PAGE_SIZE}
          OFFSET ${page * PAGE_SIZE}
        `,
  ]);

  const total = totals[0]?.total ?? 0;
  if (params.get("format") === "csv") {
    if (total > EXPORT_LIMIT) {
      return adminJson(
        {
          error: `This export has ${total} responses. Narrow the filters to ${EXPORT_LIMIT.toLocaleString()} or fewer.`,
        },
        413,
      );
    }

    const rows = await db.$queryRaw<FeedbackRow[]>`
      SELECT "id", "answers", "reviewed", "adminNotes", "createdAt"
      FROM "FeedbackResponse"
      ${filter}
      ORDER BY "createdAt" DESC, "id" DESC
      LIMIT ${EXPORT_LIMIT}
    `;
    const columns = [
      ["Submitted at", (row: FeedbackRow) => row.createdAt.toISOString()],
      ["Overall rating", (row: FeedbackRow) => answerText(row.answers, "overallRating")],
      ["Feature ratings", (row: FeedbackRow) => answerText(row.answers, "featureRatings")],
      ["Needs improvement", (row: FeedbackRow) => answerText(row.answers, "needsImprovement")],
      ["Suggested improvements", (row: FeedbackRow) => answerText(row.answers, "improvementNotes")],
      ["Most valuable", (row: FeedbackRow) => answerText(row.answers, "mostValuable")],
      ["Main friction", (row: FeedbackRow) => answerText(row.answers, "mainFriction")],
      ["Would pay", (row: FeedbackRow) => answerText(row.answers, "wouldPay")],
      ["Fair monthly price", (row: FeedbackRow) => answerText(row.answers, "fairMonthlyPrice")],
      ["Reviewed", (row: FeedbackRow) => row.reviewed],
      ["Admin notes", (row: FeedbackRow) => row.adminNotes],
    ] as const;
    const csv = [
      columns.map(([label]) => csvCell(label)).join(","),
      ...rows.map((row) =>
        columns.map(([, value]) => csvCell(value(row))).join(","),
      ),
    ].join("\r\n");

    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="jobhunter-feedback.csv"',
        "Cache-Control": "private, no-store, max-age=0",
        Vary: "Cookie",
      },
    });
  }

  return adminJson({
    items,
    page,
    pageSize: PAGE_SIZE,
    total,
    stats: {
      averageRating: totals[0]?.averageRating ?? null,
      recent: totals[0]?.recent ?? 0,
      ratingCounts,
    },
  });
}

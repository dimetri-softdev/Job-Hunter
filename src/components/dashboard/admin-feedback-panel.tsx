"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, MessageSquareText } from "lucide-react";

interface FeedbackRecord {
  id: string;
  createdAt: string;
  answers: Record<string, unknown>;
}

interface FeedbackPage {
  items: FeedbackRecord[];
  page: number;
  pageSize: number;
  total: number;
}

const ANSWER_LABELS: Record<string, string> = {
  overallRating: "Overall rating",
  featureRatings: "Feature ratings",
  needsImprovement: "Needs improvement",
  improvementNotes: "Suggested improvements",
  mostValuable: "Most valuable part",
  mainFriction: "Confusing or difficult parts",
  wouldPay: "Would pay",
  fairMonthlyPrice: "Fair monthly price",
};

const FEATURE_LABELS: Record<string, string> = {
  job_fit: "Job-fit analysis",
  application_tracking: "Application tracking",
  career_suggestions: "Career suggestions",
  roadmaps: "Learning roadmaps",
  proof_sprints: "Proof Sprints",
  search_playbook: "Search Playbook",
  offer_comparison: "Offer comparison",
  application_packs: "Application packs",
  csv_backups: "CSV import/export",
};

function isFeedbackPage(value: unknown): value is FeedbackPage {
  if (!value || typeof value !== "object") return false;
  const page = value as Partial<FeedbackPage>;
  return (
    Array.isArray(page.items) &&
    typeof page.page === "number" &&
    typeof page.pageSize === "number" &&
    typeof page.total === "number"
  );
}

function formatAnswer(key: string, value: unknown): string {
  if (key === "featureRatings" && Array.isArray(value)) {
    return value
      .map((rating) => {
        if (!rating || typeof rating !== "object") return "";
        const item = rating as { feature?: unknown; usefulness?: unknown };
        const feature =
          typeof item.feature === "string"
            ? FEATURE_LABELS[item.feature] ?? item.feature
            : "Feature";
        return `${feature}: ${String(item.usefulness ?? "—")}/5`;
      })
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return value == null ? "—" : JSON.stringify(value);
}

export function AdminFeedbackPanel() {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<FeedbackPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFeedback() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/feedback?page=${page}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload: unknown = await response.json();

        if (!response.ok) {
          const message =
            payload &&
            typeof payload === "object" &&
            "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : `Unable to load feedback (${response.status}).`;
          throw new Error(message);
        }

        if (!isFeedbackPage(payload)) {
          throw new Error("The server returned an unexpected feedback response.");
        }

        setResult(payload);
      } catch (loadError: unknown) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load feedback.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadFeedback();
    return () => controller.abort();
  }, [page]);

  if (loading && !result) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading feedback…
      </div>
    );
  }

  if (error && !result) {
    return (
      <section
        role="alert"
        className="rounded-xl border border-rose-500/20 bg-rose-500/[0.05] p-5 text-sm text-rose-200"
      >
        <p>{error}</p>
        {error === "Admin access required." && (
          <p className="mt-2 text-xs text-rose-200/70">
            Sign in with the email address configured in the server&apos;s{" "}
            <code>ADMIN_EMAILS</code> environment variable.
          </p>
        )}
        {error === "Authentication required." && (
          <Link href="/login" className="mt-3 inline-block underline">
            Sign in
          </Link>
        )}
      </section>
    );
  }

  if (!result) return null;

  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400" aria-live="polite">
          {result.total} {result.total === 1 ? "response" : "responses"}
          {result.total > 0 &&
            ` · Showing ${page * result.pageSize + 1}–${Math.min(
              (page + 1) * result.pageSize,
              result.total,
            )}`}
        </p>
        {loading && (
          <Loader2
            className="size-4 animate-spin text-slate-500"
            aria-label="Loading page"
          />
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      )}

      {result.items.length === 0 ? (
        <div className="rounded-xl border border-[#1f212d] bg-[#12131a] p-8 text-center">
          <MessageSquareText
            className="mx-auto size-8 text-slate-500"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm text-slate-300">No feedback submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {result.items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-[#1f212d] bg-[#12131a] p-5"
            >
              <h2 className="text-xs font-medium text-slate-400">
                Submitted{" "}
                <time dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleString()}
                </time>
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                {Object.entries(item.answers).map(([key, value]) => (
                  <div key={key} className="min-w-0">
                    <dt className="text-xs font-semibold text-slate-300">
                      {ANSWER_LABELS[key] ?? key}
                    </dt>
                    <dd className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-slate-400">
                      {formatAnswer(key, value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <nav
          aria-label="Feedback pages"
          className="flex items-center justify-between border-t border-[#1f212d] pt-4"
        >
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0 || loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#2b2e3b] px-3 text-sm text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Page {page + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={page + 1 >= pageCount || loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#2b2e3b] px-3 text-sm text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </section>
  );
}

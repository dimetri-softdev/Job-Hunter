"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  MessageSquareText,
  Save,
} from "lucide-react";

interface FeedbackRecord {
  id: string;
  createdAt: string;
  answers: Record<string, unknown>;
  reviewed: boolean;
  adminNotes: string | null;
}

interface FeedbackStats {
  averageRating: number | null;
  recent: number;
  ratingCounts: { rating: number; count: number }[];
}

interface FeedbackPage {
  items: FeedbackRecord[];
  page: number;
  pageSize: number;
  total: number;
  stats: FeedbackStats;
}

interface Filters {
  q: string;
  rating: string;
  from: string;
  to: string;
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

function getErrorMessage(payload: unknown, status: number) {
  return payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
    ? payload.error
    : `Request failed (${status}).`;
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

function filterQuery(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.rating) params.set("rating", filters.rating);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return params;
}

export function AdminFeedbackPanel() {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<FeedbackPage | null>(null);
  const [draftFilters, setDraftFilters] = useState<Filters>({
    q: "",
    rating: "",
    from: "",
    to: "",
  });
  const [filters, setFilters] = useState<Filters>(draftFilters);
  const [drafts, setDrafts] = useState<
    Record<string, { reviewed: boolean; adminNotes: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadFeedback() {
      setLoading(true);
      setError(null);
      const params = filterQuery(filters);
      params.set("page", String(page));
      try {
        const response = await fetch(`/api/admin/feedback?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error(getErrorMessage(payload, response.status));
        if (
          !payload ||
          typeof payload !== "object" ||
          !("items" in payload) ||
          !Array.isArray(payload.items) ||
          !("stats" in payload)
        ) {
          throw new Error("The server returned an unexpected feedback response.");
        }
        const pageData = payload as FeedbackPage;
        setResult(pageData);
        setDrafts(
          Object.fromEntries(
            pageData.items.map((item) => [
              item.id,
              {
                reviewed: item.reviewed,
                adminNotes: item.adminNotes ?? "",
              },
            ]),
          ),
        );
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
  }, [filters, page]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setFilters({ ...draftFilters });
  }

  async function exportCsv() {
    setExporting(true);
    setError(null);
    try {
      const params = filterQuery(filters);
      params.set("format", "csv");
      const response = await fetch(`/api/admin/feedback?${params}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const payload: unknown = await response.json();
        throw new Error(getErrorMessage(payload, response.status));
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "jobhunter-feedback.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (exportError: unknown) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Unable to export feedback.",
      );
    } finally {
      setExporting(false);
    }
  }

  async function saveFeedback(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/feedback/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(payload, response.status));
      setResult((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === id ? { ...item, ...draft } : item,
              ),
            }
          : current,
      );
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save feedback changes.",
      );
    } finally {
      setBusyId(null);
    }
  }

  const pageCount = result
    ? Math.max(1, Math.ceil(result.total / result.pageSize))
    : 1;
  const maxRatingCount = Math.max(
    1,
    ...(result?.stats.ratingCounts.map((item) => item.count) ?? []),
  );

  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Matching responses"
          value={result?.total.toLocaleString() ?? "—"}
          detail="Based on the filters below"
        />
        <StatCard
          label="Average rating"
          value={
            result?.stats.averageRating == null
              ? "—"
              : `${result.stats.averageRating.toFixed(1)} / 5`
          }
          detail="Across matching responses"
        />
        <StatCard
          label="Last 30 days"
          value={result?.stats.recent.toLocaleString() ?? "—"}
          detail="Matching responses submitted recently"
        />
      </div>

      <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Rating breakdown</h2>
          <button
            type="button"
            onClick={() => void exportCsv()}
            disabled={exporting || loading}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#2b2e3b] px-3 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
            Export filtered CSV
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-5">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count =
              result?.stats.ratingCounts.find((item) => item.rating === rating)
                ?.count ?? 0;
            return (
              <div key={rating} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{rating} stars</span>
                  <span>{count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#242632]">
                  <div
                    className="h-full rounded-full bg-violet-400"
                    style={{ width: `${(count / maxRatingCount) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <form
        onSubmit={applyFilters}
        className="grid gap-3 rounded-xl border border-[#1f212d] bg-[#12131a] p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <label className="text-xs text-slate-400 lg:col-span-2">
          Search feedback
          <input
            value={draftFilters.q}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, q: event.target.value }))
            }
            maxLength={200}
            placeholder="Search feedback text"
            className="mt-1 block min-h-10 w-full rounded-lg border border-[#2b2e3b] bg-[#0d0e14] px-3 text-sm text-white placeholder:text-slate-600"
          />
        </label>
        <label className="text-xs text-slate-400">
          Rating
          <select
            value={draftFilters.rating}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                rating: event.target.value,
              }))
            }
            className="mt-1 block min-h-10 w-full rounded-lg border border-[#2b2e3b] bg-[#0d0e14] px-3 text-sm text-white"
          >
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} stars
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          From
          <input
            type="date"
            value={draftFilters.from}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, from: event.target.value }))
            }
            className="mt-1 block min-h-10 w-full rounded-lg border border-[#2b2e3b] bg-[#0d0e14] px-3 text-sm text-white"
          />
        </label>
        <label className="text-xs text-slate-400">
          To
          <input
            type="date"
            value={draftFilters.to}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, to: event.target.value }))
            }
            className="mt-1 block min-h-10 w-full rounded-lg border border-[#2b2e3b] bg-[#0d0e14] px-3 text-sm text-white"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="min-h-10 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50"
          >
            Apply filters
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
        <span aria-live="polite">
          {loading && !result ? "Loading feedback…" : `${result?.total ?? 0} responses`}
          {result && result.total > 0 &&
            ` · Showing ${page * result.pageSize + 1}–${Math.min(
              (page + 1) * result.pageSize,
              result.total,
            )}`}
        </span>
        {loading && (
          <Loader2 className="size-4 animate-spin" aria-label="Loading feedback" />
        )}
      </div>

      {!loading && result?.items.length === 0 ? (
        <div className="rounded-xl border border-[#1f212d] bg-[#12131a] p-8 text-center">
          <MessageSquareText className="mx-auto size-8 text-slate-500" aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-300">No feedback matches these filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {result?.items.map((item) => {
            const draft = drafts[item.id] ?? {
              reviewed: item.reviewed,
              adminNotes: item.adminNotes ?? "",
            };
            return (
              <article
                key={item.id}
                className="rounded-xl border border-[#1f212d] bg-[#12131a] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xs font-medium text-slate-400">
                    Submitted{" "}
                    <time dateTime={item.createdAt}>
                      {new Date(item.createdAt).toLocaleString()}
                    </time>
                  </h3>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={draft.reviewed}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [item.id]: { ...draft, reviewed: event.target.checked },
                        }))
                      }
                      className="size-4 accent-violet-500"
                    />
                    Reviewed
                  </label>
                </div>
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
                <div className="mt-4 flex flex-col gap-3 border-t border-[#1f212d] pt-4 sm:flex-row sm:items-end">
                  <label className="flex-1 text-xs text-slate-400">
                    Internal admin notes
                    <textarea
                      value={draft.adminNotes}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [item.id]: { ...draft, adminNotes: event.target.value },
                        }))
                      }
                      maxLength={2000}
                      rows={2}
                      placeholder="Notes are visible to admins only"
                      className="mt-1 block w-full resize-y rounded-lg border border-[#2b2e3b] bg-[#0d0e14] px-3 py-2 text-sm text-white placeholder:text-slate-600"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void saveFeedback(item.id)}
                    disabled={busyId === item.id}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#2b2e3b] px-3 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
                  >
                    {busyId === item.id ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save className="size-4" aria-hidden="true" />
                    )}
                    Save review
                  </button>
                </div>
              </article>
            );
          })}
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

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-xl border border-[#1f212d] bg-[#12131a] p-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

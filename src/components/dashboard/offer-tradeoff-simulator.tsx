"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/api";
import type { OfferDetails, OfferPriorities } from "@/lib/application-types";

interface OfferApplication {
  id: string;
  company: string;
  position: string;
  status: string;
  offerDetails?: OfferDetails | null;
}

const DEFAULT_PRIORITIES: OfferPriorities = {
  salary: 3,
  commute: 3,
  learning: 3,
  stability: 3,
  workLife: 3,
};

const EMPTY_DETAILS: OfferDetails = {
  annualCompensation: null,
  currency: null,
  commuteMinutes: null,
  learning: null,
  stability: null,
  workLife: null,
};

type OfferMetricKey = Exclude<keyof OfferDetails, "currency">;

const CRITERIA: {
  key: keyof OfferPriorities;
  detailKey: OfferMetricKey;
  label: string;
}[] = [
  { key: "salary", detailKey: "annualCompensation", label: "Annual compensation" },
  { key: "commute", detailKey: "commuteMinutes", label: "Commute" },
  { key: "learning", detailKey: "learning", label: "Learning potential" },
  { key: "stability", detailKey: "stability", label: "Stability" },
  { key: "workLife", detailKey: "workLife", label: "Work-life balance" },
];

function getNumber(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function normalizeDetails(details?: OfferDetails | null): OfferDetails {
  return { ...EMPTY_DETAILS, ...details };
}

function getCompleteCriteria(
  offers: OfferApplication[],
  priorities: OfferPriorities,
) {
  const sameCurrency =
    offers.length > 0 &&
    offers.every(
      (offer) =>
        offer.offerDetails?.annualCompensation !== null &&
        offer.offerDetails?.annualCompensation !== undefined &&
        offer.offerDetails?.currency,
    ) &&
    new Set(
      offers.map((offer) => offer.offerDetails?.currency?.toUpperCase()),
    ).size === 1;

  return CRITERIA.filter(({ key, detailKey }) => {
    if (priorities[key] === 0) return false;
    if (key === "salary" && !sameCurrency) return false;
    return offers.every((offer) => {
      const value = offer.offerDetails?.[detailKey];
      return value !== null && value !== undefined;
    });
  });
}

function getOfferScores(
  offers: OfferApplication[],
  priorities: OfferPriorities,
) {
  if (offers.length < 2) return [];
  const criteria = getCompleteCriteria(offers, priorities);
  const totalWeight = criteria.reduce(
    (sum, criterion) => sum + priorities[criterion.key],
    0,
  );
  if (totalWeight === 0) return [];

  const ranges = new Map<
    OfferMetricKey,
    { minimum: number; maximum: number }
  >();
  for (const criterion of criteria) {
    const values = offers
      .map((offer) => offer.offerDetails?.[criterion.detailKey])
      .filter((value): value is number => value !== null && value !== undefined);
    if (values.length !== offers.length) return [];
    ranges.set(criterion.detailKey, {
      minimum: Math.min(...values),
      maximum: Math.max(...values),
    });
  }

  return offers
    .map((offer) => {
      const score = criteria.reduce((total, criterion) => {
        const value = offer.offerDetails?.[criterion.detailKey];
        const range = ranges.get(criterion.detailKey);
        if (!range || value === null || value === undefined) return total;

        let normalized: number;
        if (criterion.key === "salary") {
          normalized =
            range.maximum === range.minimum
              ? 100
              : ((value - range.minimum) / (range.maximum - range.minimum)) *
                100;
        } else if (criterion.key === "commute") {
          normalized =
            range.maximum === range.minimum
              ? 100
              : ((range.maximum - value) / (range.maximum - range.minimum)) *
                100;
        } else {
          normalized = ((value - 1) / 4) * 100;
        }
        return total + normalized * priorities[criterion.key];
      }, 0);

      return {
        id: offer.id,
        company: offer.company,
        position: offer.position,
        score: Math.round(score / totalWeight),
      };
    })
    .sort((left, right) => right.score - left.score);
}

export function OfferTradeoffSimulator({
  applications,
  loading,
  error,
  onOfferDetailsSaved,
}: {
  applications: OfferApplication[];
  loading: boolean;
  error: string | null;
  onOfferDetailsSaved: (applicationId: string, details: OfferDetails) => void;
}) {
  const offers = applications.filter(
    (application) => application.status === "OFFERED",
  );
  const [priorities, setPriorities] =
    useState<OfferPriorities>(DEFAULT_PRIORITIES);
  const [prioritiesLoading, setPrioritiesLoading] = useState(true);
  const [savingPriorities, setSavingPriorities] = useState(false);
  const [prioritiesError, setPrioritiesError] = useState<string | null>(null);
  const [prioritiesNotice, setPrioritiesNotice] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, OfferDetails>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadPriorities() {
      try {
        const savedPriorities =
          await fetcher<OfferPriorities>("/offer-priorities");
        setPriorities(savedPriorities);
      } catch (loadError: unknown) {
        setPrioritiesError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load saved priorities.",
        );
      } finally {
        setPrioritiesLoading(false);
      }
    }

    loadPriorities();
  }, []);

  const selectedOffers = offers.filter((offer) =>
    selectedIds.includes(offer.id),
  );
  const scores = getOfferScores(selectedOffers, priorities);
  const allCurrencies = new Set(
    selectedOffers
      .map((offer) => offer.offerDetails?.currency?.toUpperCase())
      .filter(Boolean),
  );
  const hasMixedCurrencies = allCurrencies.size > 1;

  function updateDraft(
    applicationId: string,
    key: keyof OfferDetails,
    value: OfferDetails[keyof OfferDetails],
  ) {
    setDrafts((current) => ({
      ...current,
      [applicationId]: {
        ...normalizeDetails(current[applicationId]),
        [key]: value,
      },
    }));
  }

  function toggleOffer(applicationId: string) {
    setSelectedIds((current) => {
      if (current.includes(applicationId)) {
        return current.filter((id) => id !== applicationId);
      }
      if (current.length >= 3) return current;
      return [...current, applicationId];
    });
  }

  async function savePriorities() {
    setSavingPriorities(true);
    setPrioritiesError(null);
    setPrioritiesNotice(null);
    try {
      const savedPriorities = await fetcher<OfferPriorities>(
        "/offer-priorities",
        {
          method: "PUT",
          body: JSON.stringify(priorities),
        },
      );
      setPriorities(savedPriorities);
      setPrioritiesNotice("Your priorities were saved.");
    } catch (saveFailure: unknown) {
      setPrioritiesError(
        saveFailure instanceof Error
          ? saveFailure.message
          : "Unable to save your priorities.",
      );
    } finally {
      setSavingPriorities(false);
    }
  }

  async function saveOfferDetails(applicationId: string) {
    const offer = offers.find((candidate) => candidate.id === applicationId);
    if (!offer) {
      setSaveError("This offer is no longer available.");
      return;
    }
    setSavingId(applicationId);
    setSaveError(null);
    setSavedId(null);
    try {
      const draft = normalizeDetails(
        drafts[applicationId] ?? offer.offerDetails,
      );
      const savedDetails = await fetcher<OfferDetails>(
        `/applications/${applicationId}/offer-details`,
        {
          method: "PUT",
          body: JSON.stringify(draft),
        },
      );
      setDrafts((current) => ({ ...current, [applicationId]: savedDetails }));
      onOfferDetailsSaved(applicationId, savedDetails);
      setSavedId(applicationId);
    } catch (saveFailure: unknown) {
      setSaveError(
        saveFailure instanceof Error
          ? saveFailure.message
          : "Unable to save offer details.",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="space-y-5 rounded-xl border border-[#1f212d] bg-[#12131a] p-6">
      <div className="border-b border-[#1f212d] pb-3">
        <h2 className="text-sm font-semibold text-white">
          Offer trade-off simulator
        </h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Compare up to three offers using the factors that matter to you. Scores
          are relative to the offers selected, not a universal recommendation.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading offered roles...
        </div>
      ) : error ? (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      ) : offers.length === 0 ? (
        <p className="text-xs leading-5 text-slate-400">
          Mark an application as Offered to add it here. Offer details stay
          private to your account.{" "}
          <Link
            href="/applications"
            className="font-medium text-blue-300 hover:text-blue-200"
          >
            Open applications
          </Link>
        </p>
      ) : (
        <>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-xs font-medium text-slate-300">
              Choose up to 3 offers
            </legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => {
                const selected = selectedIds.includes(offer.id);
                return (
                  <label
                    key={offer.id}
                    className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-xs ${
                      selected
                        ? "border-blue-500/40 bg-blue-500/[0.06] text-slate-100"
                        : "border-[#252836] bg-[#101119] text-slate-400"
                    } ${
                      !selected && selectedIds.length >= 3
                        ? "cursor-not-allowed opacity-50"
                        : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={!selected && selectedIds.length >= 3}
                      onChange={() => toggleOffer(offer.id)}
                      className="mt-0.5 size-4 shrink-0 accent-blue-500"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {offer.company}
                      </span>
                      <span className="mt-1 block truncate text-[11px] text-slate-500">
                        {offer.position}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {selectedOffers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-200">
                Offer details
              </h3>
              <div className="grid gap-3 lg:grid-cols-3">
                {selectedOffers.map((offer) => {
                  const draft = normalizeDetails(
                    drafts[offer.id] ?? offer.offerDetails,
                  );
                  return (
                    <div
                      key={offer.id}
                      className="space-y-3 rounded-xl border border-[#252836] bg-[#101119] p-4"
                    >
                      <div>
                        <h4 className="truncate text-xs font-semibold text-white">
                          {offer.company}
                        </h4>
                        <p className="mt-1 truncate text-[11px] text-slate-500">
                          {offer.position}
                        </p>
                      </div>
                      <div className="grid grid-cols-[1fr_76px] gap-2">
                        <div className="space-y-1">
                          <label
                            htmlFor={`compensation-${offer.id}`}
                            className="text-[10px] text-slate-500"
                          >
                            Annual compensation
                          </label>
                          <Input
                            id={`compensation-${offer.id}`}
                            type="number"
                            min={0}
                            step="any"
                            value={getNumber(draft.annualCompensation)}
                            onChange={(event) =>
                              updateDraft(
                                offer.id,
                                "annualCompensation",
                                event.target.value === ""
                                  ? null
                                  : Number(event.target.value),
                              )
                            }
                            className="h-9 border-[#2b2e3b] bg-[#090a0f] text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor={`currency-${offer.id}`}
                            className="text-[10px] text-slate-500"
                          >
                            Currency
                          </label>
                          <Input
                            id={`currency-${offer.id}`}
                            maxLength={3}
                            value={draft.currency ?? ""}
                            onChange={(event) =>
                              updateDraft(
                                offer.id,
                                "currency",
                                event.target.value.toUpperCase(),
                              )
                            }
                            placeholder="USD"
                            className="h-9 border-[#2b2e3b] bg-[#090a0f] text-xs uppercase text-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label
                          htmlFor={`commute-${offer.id}`}
                          className="text-[10px] text-slate-500"
                        >
                          One-way commute (minutes)
                        </label>
                        <Input
                          id={`commute-${offer.id}`}
                          type="number"
                          min={0}
                          max={5000}
                          value={getNumber(draft.commuteMinutes)}
                          onChange={(event) =>
                            updateDraft(
                              offer.id,
                              "commuteMinutes",
                              event.target.value === ""
                                ? null
                                : Number(event.target.value),
                            )
                          }
                          className="h-9 border-[#2b2e3b] bg-[#090a0f] text-xs text-white"
                        />
                      </div>
                      {(
                        [
                          ["learning", "Learning potential"],
                          ["stability", "Stability"],
                          ["workLife", "Work-life balance"],
                        ] as const
                      ).map(([key, label]) => (
                        <div key={key} className="space-y-1">
                          <label
                            htmlFor={`${key}-${offer.id}`}
                            className="text-[10px] text-slate-500"
                          >
                            {label} · 1 low, 5 high
                          </label>
                          <select
                            id={`${key}-${offer.id}`}
                            value={getNumber(draft[key])}
                            onChange={(event) =>
                              updateDraft(
                                offer.id,
                                key,
                                event.target.value === ""
                                  ? null
                                  : Number(event.target.value),
                              )
                            }
                            className="h-9 w-full rounded-lg border border-[#2b2e3b] bg-[#090a0f] px-2 text-xs text-white"
                          >
                            <option value="">Choose a rating</option>
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <option key={rating} value={rating}>
                                {rating}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                      {saveError && (
                        <p role="alert" className="text-[11px] text-rose-400">
                          {saveError}
                        </p>
                      )}
                      {savedId === offer.id && (
                        <p role="status" className="text-[11px] text-emerald-300">
                          Offer details saved.
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void saveOfferDetails(offer.id)}
                        disabled={savingId === offer.id}
                        className="h-8 border-[#2b2e3b] text-[11px] text-slate-300 hover:bg-[#1f212d] hover:text-white"
                      >
                        {savingId === offer.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        {savingId === offer.id ? "Saving..." : "Save details"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3 border-t border-[#1f212d] pt-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-200">
                Your priorities
              </h3>
              <p className="mt-1 text-[11px] text-slate-500">
                Set each weight from 0 (ignore) to 5 (most important).
              </p>
            </div>
            {prioritiesLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading saved priorities...
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {CRITERIA.map((criterion) => (
                    <label
                      key={criterion.key}
                      htmlFor={`priority-${criterion.key}`}
                      className="space-y-2 rounded-lg border border-[#252836] bg-[#101119] p-3"
                    >
                      <span className="flex items-center justify-between gap-2 text-[11px] text-slate-300">
                        {criterion.label}
                        <span className="font-mono text-blue-300">
                          {priorities[criterion.key]}
                        </span>
                      </span>
                      <input
                        id={`priority-${criterion.key}`}
                        type="range"
                        min={0}
                        max={5}
                        value={priorities[criterion.key]}
                        onChange={(event) => {
                          setPriorities((current) => ({
                            ...current,
                            [criterion.key]: Number(event.target.value),
                          }));
                          setPrioritiesNotice(null);
                        }}
                        className="w-full accent-blue-500"
                      />
                    </label>
                  ))}
                </div>
                {prioritiesError && (
                  <p role="alert" className="text-xs text-rose-400">
                    {prioritiesError}
                  </p>
                )}
                {prioritiesNotice && (
                  <p role="status" className="text-xs text-emerald-300">
                    {prioritiesNotice}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void savePriorities()}
                  disabled={savingPriorities || !Object.values(priorities).some((weight) => weight > 0)}
                  className="h-8 border-[#2b2e3b] text-[11px] text-slate-300 hover:bg-[#1f212d] hover:text-white"
                >
                  {savingPriorities && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {savingPriorities ? "Saving priorities..." : "Save priorities"}
                </Button>
              </>
            )}
          </div>

          {hasMixedCurrencies && (
            <p className="text-[11px] text-amber-300">
              Salary is not scored because the selected offers use different
              currencies. No currency conversion is performed.
            </p>
          )}

          {selectedOffers.length < 2 ? (
            <p className="border-t border-[#1f212d] pt-4 text-xs text-slate-500">
              Select at least two offers to compare them.
            </p>
          ) : scores.length === 0 ? (
            <p className="border-t border-[#1f212d] pt-4 text-xs leading-5 text-slate-400">
              Save comparable details for at least one prioritized factor across
              every selected offer to see a relative score.
            </p>
          ) : (
            <div className="space-y-4 border-t border-[#1f212d] pt-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-200">
                  Relative comparison
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  A score ranks only the offers selected, based on completed
                  details and your saved weights.
                </p>
              </div>
              {scores.map((offer, index) => (
                <div key={offer.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate font-medium text-slate-200">
                      {index + 1}. {offer.company} · {offer.position}
                    </span>
                    <span className="shrink-0 font-mono text-blue-300">
                      {offer.score}/100
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-[#1f212d]"
                    role="img"
                    aria-label={`${offer.company} relative score ${offer.score} out of 100`}
                  >
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${offer.score}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-[10px] leading-4 text-slate-500">
                This comparison reflects your entered ratings and preferences;
                it does not choose for you or judge what matters most.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

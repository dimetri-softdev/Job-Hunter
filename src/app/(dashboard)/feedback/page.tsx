"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MessageSquareText } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/api";

const FEATURES = [
  { key: "job_fit", label: "Job-fit analysis and resume matching" },
  { key: "application_tracking", label: "Application tracker and follow-ups" },
  { key: "career_suggestions", label: "Career profile and role suggestions" },
  { key: "roadmaps", label: "Learning roadmaps and readiness plans" },
  { key: "proof_sprints", label: "Proof Sprints and project evidence" },
  { key: "search_playbook", label: "Search Playbook and outcome analytics" },
  { key: "offer_comparison", label: "Offer Trade-off Simulator" },
  { key: "application_packs", label: "Application-pack drafting" },
  { key: "csv_backups", label: "CSV import and export" },
] as const;

type FeatureKey = (typeof FEATURES)[number]["key"];
type SurveyRating = "1" | "2" | "3" | "4" | "5";
type SurveyChoice = "yes" | "no" | "not_sure";

interface FeedbackPayload {
  overallRating: number;
  featureRatings: { feature: FeatureKey; usefulness: number }[];
  needsImprovement: SurveyChoice;
  improvementNotes: string | null;
  mostValuable: string | null;
  mainFriction: string | null;
  wouldPay: SurveyChoice;
  fairMonthlyPrice: string | null;
}

const RATING_LABELS: Record<SurveyRating, string> = {
  "1": "Not useful",
  "2": "A little useful",
  "3": "Somewhat useful",
  "4": "Very useful",
  "5": "Extremely useful",
};

const FIELD_CLASS =
  "mt-2 min-h-11 w-full rounded-lg border border-[#2b2e3b] bg-[#0b0c12] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

function ChoiceGroup({
  name,
  value,
  onChange,
  choices,
  legend,
}: {
  name: string;
  value: string;
  onChange: (value: SurveyChoice) => void;
  choices: { value: SurveyChoice; label: string }[];
  legend: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-200">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {choices.map((choice) => (
          <label
            key={choice.value}
            className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs transition ${
              value === choice.value
                ? "border-blue-400/40 bg-blue-500/10 text-blue-100"
                : "border-[#2b2e3b] bg-[#0b0c12] text-slate-400 hover:border-slate-500"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
              className="accent-blue-500"
            />
            {choice.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function FeedbackPage() {
  const [overallRating, setOverallRating] = useState<SurveyRating | "">("");
  const [featureRatings, setFeatureRatings] = useState<
    Partial<Record<FeatureKey, SurveyRating>>
  >({});
  const [needsImprovement, setNeedsImprovement] =
    useState<SurveyChoice | null>(null);
  const [improvementNotes, setImprovementNotes] = useState("");
  const [mostValuable, setMostValuable] = useState("");
  const [mainFriction, setMainFriction] = useState("");
  const [wouldPay, setWouldPay] = useState<SurveyChoice | null>(null);
  const [fairMonthlyPrice, setFairMonthlyPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!overallRating || !needsImprovement || !wouldPay) {
      setError("Please complete the overall rating, improvement, and payment questions.");
      return;
    }

    const ratings = Object.entries(featureRatings)
      .filter((entry): entry is [FeatureKey, SurveyRating] => Boolean(entry[1]))
      .map(([feature, usefulness]) => ({
        feature,
        usefulness: Number(usefulness),
      }));
    if (ratings.length === 0) {
      setError("Rate at least one feature you tried.");
      return;
    }

    const payload: FeedbackPayload = {
      overallRating: Number(overallRating),
      featureRatings: ratings,
      needsImprovement,
      improvementNotes: improvementNotes.trim() || null,
      mostValuable: mostValuable.trim() || null,
      mainFriction: mainFriction.trim() || null,
      wouldPay,
      fairMonthlyPrice:
        wouldPay !== "no" ? fairMonthlyPrice.trim() || null : null,
    };

    setSubmitting(true);
    try {
      await fetcher<{ submitted: boolean }>("/feedback", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSubmitted(true);
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send your feedback. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="Share feedback"
        description="Finished exploring JobHunter? Sign-in is required to submit, but your answers are saved without your account ID or email."
      />

      {submitted ? (
        <section
          role="status"
          className="mx-auto max-w-2xl rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-6 sm:p-8"
        >
          <CheckCircle2 className="size-8 text-emerald-300" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-white">
            Thank you for helping shape JobHunter.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Your answers were submitted without your account ID or email
            address. Your honest feedback is valuable, whether it is positive,
            critical, or somewhere in between.
          </p>
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-5">
          <section className="space-y-5 rounded-xl border border-[#1f212d] bg-[#12131a] p-5 sm:p-6">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Your overall experience
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                There are no right answers. Please rate the app you actually
                tried, not the app you think we want to hear about.
              </p>
            </div>

            <label
              htmlFor="overall-rating"
              className="block text-sm font-medium text-slate-200"
            >
              Overall, how useful was JobHunter? <span className="text-blue-300">*</span>
              <select
                id="overall-rating"
                required
                value={overallRating}
                onChange={(event) =>
                  setOverallRating(event.target.value as SurveyRating | "")
                }
                className={FIELD_CLASS}
              >
                <option value="">Choose a rating</option>
                <option value="1">1 — Not useful</option>
                <option value="2">2 — A little useful</option>
                <option value="3">3 — Somewhat useful</option>
                <option value="4">4 — Very useful</option>
                <option value="5">5 — Extremely useful</option>
              </select>
            </label>

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-slate-200">
                Rate the features you tried{" "}
                <span className="text-blue-300">*</span>
              </legend>
              <p className="text-xs leading-5 text-slate-500">
                Leave features you did not try at “Not tried.” Rate at least
                one feature.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {FEATURES.map((feature) => (
                  <label
                    key={feature.key}
                    htmlFor={`feature-${feature.key}`}
                    className="rounded-lg border border-[#252836] bg-[#0e0f16] p-3"
                  >
                    <span className="block text-xs font-medium leading-5 text-slate-200">
                      {feature.label}
                    </span>
                    <select
                      id={`feature-${feature.key}`}
                      value={featureRatings[feature.key] ?? ""}
                      onChange={(event) => {
                        const rating = event.target.value as SurveyRating | "";
                        setFeatureRatings((current) => {
                          const updated = { ...current };
                          if (rating) updated[feature.key] = rating;
                          else delete updated[feature.key];
                          return updated;
                        });
                      }}
                      className="mt-2 min-h-10 w-full rounded-md border border-[#2b2e3b] bg-[#090a0f] px-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                    >
                      <option value="">Not tried</option>
                      {(["1", "2", "3", "4", "5"] as const).map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} — {RATING_LABELS[rating]}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </fieldset>

            <ChoiceGroup
              name="needs-improvement"
              legend="Do you think JobHunter needs improvement? *"
              value={needsImprovement ?? ""}
              onChange={(choice) => {
                setNeedsImprovement(choice);
                if (choice !== "yes") setImprovementNotes("");
              }}
              choices={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No, not right now" },
                { value: "not_sure", label: "Not sure" },
              ]}
            />

            {needsImprovement === "yes" && (
              <label
                htmlFor="improvement-notes"
                className="block text-sm font-medium text-slate-200"
              >
                What would you improve first?
                <Textarea
                  id="improvement-notes"
                  maxLength={1500}
                  value={improvementNotes}
                  onChange={(event) => setImprovementNotes(event.target.value)}
                  placeholder="Tell us what felt confusing, slow, missing, or less useful than expected."
                  className="mt-2 min-h-24 border-[#2b2e3b] bg-[#0b0c12] text-sm text-white placeholder:text-slate-600 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
                />
              </label>
            )}

            <label
              htmlFor="most-valuable"
              className="block text-sm font-medium text-slate-200"
            >
              What was the most valuable part for you?
              <Textarea
                id="most-valuable"
                maxLength={800}
                value={mostValuable}
                onChange={(event) => setMostValuable(event.target.value)}
                placeholder="A feature, task, or moment that genuinely helped."
                className="mt-2 min-h-20 border-[#2b2e3b] bg-[#0b0c12] text-sm text-white placeholder:text-slate-600 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
              />
            </label>

            <label
              htmlFor="main-friction"
              className="block text-sm font-medium text-slate-200"
            >
              What, if anything, was confusing or got in your way?
              <Textarea
                id="main-friction"
                maxLength={1200}
                value={mainFriction}
                onChange={(event) => setMainFriction(event.target.value)}
                placeholder="Mention any bugs, unclear wording, or steps that were hard to complete."
                className="mt-2 min-h-20 border-[#2b2e3b] bg-[#0b0c12] text-sm text-white placeholder:text-slate-600 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
              />
            </label>
          </section>

          <section className="space-y-5 rounded-xl border border-[#1f212d] bg-[#12131a] p-5 sm:p-6">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Would you pay for something like this?
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                We are testing real interest, not looking for a polite yes.
              </p>
            </div>
            <ChoiceGroup
              name="would-pay"
              legend="If JobHunter were available to you, would you pay to use it? *"
              value={wouldPay ?? ""}
              onChange={(choice) => {
                setWouldPay(choice);
                if (choice === "no") setFairMonthlyPrice("");
              }}
              choices={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "not_sure", label: "Not sure" },
              ]}
            />
            {wouldPay && wouldPay !== "no" && (
              <label
                htmlFor="fair-monthly-price"
                className="block text-sm font-medium text-slate-200"
              >
                What monthly price would feel fair? (optional)
                <input
                  id="fair-monthly-price"
                  type="text"
                  maxLength={100}
                  value={fairMonthlyPrice}
                  onChange={(event) => setFairMonthlyPrice(event.target.value)}
                  placeholder="Include currency, e.g. $5/month or R100/month"
                  className={FIELD_CLASS}
                />
              </label>
            )}
          </section>

          <div className="space-y-3">
            <p className="text-xs leading-5 text-slate-500">
              This feedback is stored without your account ID or email. Please
              do not include names, contact details, or sensitive personal
              information in your answers.
            </p>
            {error && (
              <p role="alert" className="text-sm text-rose-400">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Sending feedback...
                </>
              ) : (
                <>
                  <MessageSquareText className="size-4" aria-hidden="true" />
                  Submit anonymous feedback
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

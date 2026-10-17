"use client";

import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Check,
  CircleUserRound,
  Compass,
  GraduationCap,
  Loader2,
  MapPin,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/api";
import { DashboardPageHeader } from "@/components/dashboard/page-header";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
}

interface CareerProfile {
  careerSummary: string;
  skills: string;
  workHistory: string;
  education: string;
  accomplishments: string;
  experienceLevel: string;
  targetRoles: string;
  preferredLocation: string;
  workArrangement: string;
}

interface JobRoleRecommendation {
  roleTitle: string;
  seniority: string;
  matchType: "CLOSE_FIT" | "ADJACENT" | "GROWTH_ROLE";
  reason: string;
  evidence: string[];
  skillsToBuild: string[];
}

const emptyCareerProfile: CareerProfile = {
  careerSummary: "",
  skills: "",
  workHistory: "",
  education: "",
  accomplishments: "",
  experienceLevel: "",
  targetRoles: "",
  preferredLocation: "",
  workArrangement: "Any",
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [careerProfile, setCareerProfile] = useState(emptyCareerProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [recommendationConsent, setRecommendationConsent] = useState(false);
  const [recommendations, setRecommendations] = useState<
    JobRoleRecommendation[]
  >([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    async function loadProfile() {
      try {
        const [userProfile, savedCareerProfile] = await Promise.all([
          fetcher<UserProfile>("/user"),
          fetcher<Partial<CareerProfile>>("/career-profile"),
        ]);
        setProfile(userProfile);
        setCareerProfile({
          careerSummary: savedCareerProfile.careerSummary ?? "",
          skills: savedCareerProfile.skills ?? "",
          workHistory: savedCareerProfile.workHistory ?? "",
          education: savedCareerProfile.education ?? "",
          accomplishments: savedCareerProfile.accomplishments ?? "",
          experienceLevel: savedCareerProfile.experienceLevel ?? "",
          targetRoles: savedCareerProfile.targetRoles ?? "",
          preferredLocation: savedCareerProfile.preferredLocation ?? "",
          workArrangement: savedCareerProfile.workArrangement ?? "Any",
        });
        setProfileSaved(true);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load account details.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function updateCareerProfile<K extends keyof CareerProfile>(
    key: K,
    value: CareerProfile[K],
  ) {
    setCareerProfile((current) => ({ ...current, [key]: value }));
    setProfileSaved(false);
    setRecommendations([]);
    setRecommendationError(null);
  }

  async function handleSaveCareerProfile(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const savedProfile = await fetcher<CareerProfile>("/career-profile", {
        method: "PUT",
        body: JSON.stringify(careerProfile),
      });
      setCareerProfile({
        careerSummary: savedProfile.careerSummary ?? "",
        skills: savedProfile.skills ?? "",
        workHistory: savedProfile.workHistory ?? "",
        education: savedProfile.education ?? "",
        accomplishments: savedProfile.accomplishments ?? "",
        experienceLevel: savedProfile.experienceLevel ?? "",
        targetRoles: savedProfile.targetRoles ?? "",
        preferredLocation: savedProfile.preferredLocation ?? "",
        workArrangement: savedProfile.workArrangement ?? "Any",
      });
      setProfileSaved(true);
      setRecommendations([]);
    } catch (saveError: unknown) {
      setSaveError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your career profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRecommendRoles() {
    setRecommendationLoading(true);
    setRecommendationError(null);
    setRecommendations([]);
    try {
      const result = await fetcher<{
        recommendations: JobRoleRecommendation[];
      }>("/career-profile/recommendations", {
        method: "POST",
        body: JSON.stringify({ aiProcessingConsent: recommendationConsent }),
      });
      setRecommendations(result.recommendations);
    } catch (requestError: unknown) {
      setRecommendationError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to suggest job roles.",
      );
    } finally {
      setRecommendationLoading(false);
    }
  }

  const profileFields = [
    careerProfile.careerSummary,
    careerProfile.skills,
    careerProfile.workHistory,
    careerProfile.education,
    careerProfile.accomplishments,
    careerProfile.experienceLevel,
    careerProfile.targetRoles,
    careerProfile.preferredLocation,
  ];
  const completedProfileFields = profileFields.filter((value) =>
    value.trim(),
  ).length;
  const profileCompletion = Math.round(
    (completedProfileFields / profileFields.length) * 100,
  );
  const profileInitial = (profile.name || profile.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="w-full max-w-5xl space-y-6">
      <DashboardPageHeader
        title="Settings"
        description="Manage your account details and shape the career guidance JobHunter gives you."
      />

      {loading ? (
        <div className="flex h-40 items-center justify-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading account details...</span>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-4 text-sm text-rose-300"
        >
          {error}
        </div>
      ) : profile ? (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-[#252836] bg-[#12131a]">
            <div className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-blue-500/[0.09] via-transparent to-violet-500/[0.06] p-5 sm:p-6">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-xl font-semibold text-blue-200">
                {profileInitial}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-white">
                    {profile.name || "Your account"}
                  </h2>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                    Account active
                  </span>
                </div>
                <p className="mt-1 break-all text-sm text-slate-400">
                  {profile.email}
                </p>
              </div>
              <div className="rounded-lg border border-[#303342] bg-[#0d0e14]/70 px-3 py-2 text-[11px] text-slate-400">
                Managed by your sign-in provider
              </div>
            </div>
            <div className="grid gap-0 border-t border-[#1f212d] sm:grid-cols-2 sm:divide-x sm:divide-[#1f212d]">
              <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
                <User className="size-4 text-slate-500" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    Account name
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-200">
                    {profile.name || "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-t border-[#1f212d] px-5 py-4 sm:border-t-0 sm:px-6">
                <CircleUserRound className="size-4 text-slate-500" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    Sign-in email
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-200">
                    {profile.email}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#252836] bg-[#12131a]">
            <div className="border-b border-[#1f212d] px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
                    <BriefcaseBusiness className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Career profile
                    </h2>
                    <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">
                      Add the experience and preferences you want career
                      suggestions to use. More detail helps make them more
                      relevant.
                    </p>
                  </div>
                </div>
                <div className="min-w-44 rounded-xl border border-[#2b2e3b] bg-[#0d0e14] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Profile detail
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {completedProfileFields}/{profileFields.length}
                    </span>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#252836]"
                    role="progressbar"
                    aria-label="Career profile detail"
                    aria-valuemin={0}
                    aria-valuemax={profileFields.length}
                    aria-valuenow={completedProfileFields}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-400 transition-all"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <form onSubmit={handleSaveCareerProfile}>
              <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#1f212d] pb-3">
                  <Target className="size-4 text-blue-300" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Professional snapshot
                  </h3>
                </div>
                <div className="space-y-2">
                <label
                  htmlFor="career-summary"
                  className="text-xs font-medium text-slate-300"
                >
                  Experience summary
                </label>
                <Textarea
                  id="career-summary"
                  value={careerProfile.careerSummary}
                  onChange={(event) =>
                    updateCareerProfile("careerSummary", event.target.value)
                  }
                  maxLength={2500}
                  rows={4}
                  placeholder="Describe your work, projects, education, or career change in a few sentences."
                  className="resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                />
                <p className="text-right text-[11px] text-slate-500">
                  {careerProfile.careerSummary.length.toLocaleString()} / 2,500
                </p>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="career-skills"
                  className="text-xs font-medium text-slate-300"
                >
                  Skills
                </label>
                <Textarea
                  id="career-skills"
                  value={careerProfile.skills}
                  onChange={(event) =>
                    updateCareerProfile("skills", event.target.value)
                  }
                  maxLength={2500}
                  rows={3}
                  placeholder="Python, SQL, customer support, project coordination..."
                  className="resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                />
                <p className="text-right text-[11px] text-slate-500">
                  {careerProfile.skills.length.toLocaleString()} / 2,500
                </p>
              </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#1f212d] pb-3">
                  <GraduationCap className="size-4 text-emerald-300" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Experience and evidence
                  </h3>
                </div>
              <div className="space-y-2">
                <label
                  htmlFor="career-work-history"
                  className="text-xs font-medium text-slate-300"
                >
                  Work history{" "}
                  <span className="text-slate-500">(optional)</span>
                </label>
                <Textarea
                  id="career-work-history"
                  value={careerProfile.workHistory}
                  onChange={(event) =>
                    updateCareerProfile("workHistory", event.target.value)
                  }
                  maxLength={6000}
                  rows={5}
                  placeholder="Role, employer, dates, responsibilities, and relevant tools or methods. One position per paragraph."
                  className="resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                />
                <p className="text-right text-[11px] text-slate-500">
                  {careerProfile.workHistory.length.toLocaleString()} / 6,000
                </p>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="career-education"
                  className="text-xs font-medium text-slate-300"
                >
                  Education <span className="text-slate-500">(optional)</span>
                </label>
                <Textarea
                  id="career-education"
                  value={careerProfile.education}
                  onChange={(event) =>
                    updateCareerProfile("education", event.target.value)
                  }
                  maxLength={3500}
                  rows={3}
                  placeholder="Qualification, institution, field of study, and completion year."
                  className="resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                />
                <p className="text-right text-[11px] text-slate-500">
                  {careerProfile.education.length.toLocaleString()} / 3,500
                </p>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="career-accomplishments"
                  className="text-xs font-medium text-slate-300"
                >
                  Accomplishments{" "}
                  <span className="text-slate-500">(optional)</span>
                </label>
                <Textarea
                  id="career-accomplishments"
                  value={careerProfile.accomplishments}
                  onChange={(event) =>
                    updateCareerProfile("accomplishments", event.target.value)
                  }
                  maxLength={3500}
                  rows={3}
                  placeholder="Projects delivered, measurable outcomes, awards, certifications, or portfolio work."
                  className="resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                />
                <p className="text-right text-[11px] text-slate-500">
                  {careerProfile.accomplishments.length.toLocaleString()} / 3,500
                </p>
              </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#1f212d] pb-3">
                  <Compass className="size-4 text-amber-300" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    What you&apos;re looking for
                  </h3>
                </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="experience-level"
                    className="text-xs font-medium text-slate-300"
                  >
                    Experience level
                  </label>
                  <select
                    id="experience-level"
                    value={careerProfile.experienceLevel}
                    onChange={(event) =>
                      updateCareerProfile("experienceLevel", event.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-[#2b2e3b] bg-[#090a0f] px-3 text-sm text-white outline-none focus-visible:border-blue-400"
                  >
                    <option value="">Not specified</option>
                    <option value="Student">Student</option>
                    <option value="Entry level">Entry level</option>
                    <option value="Junior">Junior</option>
                    <option value="Mid-level">Mid-level</option>
                    <option value="Senior">Senior</option>
                    <option value="Career changer">Career changer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="preferred-location"
                    className="text-xs font-medium text-slate-300"
                  >
                    Preferred location
                  </label>
                  <Input
                    id="preferred-location"
                    value={careerProfile.preferredLocation}
                    onChange={(event) =>
                      updateCareerProfile(
                        "preferredLocation",
                        event.target.value,
                      )
                    }
                    maxLength={160}
                    placeholder="City, region, or country"
                    className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="target-roles"
                    className="text-xs font-medium text-slate-300"
                  >
                    Roles of interest{" "}
                    <span className="text-slate-500">(optional)</span>
                  </label>
                  <Input
                    id="target-roles"
                    value={careerProfile.targetRoles}
                    onChange={(event) =>
                      updateCareerProfile("targetRoles", event.target.value)
                    }
                    maxLength={500}
                    placeholder="Junior Python developer, QA analyst"
                    className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="work-arrangement"
                    className="text-xs font-medium text-slate-300"
                  >
                    Work arrangement
                  </label>
                  <select
                    id="work-arrangement"
                    value={careerProfile.workArrangement}
                    onChange={(event) =>
                      updateCareerProfile("workArrangement", event.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-[#2b2e3b] bg-[#090a0f] px-3 text-sm text-white outline-none focus-visible:border-blue-400"
                  >
                    <option value="Any">Any</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
              </div>
              </section>
              {saveError && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5 text-xs text-rose-300"
                >
                  {saveError}
                </div>
              )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1f212d] bg-[#0d0e14]/60 px-5 py-4 sm:px-6">
                <p className="text-[11px] text-slate-500">
                  {profileSaved
                    ? "Your career profile is up to date."
                    : "Remember to save your changes before requesting suggestions."}
                </p>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white hover:bg-blue-500"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : profileSaved ? (
                    <Check className="h-4 w-4" />
                  ) : null}
                  {saving
                    ? "Saving profile..."
                    : profileSaved
                      ? "Profile saved"
                      : "Save career profile"}
                </Button>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#252836] bg-[#12131a]">
            <div className="border-b border-[#1f212d] px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Suggested roles
                  </h2>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">
                    Explore roles based on your saved experience and
                    preferences. Suggestions are starting points, not a
                    guarantee of job fit.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <label className="flex items-start gap-3 rounded-xl border border-[#2b2e3b] bg-[#0d0e14] p-4 text-xs leading-5 text-slate-400">
                <input
                  type="checkbox"
                  checked={recommendationConsent}
                  onChange={(event) =>
                    setRecommendationConsent(event.target.checked)
                  }
                  className="mt-0.5 size-4 shrink-0 accent-emerald-500"
                />
                <span>
                  Send my saved career profile to Groq to generate role
                  suggestions. Your profile is only sent when you request
                  suggestions.
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={handleRecommendRoles}
                  disabled={
                    !profileSaved ||
                    !recommendationConsent ||
                    recommendationLoading
                  }
                  className="bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  {recommendationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {recommendationLoading
                    ? "Finding suitable roles..."
                    : recommendations.length > 0
                      ? "Refresh suggestions"
                      : "Suggest job roles"}
                </Button>
                {!profileSaved && (
                  <p className="text-xs text-amber-300">
                    Save your profile changes first.
                  </p>
                )}
              </div>
              {recommendationError && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5 text-xs text-rose-300"
                >
                  {recommendationError}
                </div>
              )}
              {recommendations.length > 0 && (
                <div className="grid gap-3 border-t border-[#1f212d] pt-4 md:grid-cols-2">
                {recommendations.map((recommendation) => (
                  <article
                    key={recommendation.roleTitle}
                    className="rounded-xl border border-[#252836] bg-[#0d0e14] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white">
                        {recommendation.roleTitle}
                      </h3>
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-300">
                        {recommendation.matchType.replaceAll("_", " ").toLowerCase()}
                      </span>
                    </div>
                    {recommendation.seniority && (
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        {recommendation.seniority}
                      </p>
                    )}
                    <p className="mt-2 text-xs leading-5 text-slate-300">
                      {recommendation.reason}
                    </p>
                    {recommendation.evidence.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Profile evidence
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {recommendation.evidence.join(" · ")}
                        </p>
                      </div>
                    )}
                    {recommendation.skillsToBuild.length > 0 && (
                      <div className="mt-3 border-t border-[#1f212d] pt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/80">
                          Skills to build
                        </p>
                        <p className="mt-1 text-xs leading-5 text-amber-200/80">
                          {recommendation.skillsToBuild.join(" · ")}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
                </div>
              </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

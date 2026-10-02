"use client";

import { useEffect, useState } from "react";
import { User, Loader2 } from "lucide-react";
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

  return (
    <div className="w-full space-y-6 max-w-4xl">
      <DashboardPageHeader
        title="Account Settings"
        description="Review your account and manage the profile used for job suggestions."
      />

      {loading ? (
        <div className="flex h-40 items-center justify-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading account details...</span>
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-rose-400">
          {error}
        </p>
      ) : profile ? (
        <div className="max-w-4xl space-y-6">
          <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-6">
            <div className="mb-5 flex items-center gap-2 border-b border-[#1f212d] pb-4 text-sm font-semibold text-white">
              <User className="h-4 w-4 text-blue-400" />
              Account Profile
            </div>
            <dl className="grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-400">Name</dt>
                <dd className="mt-1 text-slate-100">
                  {profile.name || "Not set"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Email</dt>
                <dd className="mt-1 break-all text-slate-100">
                  {profile.email}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-6">
            <div className="mb-5 border-b border-[#1f212d] pb-4">
              <h2 className="text-sm font-semibold text-white">
                Career profile
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Add the experience and preferences you want role suggestions to
                use.
              </p>
            </div>
            <form className="space-y-5" onSubmit={handleSaveCareerProfile}>
              <div className="space-y-2">
                <label
                  htmlFor="career-summary"
                  className="text-xs text-slate-300"
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
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="career-skills"
                  className="text-xs text-slate-300"
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
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="career-work-history"
                  className="text-xs text-slate-300"
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
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="career-education"
                  className="text-xs text-slate-300"
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
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="career-accomplishments"
                  className="text-xs text-slate-300"
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
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="experience-level"
                    className="text-xs text-slate-300"
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
                    className="text-xs text-slate-300"
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
                    className="text-xs text-slate-300"
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
                    className="text-xs text-slate-300"
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
              {saveError && (
                <p role="alert" className="text-xs text-rose-400">
                  {saveError}
                </p>
              )}
              <div className="flex justify-end border-t border-[#1f212d] pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white hover:bg-blue-500"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Saving profile..." : "Save career profile"}
                </Button>
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-white">
                Suggested roles
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Suggestions use your saved profile and are not a guarantee of
                job fit.
              </p>
            </div>
            <label className="mb-4 flex items-start gap-2.5 text-xs leading-5 text-slate-400">
              <input
                type="checkbox"
                checked={recommendationConsent}
                onChange={(event) =>
                  setRecommendationConsent(event.target.checked)
                }
                className="mt-1 size-4 shrink-0 accent-blue-500"
              />
              <span>
                Send my saved career profile to Groq to generate role
                suggestions.
              </span>
            </label>
            <Button
              type="button"
              onClick={handleRecommendRoles}
              disabled={
                !profileSaved || !recommendationConsent || recommendationLoading
              }
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {recommendationLoading && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {recommendationLoading
                ? "Finding suitable roles..."
                : "Suggest job roles"}
            </Button>
            {!profileSaved && (
              <p className="mt-2 text-xs text-amber-300">
                Save profile changes before requesting suggestions.
              </p>
            )}
            {recommendationError && (
              <p role="alert" className="mt-3 text-xs text-rose-400">
                {recommendationError}
              </p>
            )}
            {recommendations.length > 0 && (
              <div className="mt-5 divide-y divide-[#1f212d] border-t border-[#1f212d]">
                {recommendations.map((recommendation) => (
                  <article key={recommendation.roleTitle} className="py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white">
                        {recommendation.roleTitle}
                      </h3>
                      <span className="text-[10px] font-mono uppercase text-emerald-300">
                        {recommendation.matchType.replaceAll("_", " ")}
                      </span>
                    </div>
                    {recommendation.seniority && (
                      <p className="mt-1 text-xs text-slate-500">
                        {recommendation.seniority}
                      </p>
                    )}
                    <p className="mt-2 text-xs leading-5 text-slate-300">
                      {recommendation.reason}
                    </p>
                    {recommendation.evidence.length > 0 && (
                      <p className="mt-2 text-xs text-slate-400">
                        Profile evidence: {recommendation.evidence.join(" · ")}
                      </p>
                    )}
                    {recommendation.skillsToBuild.length > 0 && (
                      <p className="mt-1 text-xs text-amber-300">
                        Build next: {recommendation.skillsToBuild.join(" · ")}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

import React from "react";

interface AuthSidebarProps {
  mode: "login" | "signup";
}

export function AuthSidebar({ mode }: AuthSidebarProps) {
  return (
    <div className="hidden lg:flex w-5/12 flex-col justify-between p-12 border-r border-[#1f212d] relative bg-[#090a0f] bg-grid-pattern">
      <div>
        {/* Header Logo */}
        <div className="flex items-center gap-3 mb-14">
          <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/25">
            ⚡
          </div>
          <span className="font-semibold text-lg text-white tracking-tight">
            Career Co-Pilot
          </span>
        </div>

        {/* Feature List */}
        <div className="space-y-8">
          {mode === "login" ? (
            <>
              <FeatureItem
                icon="🗺️"
                title="Personalised roadmaps"
                description="AI-generated skill tracks tailored to your experience and target role."
              />
              <FeatureItem
                icon="✅"
                title="Project-based learning"
                description="Real portfolio projects with step-by-step task checklists you can check off."
              />
              <FeatureItem
                icon="📊"
                title="Skill gap analysis"
                description="Know exactly where you stand with a live readiness score and gap summary."
              />
            </>
          ) : (
            <>
              <div className="text-xs uppercase tracking-wider text-slate-500 font-mono mb-4">
                What you get for free
              </div>
              <CheckFeatureItem text="3 AI-generated roadmaps free" />
              <CheckFeatureItem text="Real portfolio project tracks" />
              <CheckFeatureItem text="Live skill readiness score" />
              <CheckFeatureItem text="No credit card required" />
            </>
          )}
        </div>
      </div>

      {/* Testimonial Box (Sign up view) */}
      {mode === "signup" && (
        <div className="p-5 bg-[#12131a]/90 border border-[#1f212d] rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex -space-x-2">
              <span className="w-7 h-7 rounded-full bg-blue-500 border-2 border-[#12131a] block" />
              <span className="w-7 h-7 rounded-full bg-purple-500 border-2 border-[#12131a] block" />
              <span className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-[#12131a] block" />
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Joined by 4,200+ developers
            </span>
          </div>
          <p className="text-sm italic text-slate-300 leading-relaxed">
            "The roadmap got me from tutorial hell to landing my first dev job in 4 months."
          </p>
          <p className="text-xs text-slate-500 font-mono mt-2">
            — Priya S., Junior Frontend Engineer
          </p>
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-slate-600 font-mono">© 2026 Career Co-Pilot</p>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="text-xl p-2 bg-[#12131a] border border-[#1f212d] rounded-xl">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function CheckFeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs">
        ✓
      </div>
      <span className="text-sm text-slate-300">{text}</span>
    </div>
  );
}
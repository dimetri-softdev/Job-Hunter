import type { ReactNode } from "react";
import {
  BriefcaseBusiness,
  FileSearch,
  Sparkles,
  UserRound,
} from "lucide-react";

interface AuthSidebarProps {
  mode: "login" | "signup";
}

export function AuthSidebar({ mode }: AuthSidebarProps) {
  const headline =
    mode === "login"
      ? "Find a direction. Make your next move."
      : "Start with the role you want.";

  return (
    <aside className="relative flex shrink-0 flex-col justify-between overflow-hidden border-b border-[#1f212d] bg-[#0d0e14] px-6 py-5 md:min-h-dvh md:w-[42%] md:border-b-0 md:border-r md:px-8 md:py-10 lg:px-12">
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 hidden w-px bg-blue-500/30 md:block"
      />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-600/15 text-blue-300">
            <Sparkles className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            JobHunter<span className="text-blue-400">.ai</span>
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-400 md:hidden">
          A clearer path from experience to opportunity.
        </p>

        <div className="mt-12 hidden max-w-lg md:block lg:mt-20">
          <p className="text-xs font-semibold uppercase text-blue-300">
            Career search, with a next step
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-white lg:text-5xl">
            {headline}
          </h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-400">
            Bring your experience, role ideas, and job opportunities into one
            focused workspace.
          </p>

          <ol className="mt-10 space-y-5 border-l border-blue-500/30 pl-5">
            <WorkflowStep
              icon={<UserRound className="size-4" />}
              title="Build your profile"
              description="Capture the experience and skills you want to use."
            />
            <WorkflowStep
              icon={<FileSearch className="size-4" />}
              title="Check a role"
              description="Compare your background with a specific opportunity."
            />
            <WorkflowStep
              icon={<BriefcaseBusiness className="size-4" />}
              title="Prepare your next step"
              description="Review application drafts and keep opportunities organized."
            />
          </ol>
        </div>
      </div>

      <p className="relative mt-5 hidden text-xs text-slate-500 md:block">
        © 2026 JobHunter
      </p>
    </aside>
  );
}

function WorkflowStep({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-blue-500/25 bg-[#12131a] text-blue-300">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

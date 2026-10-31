"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Compass,
  Briefcase,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  FileText,
  CreditCard,
  Bot,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ActionHint } from "@/components/action-hint";

const navItems = [
  {
    name: "Career dashboard",
    description: "Your next steps and current progress",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Search insights",
    description: "Patterns in your job search",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Learning plans",
    description: "Learning plans and project tasks",
    href: "/roadmaps",
    icon: Compass,
  },
  {
    name: "Job applications",
    description: "Saved jobs, status, and follow-ups",
    href: "/applications",
    icon: Briefcase,
  },
  {
    name: "Account settings",
    description: "Your profile and account preferences",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "Resume update",
    description: "Create a role-specific resume draft",
    href: "/resume-update",
    icon: FileText,
  },
  {
    name: "Cover letter",
    description: "Generate a tailored cover letter",
    href: "/cover-letter",
    icon: FileText,
  },
  {
    name: "Plans & usage",
    description: "Your access, plan limits, and billing status",
    href: "/billing",
    icon: CreditCard,
  },
  {
    name: "Send feedback",
    description: "Send an idea or report an issue",
    href: "/feedback",
    icon: MessageSquareText,
  },
  {
    name: "AI assistant",
    description: "Product help and career guidance",
    href: "/assistant",
    icon: Bot,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <aside
        className={`relative z-30 h-full shrink-0 overflow-hidden border-r border-[#1f212d] bg-[#0d0e14] transition-[width,border-color] duration-300 ease-in-out ${
          collapsed ? "w-0 border-transparent" : "w-[4.75rem] md:w-64"
        }`}
      >
        <div
          className={`flex h-full w-[4.75rem] flex-col transition-[transform,opacity] duration-300 ease-in-out md:w-64 ${
            collapsed
              ? "pointer-events-none -translate-x-full opacity-0"
              : "translate-x-0 opacity-100"
          }`}
          aria-hidden={collapsed}
          inert={collapsed}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#1f212d] px-1 md:px-4">
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              <BrandLogo compact className="size-9 md:hidden" />
              <BrandLogo className="hidden h-11 w-[198px] md:block" />
            </div>

            <ActionHint
              placement="right"
              label="Hide the dashboard navigation"
              className="inline-flex"
            >
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-[#1f212d] hover:text-white md:p-1.5"
                aria-label="Hide dashboard navigation"
              >
                <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </button>
            </ActionHint>
          </div>

          <nav
            className="flex-1 space-y-1 overflow-y-auto p-1.5 md:space-y-1.5 md:p-3"
            aria-label="Dashboard navigation"
          >
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <ActionHint
                  key={item.name}
                  label={item.description}
                  placement="right"
                  className="block w-full"
                >
                  <Link
                    href={item.href}
                    title={`${item.name}: ${item.description}`}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-center text-[9px] font-medium leading-tight transition-[color,background-color,border-color] duration-200 md:min-h-0 md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-left md:text-sm ${
                      isActive
                        ? "border-blue-500/20 bg-blue-600/10 text-blue-400"
                        : "border-transparent text-slate-400 hover:bg-[#141620] hover:text-slate-200"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="min-w-0 md:block">
                      <span className="block truncate">{item.name}</span>
                      <span className="hidden truncate text-[10px] font-normal text-slate-500 md:block">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                </ActionHint>
              );
            })}
          </nav>
        </div>
      </aside>

      {collapsed ? (
        <ActionHint
          placement="right"
          label="Show dashboard navigation"
          className="fixed left-0 top-20 z-50"
        >
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="rounded-r-lg border border-l-0 border-[#2b2e3b] bg-[#141620] p-2 text-slate-300 shadow-lg transition-colors hover:bg-blue-600 hover:text-white"
            aria-label="Show dashboard navigation"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </ActionHint>
      ) : null}
    </>
  );
}

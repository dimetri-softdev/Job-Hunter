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
  Sparkles,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Roadmaps", href: "/roadmaps", icon: Compass },
  { name: "Applications", href: "/applications", icon: Briefcase },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative z-30 flex shrink-0 flex-col border-r border-[#1f212d] bg-[#0d0e14] transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-16 md:w-20" : "w-16 md:w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-center border-b border-[#1f212d] px-2 md:justify-between md:px-4">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-600/20 text-blue-400">
            <Sparkles className="h-5 w-5 text-blue-400" />
          </div>
          {!collapsed && (
            <span className="hidden truncate text-lg font-bold tracking-wide text-white md:inline">
              JobHunter<span className="text-blue-500">.ai</span>
            </span>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-[#1f212d] hover:text-white md:inline-flex"
          aria-label="Toggle Sidebar"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav
        className="flex-1 space-y-1.5 p-2 md:p-3"
        aria-label="Dashboard navigation"
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center justify-center gap-3 rounded-xl border px-2 py-2.5 text-sm font-medium transition-[color,background-color,border-color] duration-200 md:justify-start md:px-3 ${
                isActive
                  ? "border-blue-500/20 bg-blue-600/10 text-blue-400"
                  : "border-transparent text-slate-400 hover:bg-[#141620] hover:text-slate-200"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span className="hidden truncate md:inline">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

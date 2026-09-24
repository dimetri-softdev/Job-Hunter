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
      className={`relative flex flex-col border-r border-[#1f212d] bg-[#0d0e14] transition-all duration-300 z-30 shrink-0 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#1f212d]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Sparkles className="h-5 w-5 text-blue-400" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-white tracking-wide truncate">
              JobHunter<span className="text-blue-500">.ai</span>
            </span>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-[#1f212d] hover:text-white transition-colors"
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
      <nav className="flex-1 space-y-1.5 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                  : "text-slate-400 hover:bg-[#141620] hover:text-slate-200"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* System Status / Plan Badge */}
      {!collapsed && (
        <div className="m-3 p-3 bg-[#12131a] border border-[#1f212d] rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 font-mono">
            <span>FastAPI Backend</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          </div>
          <div className="w-full bg-[#1f212d] h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full w-[85%]" />
          </div>
        </div>
      )}
    </aside>
  );
}

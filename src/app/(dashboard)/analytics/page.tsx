"use client";

import React from "react";
import { BarChart3, TrendingUp, CheckCircle2, Clock, Zap } from "lucide-react";

export default function AnalyticsPage() {
  const stats = [
    { label: "Roadmaps Completed", value: "3", change: "+1 this month", icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Tasks Finished", value: "24/32", change: "75% completion rate", icon: Zap, color: "text-blue-400" },
    { label: "Study Time", value: "38 hrs", change: "+12 hrs vs last week", icon: Clock, color: "text-amber-400" },
    { label: "Readiness Delta", value: "+18%", change: "Score up to 75/100", icon: TrendingUp, color: "text-indigo-400" },
  ];

  const skills = [
    { name: "Next.js / React", level: 85, category: "Frontend" },
    { name: "FastAPI / Python", level: 78, category: "Backend" },
    { name: "Tailwind CSS", level: 92, category: "UI/UX" },
    { name: "PostgreSQL / Prisma", level: 64, category: "Database" },
    { name: "Docker & CI/CD", level: 45, category: "DevOps" },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="pb-4 border-b border-[#1f212d]">
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics & Insights</h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor your skill progression, learning velocity, and roadmap activity.
        </p>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-[#12131a] border border-[#1f212d] rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  {item.label}
                </span>
                <Icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <div className="text-2xl font-bold text-white mt-2">{item.value}</div>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">{item.change}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Skill Mastery Breakdown */}
        <div className="col-span-12 lg:col-span-8 bg-[#12131a] border border-[#1f212d] rounded-2xl p-6 space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-[#1f212d]">
            <h2 className="font-semibold text-white text-sm">Skill Proficiency Matrix</h2>
            <span className="text-xs text-slate-400 font-mono">5 Tracked Skills</span>
          </div>

          <div className="space-y-4">
            {skills.map((skill) => (
              <div key={skill.name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-200 font-medium">{skill.name}</span>
                  <span className="text-slate-400 font-mono">{skill.level}%</span>
                </div>
                <div className="w-full bg-[#1f212d] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Velocity Card */}
        <div className="col-span-12 lg:col-span-4 bg-[#12131a] border border-[#1f212d] rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <BarChart3 className="h-5 w-5" />
              <h3 className="font-semibold text-white text-sm">Weekly Velocity</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              You are completing tasks <span className="text-emerald-400 font-semibold">18% faster</span> than last month. At this rate, your Full-Stack Engineer target will be reached in 3 weeks.
            </p>
          </div>

          <div className="p-4 bg-[#090a0f] border border-[#1f212d] rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-mono text-slate-500">Suggested Action</span>
            <p className="text-xs text-slate-300 font-medium">
              Complete the Docker deployment module to boost DevOps score by +15 pts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
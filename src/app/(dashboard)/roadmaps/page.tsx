"use client";

import React, { useState } from "react";
import { Compass, Plus, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";

export default function RoadmapsPage() {
  const [filter, setFilter] = useState("all");

  const roadmaps = [
    {
      id: "1",
      title: "Junior Full-Stack Engineer",
      role: "Software Engineering",
      status: "active",
      progress: 45,
      tasksCount: "3 of 8 completed",
      date: "Sep 2026",
      readiness: 75,
    },
    {
      id: "2",
      title: "Frontend Specialist — React / Next.js",
      role: "Frontend Development",
      status: "active",
      progress: 72,
      tasksCount: "8 of 11 completed",
      date: "Aug 2026",
      readiness: 88,
    },
    {
      id: "3",
      title: "DevOps & Cloud Architect",
      role: "Platform Engineering",
      status: "completed",
      progress: 100,
      tasksCount: "6 of 6 completed",
      date: "Jul 2026",
      readiness: 92,
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f212d]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Career Roadmaps
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your tailored AI pathways and track targeted role readiness.
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all">
          <Plus className="h-4 w-4" />
          New Roadmap
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {["all", "active", "completed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === tab
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:bg-[#12131a]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {roadmaps
          .filter((r) => filter === "all" || r.status === filter)
          .map((item) => (
            <div
              key={item.id}
              className="bg-[#12131a] border border-[#1f212d] hover:border-slate-700 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all group cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1f212d] text-slate-400">
                    {item.role}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>

                <div>
                  <h3 className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    Created {item.date}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#1f212d]">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 text-[11px] font-mono">
                    {item.tasksCount}
                  </span>
                  <span className="text-blue-400 font-bold font-mono">
                    {item.progress}%
                  </span>
                </div>

                <div className="w-full bg-[#1f212d] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

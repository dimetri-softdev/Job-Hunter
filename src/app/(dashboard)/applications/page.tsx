"use client";

import React from "react";
import { Briefcase, Plus, ExternalLink, Building2 } from "lucide-react";

export default function ApplicationsPage() {
  const applications = [
    {
      id: "1",
      company: "Vercel",
      role: "Junior Frontend Engineer",
      location: "Remote",
      stage: "Technical Interview",
      stageColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      appliedDate: "Sep 18, 2026",
    },
    {
      id: "2",
      company: "Supabase",
      role: "Full-Stack Developer",
      location: "Remote",
      stage: "Application Submitted",
      stageColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      appliedDate: "Sep 21, 2026",
    },
    {
      id: "3",
      company: "Stripe",
      role: "Backend Engineer",
      location: "Hybrid",
      stage: "Offer Received",
      stageColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      appliedDate: "Aug 30, 2026",
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f212d]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Job Applications
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track submitted applications, interview stages, and offers in real
            time.
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all">
          <Plus className="h-4 w-4" />
          Add Application
        </button>
      </div>

      {/* Applications Table */}
      <div className="bg-[#12131a] border border-[#1f212d] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090a0f] border-b border-[#1f212d] text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="p-4">Company & Role</th>
                <th className="p-4">Location</th>
                <th className="p-4">Applied Date</th>
                <th className="p-4">Stage</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f212d] text-slate-300">
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-[#181a24] transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#1f212d] rounded-lg text-slate-400">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {app.role}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {app.company}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-slate-400">
                    {app.location}
                  </td>
                  <td className="p-4 font-mono text-slate-400">
                    {app.appliedDate}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${app.stageColor}`}
                    >
                      {app.stage}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-1.5 hover:bg-[#1f212d] rounded-lg text-slate-400 hover:text-white transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

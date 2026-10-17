"use client";

import { useState } from "react";
import { AdminFeedbackPanel } from "@/components/dashboard/admin-feedback-panel";
import { AdminBillingPanel } from "@/components/dashboard/admin-billing-panel";
import { AdminUsersPanel } from "@/components/dashboard/admin-users-panel";

type AdminSection = "feedback" | "users" | "billing";

export function AdminDashboard() {
  const [section, setSection] = useState<AdminSection>("feedback");

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Admin dashboard sections"
        className="flex gap-2 border-b border-[#1f212d]"
      >
        {(
          [
            ["feedback", "Feedback"],
            ["users", "Users & admins"],
            ["billing", "Billing"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            id={`admin-tab-${value}`}
            type="button"
            role="tab"
            aria-selected={section === value}
            aria-controls={`admin-panel-${value}`}
            tabIndex={section === value ? 0 : -1}
            onClick={() => setSection(value)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? value === "feedback"
                    ? "users"
                    : value === "users"
                      ? "billing"
                      : "feedback"
                  : event.key === "ArrowLeft"
                    ? value === "users"
                      ? "feedback"
                      : value === "billing"
                        ? "users"
                        : "billing"
                    : null;
              if (next) {
                event.preventDefault();
                setSection(next);
                document.getElementById(`admin-tab-${next}`)?.focus();
              }
            }}
            className={`min-h-10 border-b-2 px-3 text-sm font-medium transition ${
              section === value
                ? "border-violet-400 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        id={`admin-panel-${section}`}
        role="tabpanel"
        aria-labelledby={`admin-tab-${section}`}
        tabIndex={0}
      >
        {section === "feedback" ? (
          <AdminFeedbackPanel />
        ) : section === "users" ? (
          <AdminUsersPanel />
        ) : (
          <AdminBillingPanel />
        )}
      </div>
    </div>
  );
}

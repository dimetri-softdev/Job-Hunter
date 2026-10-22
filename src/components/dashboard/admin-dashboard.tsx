"use client";

import { useState } from "react";
import { AdminFeedbackPanel } from "@/components/dashboard/admin-feedback-panel";
import { AdminBillingPanel } from "@/components/dashboard/admin-billing-panel";
import { AdminSupportPanel } from "@/components/dashboard/admin-support-panel";
import { AdminUsersPanel } from "@/components/dashboard/admin-users-panel";
import { AdminRemindersPanel } from "@/components/dashboard/admin-reminders-panel";

type AdminSectionWithSupport =
  | "feedback"
  | "users"
  | "billing"
  | "reminders"
  | "support";

const ADMIN_SECTIONS: { value: AdminSectionWithSupport; label: string }[] = [
  { value: "feedback", label: "Feedback" },
  { value: "users", label: "Users & admins" },
  { value: "billing", label: "Billing" },
  { value: "reminders", label: "Reminders" },
  { value: "support", label: "Support" },
];

export function AdminDashboard() {
  const [section, setSection] = useState<AdminSectionWithSupport>("feedback");

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Admin dashboard sections"
        className="flex gap-2 border-b border-[#1f212d]"
      >
        {ADMIN_SECTIONS.map(({ value, label }) => (
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
              const direction =
                event.key === "ArrowRight"
                  ? 1
                  : event.key === "ArrowLeft"
                    ? -1
                    : 0;
              if (direction) {
                event.preventDefault();
                const currentIndex = ADMIN_SECTIONS.findIndex(
                  (sectionItem) => sectionItem.value === value,
                );
                const nextIndex =
                  (currentIndex + direction + ADMIN_SECTIONS.length) %
                  ADMIN_SECTIONS.length;
                const next = ADMIN_SECTIONS[nextIndex].value;
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
        ) : section === "billing" ? (
          <AdminBillingPanel />
        ) : section === "reminders" ? (
          <AdminRemindersPanel />
        ) : (
          <AdminSupportPanel />
        )}
      </div>
    </div>
  );
}

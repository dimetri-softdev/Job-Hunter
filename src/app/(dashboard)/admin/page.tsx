import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { requireAdmin } from "@/lib/admin-auth";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const authorization = await requireAdmin();

  if (authorization.response) {
    if (authorization.response.status === 401) {
      redirect("/login?redirect=%2Fadmin");
    }

    if (authorization.response.status === 403) {
      redirect("/dashboard");
    }

    throw new Error("Admin access could not be verified.");
  }

  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="Admin dashboard"
        description="Review feedback, manage accounts and trials, control paid access, email reminders, and advertising, and update the public support email. Administrative actions are protected by server-side authorization."
      />
      <section
        aria-labelledby="administrator-access-heading"
        className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-5"
      >
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="mt-0.5 size-5 shrink-0 text-emerald-300"
            aria-hidden="true"
          />
          <div>
            <h2
              id="administrator-access-heading"
              className="text-sm font-semibold text-emerald-100"
            >
              Full administrator access
            </h2>
            <p className="mt-1 text-sm leading-6 text-emerald-100/80">
              Administrator accounts have unrestricted access to the website,
              bypass paid-plan and usage limits, and are not restricted by the
              Basic plan.
            </p>
          </div>
        </div>
      </section>
      <AdminDashboard />
    </div>
  );
}

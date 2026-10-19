import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { requireAdmin } from "@/lib/admin-auth";
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
        description="Review feedback, manage accounts and trials, and control the paid-access launch switch. Administrative actions are protected by server-side authorization."
      />
      <AdminDashboard />
    </div>
  );
}

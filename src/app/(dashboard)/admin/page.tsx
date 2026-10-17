import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { DashboardPageHeader } from "@/components/dashboard/page-header";

export default function AdminPage() {
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

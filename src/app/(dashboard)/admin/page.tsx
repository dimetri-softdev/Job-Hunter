import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { DashboardPageHeader } from "@/components/dashboard/page-header";

export default function AdminPage() {
  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="Admin dashboard"
        description="Review user feedback and manage account access. Administrative actions are protected by server-side authorization."
      />
      <AdminDashboard />
    </div>
  );
}

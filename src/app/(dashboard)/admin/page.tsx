import { AdminFeedbackPanel } from "@/components/dashboard/admin-feedback-panel";
import { DashboardPageHeader } from "@/components/dashboard/page-header";

export default function AdminPage() {
  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="Admin feedback"
        description="Review anonymous feedback submissions. Access is restricted to the administrator email configured on the server."
      />
      <AdminFeedbackPanel />
    </div>
  );
}

import { BillingOverview } from "@/components/dashboard/billing-overview";
import { DashboardPageHeader } from "@/components/dashboard/page-header";

export default function BillingPage() {
  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="Plans & usage"
        description="See your current access, monthly AI allowances, and the status of future checkout."
      />
      <BillingOverview />
    </div>
  );
}

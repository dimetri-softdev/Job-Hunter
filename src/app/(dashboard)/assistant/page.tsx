import { AssistantChat } from "@/components/assistant/assistant-chat";
import { DashboardPageHeader } from "@/components/dashboard/page-header";

export default function AssistantPage() {
  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="AI assistant"
        description="Get product help or think through career questions. Choose what information, if any, to share with each message."
      />
      <AssistantChat className="min-h-[70vh]" />
    </div>
  );
}

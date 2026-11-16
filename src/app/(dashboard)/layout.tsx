import { MobileNavigation, Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { ApplicationReminderWatcher } from "@/components/dashboard/application-reminders";
import { AdsenseSlot } from "@/components/adsense-slot";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#090a0f] text-slate-100 md:flex-row">
      <ApplicationReminderWatcher />
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <Header />
        <MobileNavigation />
        <AdsenseSlot placement="dashboard" />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

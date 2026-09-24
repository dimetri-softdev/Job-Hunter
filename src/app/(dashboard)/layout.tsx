import { Sidebar } from "@/components/dashboard/sidebar";
import { UserNav } from "@/components/dashboard/user-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#090a0f] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <UserNav />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

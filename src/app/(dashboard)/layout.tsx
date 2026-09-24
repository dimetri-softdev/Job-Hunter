import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#090a0f] text-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

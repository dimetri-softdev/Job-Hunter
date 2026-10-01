import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { RouteTransition } from "@/components/dashboard/route-transition";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#090a0f] text-slate-200 antialiased">
        <AuthProvider>
          <RouteTransition>{children}</RouteTransition>
        </AuthProvider>
      </body>
    </html>
  );
}

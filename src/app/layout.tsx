import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { RouteTransition } from "@/components/dashboard/route-transition";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "JobHunter | Make your next career move with clarity",
    template: "%s | JobHunter",
  },
  description:
    "Organize your job search, assess role fit, prepare application drafts, track progress, and plan your next career steps with JobHunter.",
  applicationName: "JobHunter",
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  openGraph: {
    type: "website",
    siteName: "JobHunter",
    title: "JobHunter | Make your next career move with clarity",
    description:
      "Organize your job search, assess role fit, prepare application drafts, track progress, and plan your next career steps with JobHunter.",
    url: siteUrl,
  },
};

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

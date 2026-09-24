import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#090a0f] text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}

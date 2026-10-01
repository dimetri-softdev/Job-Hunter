import type { ReactNode } from "react";

export function DashboardPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#1f212d] pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
          {description}
        </p>
      </div>
      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

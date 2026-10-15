import type { ReactNode } from "react";

export function ActionHint({
  children,
  label,
  placement = "top",
  className,
}: {
  children: ReactNode;
  label: string;
  placement?: "top" | "right";
  className?: string;
}) {
  const tooltipPosition =
    placement === "right"
      ? "left-full top-1/2 ml-2 -translate-y-1/2"
      : "bottom-full left-1/2 mb-2 -translate-x-1/2";

  return (
    <span className={`group/action-hint relative ${className ?? "inline-flex"}`}>
      {children}
      <span
        aria-hidden="true"
        className={`pointer-events-none invisible absolute z-50 w-max max-w-64 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-left text-xs font-normal leading-5 text-slate-100 opacity-0 shadow-xl transition-opacity duration-150 group-hover/action-hint:visible group-hover/action-hint:opacity-100 group-focus-within/action-hint:visible group-focus-within/action-hint:opacity-100 ${tooltipPosition}`}
      >
        {label}
      </span>
    </span>
  );
}

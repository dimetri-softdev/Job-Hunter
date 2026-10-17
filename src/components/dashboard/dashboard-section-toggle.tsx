import { ChevronDown, ChevronUp } from "lucide-react";

export function DashboardSectionToggle({
  collapsed,
  onToggle,
  sectionLabel,
  disabled = false,
}: {
  collapsed: boolean;
  onToggle: () => void;
  sectionLabel: string;
  disabled?: boolean;
}) {
  const Icon = collapsed ? ChevronDown : ChevronUp;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-expanded={!collapsed}
      aria-label={`${collapsed ? "Show" : "Hide"} ${sectionLabel}`}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#303342] bg-[#0d0e14]/70 px-3 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-wait disabled:opacity-50"
    >
      {collapsed ? "Show" : "Hide"}
      <Icon className="size-3.5" aria-hidden="true" />
    </button>
  );
}

import type { ReactNode } from "react";
import { withAlpha } from "@/lib/color";
import { THEME } from "@/lib/theme";

export function StatCard({
  label,
  value,
  sub,
  color = THEME.primary,
  icon,
}: {
  label: string;
  value: string;
  sub?: string | null;
  color?: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className="flex h-[140px] flex-col justify-between rounded-3xl p-5 shadow-soft-sm"
      style={{ backgroundColor: withAlpha(color, 0.12) }}
    >
      <div className="flex items-center gap-2.5">
        {icon && (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: withAlpha(color, 0.25), color }}
          >
            {icon}
          </div>
        )}
        <span className="truncate text-[13px] font-semibold text-text-secondary">{label}</span>
      </div>
      <div>
        <div className="truncate text-2xl font-extrabold text-text-primary">{value}</div>
        <div className="truncate text-xs text-text-muted">{sub ?? " "}</div>
      </div>
    </div>
  );
}

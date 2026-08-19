import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { withAlpha } from "@/lib/color";
import { THEME } from "@/lib/theme";

export function StatCard({
  label,
  value,
  sub,
  deltaPercent,
  deltaGoodDirection = "up",
  color = THEME.primary,
  icon,
}: {
  label: string;
  value: string;
  sub?: string | null;
  /** 先月比などの増減率（%）。渡すと sub の代わりに矢印付きバッジを表示する。 */
  deltaPercent?: number | null;
  /** 支出のように「減った方が良い」指標では "down" を指定する。既定は増加が好ましい "up"。 */
  deltaGoodDirection?: "up" | "down";
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
        {deltaPercent != null ? (
          <DeltaBadge percent={deltaPercent} goodDirection={deltaGoodDirection} />
        ) : (
          <div className="truncate text-xs text-text-muted">{sub ?? " "}</div>
        )}
      </div>
    </div>
  );
}

function DeltaBadge({ percent, goodDirection }: { percent: number; goodDirection: "up" | "down" }) {
  const isIncrease = percent >= 0;
  const isGood = goodDirection === "down" ? !isIncrease : isIncrease;
  const Icon = isIncrease ? TrendingUp : TrendingDown;
  return (
    <div className={`flex items-center gap-1 text-xs font-bold ${isGood ? "text-success" : "text-danger"}`}>
      <Icon size={12} />
      先月比 {isIncrease ? "+" : ""}
      {percent.toFixed(1)}%
    </div>
  );
}

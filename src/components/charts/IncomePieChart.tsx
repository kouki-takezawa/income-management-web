"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { yen } from "@/lib/format";

export interface BreakdownItem {
  name: string;
  value: number;
  color: string;
}

export function IncomePieChart({ data }: { data: BreakdownItem[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const visible = data.filter((d) => d.value > 0);

  if (total <= 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-text-muted">
        データがまだありません。「給与・残業」からデータを入力してください。
      </div>
    );
  }

  return (
    <div className="flex h-full items-center gap-6">
      <div className="h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={visible}
              dataKey="value"
              nameKey="name"
              innerRadius={46}
              outerRadius={82}
              paddingAngle={2}
              stroke="none"
              isAnimationActive
            >
              {visible.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => yen(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="truncate text-text-secondary">{d.name}</span>
            <span className="flex-1" />
            <span className="w-9 shrink-0 text-right text-[11px] text-text-muted">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
            <span className="w-24 shrink-0 text-right font-bold text-text-primary">{yen(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

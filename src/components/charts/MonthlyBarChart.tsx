"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { THEME } from "@/lib/theme";
import { withAlpha } from "@/lib/color";
import { yen } from "@/lib/format";

export interface MonthBar {
  label: string;
  total: number;
  hasData: boolean;
}

export function MonthlyBarChart({ data }: { data: MonthBar[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="24%">
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: THEME.textSecondary, fontSize: 10 }}
        />
        <Tooltip
          cursor={{ fill: withAlpha(THEME.primary, 0.08) }}
          formatter={(value) => yen(Number(value))}
          labelFormatter={(label) => `${label}`}
        />
        <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={22}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.hasData ? THEME.primary : withAlpha(THEME.primary, 0.35)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

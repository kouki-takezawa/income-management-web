"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { THEME } from "@/lib/theme";
import { yen } from "@/lib/format";

export interface AssetsTrendPoint {
  label: string;
  total: number;
}

export function AssetsTrendChart({ data, gradientId }: { data: AssetsTrendPoint[]; gradientId: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={THEME.primary} stopOpacity={0.35} />
            <stop offset="100%" stopColor={THEME.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.border} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: THEME.textSecondary, fontSize: 10 }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: THEME.textSecondary, fontSize: 10 }}
          tickFormatter={(v) => `${Number(v) / 10000}万`}
          width={40}
        />
        <Tooltip formatter={(value) => yen(Number(value))} labelFormatter={(label) => `${label}`} />
        <Area
          type="monotone"
          dataKey="total"
          name="資産合計"
          stroke={THEME.primaryDark}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={{ r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

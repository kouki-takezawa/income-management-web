"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { THEME } from "@/lib/theme";
import { yen } from "@/lib/format";

export interface FlowBar {
  label: string;
  income: number;
  expense: number;
}

export function BudgetTrendChart({ data }: { data: FlowBar[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.border} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: THEME.textSecondary, fontSize: 10 }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: THEME.textSecondary, fontSize: 10 }}
          tickFormatter={(v) => `${Number(v) / 10000}万`}
          width={40}
        />
        <Tooltip formatter={(value) => yen(Number(value))} />
        <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === "income" ? "収入" : "支出")} />
        <Bar dataKey="income" name="income" fill={THEME.success} radius={[6, 6, 0, 0]} maxBarSize={18} />
        <Bar dataKey="expense" name="expense" fill={THEME.danger} radius={[6, 6, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

import type { Prisma } from "@prisma/client";
import type { Allowance, OvertimeRates } from "@/lib/business/salary";

export interface SettingsData {
  id: string;
  userId: string;
  baseSalary: number;
  standardMonthlyHours: number;
  overtimeRates: OvertimeRates;
  hireDate: string | null;
  annualLeaveDays: number;
  fiscalStartMonth: number;
  age: number;
  prefecture: string;
  showNetEstimate: boolean;
  allowances: Allowance[];
}

const DEFAULT_RATES: OvertimeRates = { weekday: 25, late_night: 50, holiday: 35, holiday_late_night: 60 };

interface SettingsRow {
  id: string;
  userId: string;
  baseSalary: number;
  standardMonthlyHours: number;
  overtimeRates: Prisma.JsonValue;
  hireDate: string | null;
  annualLeaveDays: number;
  fiscalStartMonth: number;
  age: number;
  prefecture: string;
  showNetEstimate: boolean;
  allowances: Prisma.JsonValue;
}

// DB から読み込んだ設定行を安全に正規化する（欠損キーはデフォルト値で補完）。
export function normalizeSettings(row: SettingsRow): SettingsData {
  const ratesRaw = (row.overtimeRates && typeof row.overtimeRates === "object" ? row.overtimeRates : {}) as Partial<
    Record<keyof OvertimeRates, number>
  >;
  const overtimeRates: OvertimeRates = {
    weekday: Number(ratesRaw.weekday ?? DEFAULT_RATES.weekday),
    late_night: Number(ratesRaw.late_night ?? DEFAULT_RATES.late_night),
    holiday: Number(ratesRaw.holiday ?? DEFAULT_RATES.holiday),
    holiday_late_night: Number(ratesRaw.holiday_late_night ?? DEFAULT_RATES.holiday_late_night),
  };

  const allowancesRaw = Array.isArray(row.allowances) ? row.allowances : [];
  const allowances: Allowance[] = allowancesRaw.map((raw, i) => {
    const a = (raw ?? {}) as Record<string, unknown>;
    return {
      id: typeof a.id === "string" ? a.id : `allowance-${i}`,
      name: typeof a.name === "string" ? a.name : "手当",
      amount: Number(a.amount) || 0,
      includeInBase: Boolean(a.includeInBase),
    };
  });

  return {
    id: row.id,
    userId: row.userId,
    baseSalary: row.baseSalary,
    standardMonthlyHours: row.standardMonthlyHours,
    overtimeRates,
    hireDate: row.hireDate,
    annualLeaveDays: row.annualLeaveDays,
    fiscalStartMonth: row.fiscalStartMonth,
    age: row.age,
    prefecture: row.prefecture,
    showNetEstimate: row.showNetEstimate,
    allowances,
  };
}

export const DEFAULT_OVERTIME_RATES = DEFAULT_RATES;

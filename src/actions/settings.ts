"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { PREFECTURES } from "@/lib/business/constants";
import type { Prisma } from "@prisma/client";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface AllowanceInput {
  id: string;
  name: string;
  amount: number;
  includeInBase: boolean;
}

export interface SettingsInput {
  baseSalary: number;
  standardMonthlyHours: number;
  overtimeRates: {
    weekday: number;
    late_night: number;
    holiday: number;
    holiday_late_night: number;
  };
  hireDate: string | null;
  annualLeaveDays: number;
  fiscalStartMonth: number;
  age: number;
  prefecture: string;
  showNetEstimate: boolean;
  allowances: AllowanceInput[];
}

export async function updateSettings(input: SettingsInput): Promise<ActionResult> {
  const userId = await requireUserId();

  if (!Number.isFinite(input.baseSalary) || input.baseSalary < 0) {
    return { success: false, error: "基本給には正しい数値を入力してください" };
  }
  if (!Number.isFinite(input.standardMonthlyHours) || input.standardMonthlyHours <= 0) {
    return { success: false, error: "所定労働時間には正しい数値を入力してください" };
  }
  if (input.hireDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.hireDate)) {
    return { success: false, error: "入社日は YYYY-MM-DD 形式で入力してください" };
  }
  if (!Number.isFinite(input.annualLeaveDays) || input.annualLeaveDays < 0) {
    return { success: false, error: "年間付与日数には正しい数値を入力してください" };
  }
  if (!Number.isFinite(input.age) || input.age < 15 || input.age > 100) {
    return { success: false, error: "年齢には正しい数値を入力してください" };
  }
  if (!Number.isInteger(input.fiscalStartMonth) || input.fiscalStartMonth < 1 || input.fiscalStartMonth > 12) {
    return { success: false, error: "年度の開始月が正しくありません" };
  }
  if (!PREFECTURES.includes(input.prefecture)) {
    return { success: false, error: "都道府県が正しくありません" };
  }

  const overtimeRates = {
    weekday: Number(input.overtimeRates.weekday) || 0,
    late_night: Number(input.overtimeRates.late_night) || 0,
    holiday: Number(input.overtimeRates.holiday) || 0,
    holiday_late_night: Number(input.overtimeRates.holiday_late_night) || 0,
  } satisfies Prisma.InputJsonValue;

  const allowances = input.allowances.map((a) => ({
    id: a.id,
    name: a.name.trim() || "手当",
    amount: Math.round(Number(a.amount) || 0),
    includeInBase: Boolean(a.includeInBase),
  })) satisfies Prisma.InputJsonValue;

  const data = {
    baseSalary: Math.round(input.baseSalary),
    standardMonthlyHours: Math.round(input.standardMonthlyHours),
    overtimeRates,
    hireDate: input.hireDate,
    annualLeaveDays: input.annualLeaveDays,
    fiscalStartMonth: input.fiscalStartMonth,
    age: Math.round(input.age),
    prefecture: input.prefecture,
    showNetEstimate: input.showNetEstimate,
    allowances,
  };

  await prisma.settings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  revalidatePath("/", "layout");
  return { success: true };
}

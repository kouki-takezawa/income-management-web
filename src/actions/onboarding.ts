"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface OnboardingInput {
  baseSalary: number;
  standardMonthlyHours: number;
  hireDate: string | null;
  annualLeaveDays: number;
  prefecture: string;
  age: number;
}

/**
 * オンボーディング完了時に呼び出す。ウィザードの3ステップで集めた項目だけを
 * 部分更新し、他の設定項目（手当・残業割増率など）には触れない。
 */
export async function completeOnboardingAction(input: OnboardingInput): Promise<ActionResult> {
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

  await prisma.settings.upsert({
    where: { userId },
    create: {
      userId,
      baseSalary: Math.round(input.baseSalary),
      standardMonthlyHours: Math.round(input.standardMonthlyHours),
      hireDate: input.hireDate,
      annualLeaveDays: input.annualLeaveDays,
      prefecture: input.prefecture,
      age: Math.round(input.age),
      onboardingCompleted: true,
    },
    update: {
      baseSalary: Math.round(input.baseSalary),
      standardMonthlyHours: Math.round(input.standardMonthlyHours),
      hireDate: input.hireDate,
      annualLeaveDays: input.annualLeaveDays,
      prefecture: input.prefecture,
      age: Math.round(input.age),
      onboardingCompleted: true,
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

/** 「スキップ」: 他の設定項目には一切触れず、完了フラグだけを立てる。 */
export async function skipOnboardingAction(): Promise<ActionResult> {
  const userId = await requireUserId();

  await prisma.settings.upsert({
    where: { userId },
    create: { userId, onboardingCompleted: true },
    update: { onboardingCompleted: true },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

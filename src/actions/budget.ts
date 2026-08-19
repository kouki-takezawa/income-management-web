"use server";

import { revalidatePath } from "next/cache";
import { prisma, isUniqueConstraintError } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { isValidISODate } from "@/lib/business/dates";

export interface ActionResult {
  success: boolean;
  error?: string;
}

function revalidateBudget() {
  revalidatePath("/budget");
  revalidatePath("/");
}

export async function upsertBudgetCategory(input: {
  id?: string;
  name: string;
  type: "income" | "expense";
  color: string;
  monthlyLimit?: number | null;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "カテゴリ名を入力してください" };
  }
  const monthlyLimit =
    input.monthlyLimit == null || !Number.isFinite(input.monthlyLimit) || input.monthlyLimit <= 0
      ? null
      : Math.round(input.monthlyLimit);

  const duplicate = await prisma.budgetCategory.findFirst({
    where: { userId, name, type: input.type, ...(input.id ? { id: { not: input.id } } : {}) },
  });
  if (duplicate) {
    return { success: false, error: "同じ名前のカテゴリが既にあります" };
  }

  try {
    if (input.id) {
      const existing = await prisma.budgetCategory.findFirst({ where: { id: input.id, userId } });
      if (!existing) return { success: false, error: "対象のカテゴリが見つかりません" };
      await prisma.budgetCategory.update({
        where: { id: input.id },
        data: { name, type: input.type, color: input.color, monthlyLimit },
      });
    } else {
      await prisma.budgetCategory.create({ data: { userId, name, type: input.type, color: input.color, monthlyLimit } });
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "同じ名前のカテゴリが既にあります" };
    }
    throw error;
  }

  revalidateBudget();
  return { success: true };
}

export async function deleteBudgetCategory(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.budgetCategory.deleteMany({ where: { id, userId } });
  revalidateBudget();
  return { success: true };
}

export async function upsertBudgetTransaction(input: {
  id?: string;
  date: string;
  type: "income" | "expense";
  categoryId: string;
  amount: number;
  memo: string;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!isValidISODate(input.date)) {
    return { success: false, error: "日付は YYYY-MM-DD 形式で入力してください" };
  }
  const amount = Math.round(Number(input.amount) || 0);
  if (amount <= 0) {
    return { success: false, error: "金額を入力してください" };
  }
  const category = await prisma.budgetCategory.findFirst({
    where: { id: input.categoryId, userId, type: input.type },
  });
  if (!category) {
    return { success: false, error: "カテゴリが正しくありません" };
  }
  const memo = input.memo.trim() || null;
  const data = { date: input.date, type: input.type, categoryId: input.categoryId, amount, memo };

  if (input.id) {
    const existing = await prisma.budgetTransaction.findFirst({ where: { id: input.id, userId } });
    if (!existing) return { success: false, error: "対象の記録が見つかりません" };
    await prisma.budgetTransaction.update({ where: { id: input.id }, data });
  } else {
    await prisma.budgetTransaction.create({ data: { userId, ...data } });
  }

  revalidateBudget();
  return { success: true };
}

export async function deleteBudgetTransaction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.budgetTransaction.deleteMany({ where: { id, userId } });
  revalidateBudget();
  return { success: true };
}

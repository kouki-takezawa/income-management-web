"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export interface ActionResult {
  success: boolean;
  error?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function revalidateBudget() {
  revalidatePath("/budget");
  revalidatePath("/");
}

export async function upsertBudgetCategory(input: {
  id?: string;
  name: string;
  type: "income" | "expense";
  color: string;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "カテゴリ名を入力してください" };
  }

  if (input.id) {
    const existing = await prisma.budgetCategory.findFirst({ where: { id: input.id, userId } });
    if (!existing) return { success: false, error: "対象のカテゴリが見つかりません" };
    await prisma.budgetCategory.update({
      where: { id: input.id },
      data: { name, type: input.type, color: input.color },
    });
  } else {
    await prisma.budgetCategory.create({ data: { userId, name, type: input.type, color: input.color } });
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
  if (!DATE_RE.test(input.date)) {
    return { success: false, error: "日付は YYYY-MM-DD 形式で入力してください" };
  }
  const amount = Math.round(Number(input.amount) || 0);
  if (amount <= 0) {
    return { success: false, error: "金額を入力してください" };
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

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export interface ActionResult {
  success: boolean;
  error?: string;
}

function revalidateBudget() {
  revalidatePath("/budget");
  revalidatePath("/");
}

export async function upsertRecurringBudgetItem(input: {
  id?: string;
  name: string;
  type: "income" | "expense";
  categoryId: string;
  amount: number;
  dayOfMonth: number;
  memo: string;
  active: boolean;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "名称を入力してください" };
  }
  const amount = Math.round(Number(input.amount) || 0);
  if (amount <= 0) {
    return { success: false, error: "金額を入力してください" };
  }
  const dayOfMonth = Math.round(Number(input.dayOfMonth) || 0);
  if (dayOfMonth < 1 || dayOfMonth > 28) {
    return { success: false, error: "発生日は1〜28の範囲で指定してください" };
  }
  const category = await prisma.budgetCategory.findFirst({
    where: { id: input.categoryId, userId, type: input.type },
  });
  if (!category) {
    return { success: false, error: "カテゴリが正しくありません" };
  }
  const memo = input.memo.trim() || null;
  const data = { name, type: input.type, categoryId: input.categoryId, amount, dayOfMonth, memo, active: input.active };

  if (input.id) {
    const existing = await prisma.recurringBudgetItem.findFirst({ where: { id: input.id, userId } });
    if (!existing) return { success: false, error: "対象の項目が見つかりません" };
    await prisma.recurringBudgetItem.update({ where: { id: input.id }, data });
  } else {
    await prisma.recurringBudgetItem.create({ data: { userId, ...data } });
  }

  revalidateBudget();
  return { success: true };
}

export async function deleteRecurringBudgetItem(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.recurringBudgetItem.deleteMany({ where: { id, userId } });
  revalidateBudget();
  return { success: true };
}

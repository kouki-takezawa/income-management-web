"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export interface ActionResult {
  success: boolean;
  error?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function upsertBonus(input: {
  id?: string;
  date: string;
  name: string;
  amount: number;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!DATE_RE.test(input.date)) {
    return { success: false, error: "日付は YYYY-MM-DD 形式で入力してください" };
  }
  const amount = Math.round(Number(input.amount) || 0);
  const name = input.name.trim() || "賞与";

  if (input.id) {
    const existing = await prisma.bonus.findFirst({ where: { id: input.id, userId } });
    if (!existing) return { success: false, error: "対象のデータが見つかりません" };
    await prisma.bonus.update({ where: { id: input.id }, data: { date: input.date, name, amount } });
  } else {
    await prisma.bonus.create({ data: { userId, date: input.date, name, amount } });
  }

  revalidatePath("/bonus");
  revalidatePath("/");
  return { success: true };
}

export async function deleteBonus(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.bonus.deleteMany({ where: { id, userId } });
  revalidatePath("/bonus");
  revalidatePath("/");
  return { success: true };
}

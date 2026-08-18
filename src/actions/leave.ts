"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { leaveTypeDays } from "@/lib/business/constants";

export interface ActionResult {
  success: boolean;
  error?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function upsertLeaveUsage(input: { date: string; type: string; note: string }): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!DATE_RE.test(input.date)) {
    return { success: false, error: "日付は YYYY-MM-DD 形式で入力してください" };
  }
  const days = leaveTypeDays(input.type);
  const note = input.note?.trim() || null;

  // 同じ日付の既存レコードがあれば upsert で更新し、1日1件を保つ
  await prisma.leaveUsage.upsert({
    where: { userId_date: { userId, date: input.date } },
    create: { userId, date: input.date, type: input.type, days, note },
    update: { type: input.type, days, note },
  });

  revalidatePath("/leave");
  revalidatePath("/");
  return { success: true };
}

export async function deleteLeaveUsage(date: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.leaveUsage.deleteMany({ where: { userId, date } });
  revalidatePath("/leave");
  revalidatePath("/");
  return { success: true };
}

export async function addManualGrant(input: { date: string; days: number; note: string }): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!DATE_RE.test(input.date)) {
    return { success: false, error: "日付は YYYY-MM-DD 形式で入力してください" };
  }
  const days = Number(input.days);
  if (!Number.isFinite(days) || days === 0) {
    return { success: false, error: "日数を入力してください（付与は+、取消は-）" };
  }
  const note = input.note?.trim() || "手動付与";

  await prisma.leaveManualGrant.create({ data: { userId, date: input.date, days, note } });

  revalidatePath("/leave");
  revalidatePath("/");
  return { success: true };
}

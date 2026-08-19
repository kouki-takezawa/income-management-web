"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export interface ActionResult {
  success: boolean;
  error?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function revalidateAssets(accountId?: string) {
  revalidatePath("/assets");
  revalidatePath("/");
  if (accountId) revalidatePath(`/assets/${accountId}`);
}

export async function upsertAssetAccount(input: {
  id?: string;
  name: string;
  type: "cash" | "bank" | "investment";
}): Promise<ActionResult> {
  const userId = await requireUserId();
  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "口座名を入力してください" };
  }

  if (input.id) {
    const existing = await prisma.assetAccount.findFirst({ where: { id: input.id, userId } });
    if (!existing) return { success: false, error: "対象の口座が見つかりません" };
    await prisma.assetAccount.update({ where: { id: input.id }, data: { name, type: input.type } });
  } else {
    await prisma.assetAccount.create({ data: { userId, name, type: input.type } });
  }

  revalidateAssets(input.id);
  return { success: true };
}

export async function deleteAssetAccount(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  // スナップショットは AssetSnapshot.assetAccount の onDelete: Cascade で一緒に消える
  await prisma.assetAccount.deleteMany({ where: { id, userId } });
  revalidateAssets(id);
  return { success: true };
}

export async function upsertAssetSnapshot(input: {
  id?: string;
  assetAccountId: string;
  date: string;
  value: number;
  note: string;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!DATE_RE.test(input.date)) {
    return { success: false, error: "日付は YYYY-MM-DD 形式で入力してください" };
  }
  const value = Math.round(Number(input.value) || 0);
  if (!Number.isFinite(value) || value < 0) {
    return { success: false, error: "残高・評価額を入力してください" };
  }
  const account = await prisma.assetAccount.findFirst({ where: { id: input.assetAccountId, userId } });
  if (!account) {
    return { success: false, error: "対象の口座が見つかりません" };
  }
  const note = input.note.trim() || null;
  const data = { date: input.date, value, note };

  if (input.id) {
    const existing = await prisma.assetSnapshot.findFirst({
      where: { id: input.id, assetAccountId: input.assetAccountId },
    });
    if (!existing) return { success: false, error: "対象の記録が見つかりません" };
    await prisma.assetSnapshot.update({ where: { id: input.id }, data });
  } else {
    await prisma.assetSnapshot.create({ data: { assetAccountId: input.assetAccountId, ...data } });
  }

  revalidateAssets(input.assetAccountId);
  return { success: true };
}

export async function deleteAssetSnapshot(id: string, assetAccountId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const account = await prisma.assetAccount.findFirst({ where: { id: assetAccountId, userId } });
  if (!account) {
    return { success: false, error: "対象の口座が見つかりません" };
  }
  await prisma.assetSnapshot.deleteMany({ where: { id, assetAccountId } });
  revalidateAssets(assetAccountId);
  return { success: true };
}

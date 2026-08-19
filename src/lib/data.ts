import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { normalizeSettings, type SettingsData } from "@/lib/settings";
import type { OvertimeHours } from "@/lib/business/salary";
import {
  DEFAULT_BUDGET_CATEGORIES,
  pendingRecurringMonths,
  type BudgetCategoryData,
  type BudgetTransactionData,
  type RecurringBudgetItemData,
} from "@/lib/business/budget";
import type { AssetAccountData, AssetSnapshotData } from "@/lib/business/assets";
import { todayYMD } from "@/lib/business/dates";

// ユーザーごとのデータ取得ヘルパー。すべて userId でスコープされる。

// React の cache() でラップし、同一リクエスト内（レイアウトのオンボーディング判定 +
// 各ページ本体）で同じ userId に対して呼ばれても DB アクセスは1回で済むようにする。
export const getOrCreateSettings = cache(async (userId: string): Promise<SettingsData> => {
  const row = await prisma.settings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  return normalizeSettings(row);
});

export async function getUserEmail(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  return user?.email ?? "";
}

export interface OvertimeEntryData {
  id: string;
  date: string;
  hours: OvertimeHours;
  note: string | null;
}

function normalizeHours(json: unknown): OvertimeHours {
  const h = (json && typeof json === "object" ? json : {}) as Partial<Record<keyof OvertimeHours, unknown>>;
  return {
    weekday: Number(h.weekday) || 0,
    late_night: Number(h.late_night) || 0,
    holiday: Number(h.holiday) || 0,
    holiday_late_night: Number(h.holiday_late_night) || 0,
  };
}

export async function getOvertimeEntries(userId: string): Promise<OvertimeEntryData[]> {
  const rows = await prisma.overtimeEntry.findMany({ where: { userId }, orderBy: { date: "asc" } });
  return rows.map((r) => ({ id: r.id, date: r.date, hours: normalizeHours(r.hours), note: r.note }));
}

export async function getMonthlyRecords(userId: string) {
  return prisma.monthlyRecord.findMany({ where: { userId } });
}

export async function getBonuses(userId: string) {
  return prisma.bonus.findMany({ where: { userId }, orderBy: { date: "desc" } });
}

export async function getLeaveUsages(userId: string) {
  return prisma.leaveUsage.findMany({ where: { userId }, orderBy: { date: "desc" } });
}

export async function getLeaveManualGrants(userId: string) {
  return prisma.leaveManualGrant.findMany({ where: { userId } });
}

// 初回アクセス時、そのユーザーのカテゴリが0件ならデフォルトカテゴリを作成する。
// getOrCreateSettings と同じ考え方（同一リクエスト内で複数回呼ばれても DB アクセスは1回）。
function toBudgetCategoryData(c: {
  id: string;
  name: string;
  type: string;
  color: string;
  monthlyLimit: number | null;
}): BudgetCategoryData {
  return { id: c.id, name: c.name, type: c.type as "income" | "expense", color: c.color, monthlyLimit: c.monthlyLimit };
}

export const getOrCreateBudgetCategories = cache(async (userId: string): Promise<BudgetCategoryData[]> => {
  const existing = await prisma.budgetCategory.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  if (existing.length > 0) {
    return existing.map(toBudgetCategoryData);
  }
  // skipDuplicates + (userId, name, type) の一意制約により、同時アクセスで
  // このブロックが二重に走っても重複作成されない（デフォルトカテゴリ名は
  // 固定なので、後続の insert は静かにスキップされるだけ）。
  await prisma.budgetCategory.createMany({
    data: DEFAULT_BUDGET_CATEGORIES.map((c) => ({ userId, name: c.name, type: c.type, color: c.color })),
    skipDuplicates: true,
  });
  const created = await prisma.budgetCategory.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return created.map(toBudgetCategoryData);
});

export async function getBudgetTransactions(userId: string): Promise<BudgetTransactionData[]> {
  const rows = await prisma.budgetTransaction.findMany({ where: { userId }, orderBy: { date: "desc" } });
  return rows.map((t) => ({
    id: t.id,
    date: t.date,
    type: t.type as "income" | "expense",
    categoryId: t.categoryId,
    amount: t.amount,
    memo: t.memo,
  }));
}

export async function getRecurringBudgetItems(userId: string): Promise<RecurringBudgetItemData[]> {
  const rows = await prisma.recurringBudgetItem.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type as "income" | "expense",
    categoryId: r.categoryId,
    amount: r.amount,
    dayOfMonth: r.dayOfMonth,
    memo: r.memo,
    active: r.active,
    lastGeneratedMonth: r.lastGeneratedMonth,
  }));
}

// アクティブな定期項目について、未生成の月分の BudgetTransaction をまとめて追いつかせる。
// /budget を開くたびに呼び、副作用（DB書き込み）を伴うため getBudgetTransactions とは
// 別関数にしている（cache() でメモ化しない — 生成後に最新の取引一覧を読み直す必要があるため）。
export async function generateRecurringBudgetTransactions(userId: string): Promise<void> {
  const items = await prisma.recurringBudgetItem.findMany({ where: { userId, active: true } });
  if (items.length === 0) return;
  const today = todayYMD();

  for (const item of items) {
    const months = pendingRecurringMonths(
      { dayOfMonth: item.dayOfMonth, lastGeneratedMonth: item.lastGeneratedMonth },
      today
    );
    if (months.length === 0) continue;

    await prisma.budgetTransaction.createMany({
      data: months.map((month) => ({
        userId,
        date: `${month}-${String(item.dayOfMonth).padStart(2, "0")}`,
        type: item.type,
        categoryId: item.categoryId,
        amount: item.amount,
        memo: item.memo,
        sourceRecurringItemId: item.id,
        sourceMonth: month,
      })),
      skipDuplicates: true,
    });
    await prisma.recurringBudgetItem.update({
      where: { id: item.id },
      data: { lastGeneratedMonth: months[months.length - 1] },
    });
  }
}

export async function getAssetAccounts(userId: string): Promise<AssetAccountData[]> {
  const rows = await prisma.assetAccount.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return rows.map((a) => ({ id: a.id, name: a.name, type: a.type as AssetAccountData["type"] }));
}

export async function getAssetSnapshots(userId: string): Promise<AssetSnapshotData[]> {
  const rows = await prisma.assetSnapshot.findMany({
    where: { assetAccount: { userId } },
    orderBy: { date: "desc" },
  });
  return rows.map((s) => ({ id: s.id, assetAccountId: s.assetAccountId, date: s.date, value: s.value, note: s.note }));
}

// id が他ユーザーの口座、または存在しない場合は null を返す（呼び出し側で notFound() する）
export async function getAssetAccountById(userId: string, id: string): Promise<AssetAccountData | null> {
  const row = await prisma.assetAccount.findFirst({ where: { id, userId } });
  if (!row) return null;
  return { id: row.id, name: row.name, type: row.type as AssetAccountData["type"] };
}

export async function getAssetSnapshotsForAccount(assetAccountId: string): Promise<AssetSnapshotData[]> {
  const rows = await prisma.assetSnapshot.findMany({ where: { assetAccountId }, orderBy: { date: "desc" } });
  return rows.map((s) => ({ id: s.id, assetAccountId: s.assetAccountId, date: s.date, value: s.value, note: s.note }));
}

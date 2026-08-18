import "server-only";
import { prisma } from "@/lib/prisma";
import { normalizeSettings, type SettingsData } from "@/lib/settings";
import type { OvertimeHours } from "@/lib/business/salary";

// ユーザーごとのデータ取得ヘルパー。すべて userId でスコープされる。

export async function getOrCreateSettings(userId: string): Promise<SettingsData> {
  const row = await prisma.settings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  return normalizeSettings(row);
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

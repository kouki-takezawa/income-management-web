"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export interface ActionResult {
  success: boolean;
  error?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface OvertimeHoursInput {
  weekday: number;
  late_night: number;
  holiday: number;
  holiday_late_night: number;
}

function clean(n: number): number {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

export async function upsertOvertimeEntry(input: {
  date: string;
  hours: OvertimeHoursInput;
  note: string;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!DATE_RE.test(input.date)) {
    return { success: false, error: "日付が正しくありません" };
  }
  const hours = {
    weekday: clean(input.hours.weekday),
    late_night: clean(input.hours.late_night),
    holiday: clean(input.hours.holiday),
    holiday_late_night: clean(input.hours.holiday_late_night),
  };
  const note = input.note?.trim() || null;

  await prisma.overtimeEntry.upsert({
    where: { userId_date: { userId, date: input.date } },
    create: { userId, date: input.date, hours, note },
    update: { hours, note },
  });

  revalidatePath("/salary");
  revalidatePath("/");
  return { success: true };
}

export async function deleteOvertimeEntry(date: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.overtimeEntry.deleteMany({ where: { userId, date } });
  revalidatePath("/salary");
  revalidatePath("/");
  return { success: true };
}

export async function upsertMonthlyRecord(input: {
  year: number;
  month: number;
  baseSalaryOverride: number | null;
  allowancesOverride: number | null;
  note: string;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!Number.isInteger(input.year) || !Number.isInteger(input.month) || input.month < 1 || input.month > 12) {
    return { success: false, error: "年月が正しくありません" };
  }
  const note = input.note?.trim() || null;
  const baseSalaryOverride =
    input.baseSalaryOverride === null || Number.isNaN(input.baseSalaryOverride)
      ? null
      : Math.round(input.baseSalaryOverride);
  const allowancesOverride =
    input.allowancesOverride === null || Number.isNaN(input.allowancesOverride)
      ? null
      : Math.round(input.allowancesOverride);

  await prisma.monthlyRecord.upsert({
    where: { userId_year_month: { userId, year: input.year, month: input.month } },
    create: { userId, year: input.year, month: input.month, baseSalaryOverride, allowancesOverride, note },
    update: { baseSalaryOverride, allowancesOverride, note },
  });

  revalidatePath("/salary");
  revalidatePath("/");
  return { success: true };
}

export async function deleteMonthlyRecord(year: number, month: number): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.monthlyRecord.deleteMany({ where: { userId, year, month } });
  revalidatePath("/salary");
  revalidatePath("/");
  return { success: true };
}

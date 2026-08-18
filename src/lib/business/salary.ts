// 給与・残業計算ロジック（Python版 app_state.py を TypeScript に移植）
import { OVERTIME_CATEGORIES, OvertimeCategory } from "./constants";
import { parseISO, YMD } from "./dates";

export interface Allowance {
  id: string;
  name: string;
  amount: number;
  includeInBase: boolean;
}

export interface OvertimeRates {
  weekday: number;
  late_night: number;
  holiday: number;
  holiday_late_night: number;
}

export interface SettingsLike {
  baseSalary: number;
  standardMonthlyHours: number;
  overtimeRates: OvertimeRates;
  allowances: Allowance[];
}

export interface MonthlyRecordLike {
  year: number;
  month: number;
  baseSalaryOverride: number | null;
  allowancesOverride: number | null;
  note?: string | null;
}

export interface OvertimeHours {
  weekday: number;
  late_night: number;
  holiday: number;
  holiday_late_night: number;
}

export interface OvertimeEntryLike {
  date: string;
  hours: Partial<OvertimeHours> | null | undefined;
  note?: string | null;
}

export interface BonusLike {
  date: string;
  amount: number;
}

export function allowanceTotal(settings: SettingsLike, onlyBaseIncluded = false): number {
  let total = 0;
  for (const a of settings.allowances) {
    if (onlyBaseIncluded && !a.includeInBase) continue;
    total += a.amount;
  }
  return total;
}

export function hourlyRate(settings: SettingsLike): number {
  const hours = settings.standardMonthlyHours || 160;
  const base = settings.baseSalary + allowanceTotal(settings, true);
  return hours ? base / hours : 0;
}

export function findRecord<T extends { year: number; month: number }>(
  records: T[],
  year: number,
  month: number
): T | null {
  return records.find((r) => r.year === year && r.month === month) ?? null;
}

export function recordBaseSalary(settings: SettingsLike, record: MonthlyRecordLike | null): number {
  if (record && record.baseSalaryOverride !== null && record.baseSalaryOverride !== undefined) {
    return record.baseSalaryOverride;
  }
  return settings.baseSalary;
}

export function recordAllowanceTotal(settings: SettingsLike, record: MonthlyRecordLike | null): number {
  if (record && record.allowancesOverride !== null && record.allowancesOverride !== undefined) {
    return record.allowancesOverride;
  }
  return allowanceTotal(settings);
}

export function recordBaseAllowance(settings: SettingsLike, record: MonthlyRecordLike | null): number {
  return recordBaseSalary(settings, record) + recordAllowanceTotal(settings, record);
}

export function entryHours(entry: OvertimeEntryLike | null | undefined): OvertimeHours {
  const zero: OvertimeHours = { weekday: 0, late_night: 0, holiday: 0, holiday_late_night: 0 };
  if (!entry) return zero;
  const h = entry.hours ?? {};
  return {
    weekday: h.weekday ?? 0,
    late_night: h.late_night ?? 0,
    holiday: h.holiday ?? 0,
    holiday_late_night: h.holiday_late_night ?? 0,
  };
}

export function entryTotalHours(entry: OvertimeEntryLike | null | undefined): number {
  const h = entryHours(entry);
  return OVERTIME_CATEGORIES.reduce((sum, k) => sum + h[k], 0);
}

export function entryPay(settings: SettingsLike, entry: OvertimeEntryLike | null | undefined): number {
  if (!entry) return 0;
  const rate = hourlyRate(settings);
  const h = entryHours(entry);
  const rates = settings.overtimeRates;
  return OVERTIME_CATEGORIES.reduce((sum, k: OvertimeCategory) => {
    return sum + h[k] * rate * (1 + (rates[k] ?? 0) / 100);
  }, 0);
}

export function monthOvertimeEntries<T extends { date: string }>(
  entries: T[],
  year: number,
  month: number
): T[] {
  return entries.filter((e) => {
    const d = parseISO(e.date);
    return d && d.y === year && d.m === month;
  });
}

export function monthOvertimeSummary(
  settings: SettingsLike,
  entries: OvertimeEntryLike[],
  year: number,
  month: number
): { pay: number; hours: number } {
  const monthEntries = monthOvertimeEntries(entries, year, month);
  const pay = monthEntries.reduce((sum, e) => sum + entryPay(settings, e), 0);
  const hours = monthEntries.reduce((sum, e) => sum + entryTotalHours(e), 0);
  return { pay, hours };
}

export interface AnnualMonthRow {
  year: number;
  month: number;
  base: number;
  allowance: number;
  overtime: number;
  overtimeHours: number;
  total: number;
  hasRecord: boolean;
}

export interface AnnualSummary {
  base: number;
  allowance: number;
  overtime: number;
  overtimeHours: number;
  bonus: number;
  total: number;
  months: AnnualMonthRow[];
}

export function annualSummary(
  settings: SettingsLike,
  monthlyRecords: MonthlyRecordLike[],
  overtimeEntries: OvertimeEntryLike[],
  bonuses: BonusLike[],
  fiscalStartMonth: number,
  fiscalYear: number
): AnnualSummary {
  const months = fiscalYearMonths(fiscalStartMonth, fiscalYear);
  let totalBase = 0;
  let totalAllow = 0;
  let totalOt = 0;
  let totalOtHours = 0;
  const monthRows: AnnualMonthRow[] = [];

  for (const { y, m } of months) {
    const rec = findRecord(monthlyRecords, y, m);
    const base = recordBaseSalary(settings, rec);
    const allow = recordAllowanceTotal(settings, rec);
    const { pay: ot, hours: otHours } = monthOvertimeSummary(settings, overtimeEntries, y, m);
    totalBase += base;
    totalAllow += allow;
    totalOt += ot;
    totalOtHours += otHours;
    monthRows.push({
      year: y,
      month: m,
      base,
      allowance: allow,
      overtime: ot,
      overtimeHours: otHours,
      total: base + allow + ot,
      hasRecord: rec !== null || otHours > 0,
    });
  }

  const monthSet = new Set(months.map(({ y, m }) => `${y}-${m}`));
  let totalBonus = 0;
  for (const b of bonuses) {
    const d = parseISO(b.date);
    if (d && monthSet.has(`${d.y}-${d.m}`)) {
      totalBonus += b.amount;
    }
  }

  return {
    base: totalBase,
    allowance: totalAllow,
    overtime: totalOt,
    overtimeHours: totalOtHours,
    bonus: totalBonus,
    total: totalBase + totalAllow + totalOt + totalBonus,
    months: monthRows,
  };
}

export function fiscalYearMonths(fiscalStartMonth: number, fiscalYear: number): { y: number; m: number }[] {
  const months: { y: number; m: number }[] = [];
  let y = fiscalYear;
  let m = fiscalStartMonth;
  for (let i = 0; i < 12; i++) {
    months.push({ y, m });
    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
  }
  return months;
}

export function fiscalYearLabel(fiscalStartMonth: number, fiscalYear: number): string {
  if (fiscalStartMonth === 1) {
    return `${fiscalYear}年（1月〜12月）`;
  }
  const endYear = fiscalYear + 1;
  const endMonth = fiscalStartMonth - 1;
  return `${fiscalYear}年度（${fiscalStartMonth}月〜${endYear}年${endMonth}月）`;
}

export function currentFiscalYear(fiscalStartMonth: number, today?: YMD): number {
  const t = today ?? parseISO(new Date().toISOString().slice(0, 10))!;
  return t.m >= fiscalStartMonth ? t.y : t.y - 1;
}

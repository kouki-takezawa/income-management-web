import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus, TrendingUp } from "lucide-react";
import { requireUserId } from "@/lib/session";
import {
  getBonuses,
  getLeaveUsages,
  getMonthlyRecords,
  getOrCreateSettings,
  getOvertimeEntries,
} from "@/lib/data";
import { parseYearParam } from "@/lib/params";
import { todayYMD } from "@/lib/business/dates";
import { annualSummary, currentFiscalYear, fiscalYearLabel } from "@/lib/business/salary";
import { leaveUsedInFiscalYear } from "@/lib/business/leave";
import { yen, daysLabel } from "@/lib/format";
import { THEME } from "@/lib/theme";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { FiscalYearNav } from "@/components/Nav";

interface ChangeMeta {
  Icon: LucideIcon;
  color: string;
  text: string;
}

function computeChange(current: number, previous: number, isIncomeMetric: boolean): ChangeMeta {
  if (previous === 0) {
    if (current === 0) return { Icon: Minus, color: THEME.textMuted, text: "±0%" };
    return { Icon: ArrowUp, color: isIncomeMetric ? THEME.success : THEME.textSecondary, text: "新規" };
  }
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 1) {
    return { Icon: Minus, color: THEME.textMuted, text: "±0%" };
  }
  const increasing = pct > 0;
  const color = isIncomeMetric ? (increasing ? THEME.success : THEME.danger) : THEME.textSecondary;
  return { Icon: increasing ? ArrowUp : ArrowDown, color, text: `${increasing ? "+" : ""}${pct.toFixed(1)}%` };
}

function ComparisonRow({
  label,
  current,
  previous,
  currentLabel,
  previousLabel,
  isIncomeMetric,
  format,
}: {
  label: string;
  current: number;
  previous: number;
  currentLabel: string;
  previousLabel: string;
  isIncomeMetric: boolean;
  format: (n: number) => string;
}) {
  const { Icon, color, text } = computeChange(current, previous, isIncomeMetric);
  return (
    <div className="grid grid-cols-2 items-center gap-x-3 gap-y-2 rounded-2xl px-4 py-4 sm:grid-cols-[1.4fr_1fr_1fr_5.5rem]">
      <span className="col-span-2 text-sm font-bold text-text-primary sm:col-span-1">{label}</span>
      <div>
        <div className="text-[10px] text-text-muted sm:hidden">{currentLabel}</div>
        <div className="truncate text-sm font-semibold text-text-primary sm:text-right">{format(current)}</div>
      </div>
      <div>
        <div className="text-[10px] text-text-muted sm:hidden">{previousLabel}</div>
        <div className="truncate text-sm text-text-secondary sm:text-right">{format(previous)}</div>
      </div>
      <div className="col-span-2 flex items-center gap-1.5 sm:col-span-1 sm:justify-end">
        <Icon size={14} color={color} />
        <span className="text-xs font-bold" style={{ color }}>
          {text}
        </span>
      </div>
    </div>
  );
}

export default async function ComparisonPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const today = todayYMD();

  const [settings, monthlyRecords, overtimeEntries, bonuses, leaveUsages] = await Promise.all([
    getOrCreateSettings(userId),
    getMonthlyRecords(userId),
    getOvertimeEntries(userId),
    getBonuses(userId),
    getLeaveUsages(userId),
  ]);

  const fiscalYear = parseYearParam(params.fy, currentFiscalYear(settings.fiscalStartMonth, today));
  const prevFiscalYear = fiscalYear - 1;

  // 前年比較: 既存の annualSummary を年度違いで2回呼び出すだけ（集計ロジックの再実装はしない）
  const current = annualSummary(settings, monthlyRecords, overtimeEntries, bonuses, settings.fiscalStartMonth, fiscalYear);
  const previous = annualSummary(settings, monthlyRecords, overtimeEntries, bonuses, settings.fiscalStartMonth, prevFiscalYear);

  const currentLeaveUsed = leaveUsedInFiscalYear(leaveUsages, settings.fiscalStartMonth, fiscalYear);
  const previousLeaveUsed = leaveUsedInFiscalYear(leaveUsages, settings.fiscalStartMonth, prevFiscalYear);

  const currentLabel = fiscalYearLabel(settings.fiscalStartMonth, fiscalYear);
  const previousLabel = fiscalYearLabel(settings.fiscalStartMonth, prevFiscalYear);

  const rows = [
    {
      label: "総支給額（年収）",
      current: current.total,
      previous: previous.total,
      isIncomeMetric: true,
      format: yen,
    },
    {
      label: "基本給+手当",
      current: current.base + current.allowance,
      previous: previous.base + previous.allowance,
      isIncomeMetric: true,
      format: yen,
    },
    {
      label: "残業代",
      current: current.overtime,
      previous: previous.overtime,
      isIncomeMetric: true,
      format: yen,
    },
    {
      label: "賞与合計",
      current: current.bonus,
      previous: previous.bonus,
      isIncomeMetric: true,
      format: yen,
    },
    {
      label: "有給消化日数",
      current: currentLeaveUsed,
      previous: previousLeaveUsed,
      isIncomeMetric: false,
      format: daysLabel,
    },
  ];

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">前年比較</h1>
          <p className="mt-1 text-sm text-text-secondary">年度ごとの主要な指標を前年度と比較します</p>
        </div>
        <FiscalYearNav fiscalYear={fiscalYear} label={currentLabel} basePath="/comparison" param="fy" />
      </div>

      <Card>
        <SectionTitle icon={<TrendingUp size={16} />}>
          {currentLabel} と {previousLabel} の比較
        </SectionTitle>

        <div className="mt-3 hidden gap-x-3 px-4 text-xs font-semibold text-text-muted sm:grid sm:grid-cols-[1.4fr_1fr_1fr_5.5rem]">
          <span>項目</span>
          <span className="text-right">{currentLabel}</span>
          <span className="text-right">{previousLabel}</span>
          <span className="text-right">増減</span>
        </div>
        <div className="mt-1 flex flex-col divide-y divide-border/70">
          {rows.map((r) => (
            <ComparisonRow
              key={r.label}
              label={r.label}
              current={r.current}
              previous={r.previous}
              currentLabel={currentLabel}
              previousLabel={previousLabel}
              isIncomeMetric={r.isIncomeMetric}
              format={r.format}
            />
          ))}
        </div>
      </Card>

      <p className="text-[11px] leading-relaxed text-text-muted">
        ※ 増減率は前年度比。前年度の実績が0の項目は「新規」と表示します。±1%未満の変動は「±0%」（横ばい）として扱っています。
      </p>
    </div>
  );
}

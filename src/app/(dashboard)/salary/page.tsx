import Link from "next/link";
import { CalendarDays, Wallet, Clock3, Zap, ClipboardList, CheckCircle2, Circle } from "lucide-react";
import { requireUserId } from "@/lib/session";
import { getMonthlyRecords, getOrCreateSettings, getOvertimeEntries } from "@/lib/data";
import { parseYearMonthParam } from "@/lib/params";
import { todayYMD } from "@/lib/business/dates";
import { findRecord, monthOvertimeSummary, recordAllowanceTotal, recordBaseSalary } from "@/lib/business/salary";
import { MONTH_NAMES_JP } from "@/lib/business/constants";
import { yen, hoursLabel } from "@/lib/format";
import { THEME } from "@/lib/theme";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { MonthNav } from "@/components/Nav";
import { OvertimeCalendar } from "@/components/salary/OvertimeCalendar";
import { MonthRecordEditor } from "@/components/salary/MonthRecordEditor";

export default async function SalaryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const today = todayYMD();

  const [settings, monthlyRecords, overtimeEntries] = await Promise.all([
    getOrCreateSettings(userId),
    getMonthlyRecords(userId),
    getOvertimeEntries(userId),
  ]);

  const { year, month } = parseYearMonthParam(params.month, today.y, today.m);

  const record = findRecord(monthlyRecords, year, month);
  const base = recordBaseSalary(settings, record);
  const allow = recordAllowanceTotal(settings, record);
  const { pay: otPay, hours: otHours } = monthOvertimeSummary(settings, overtimeEntries, year, month);
  const monthTotal = base + allow + otPay;

  const defaultAllowanceTotal = settings.allowances.reduce((s, a) => s + a.amount, 0);

  let yearTotal = 0;
  const yearRows = [];
  for (let m = 1; m <= 12; m++) {
    const recM = findRecord(monthlyRecords, year, m);
    const baseM = recordBaseSalary(settings, recM);
    const allowM = recordAllowanceTotal(settings, recM);
    const { pay: otPayM, hours: otHoursM } = monthOvertimeSummary(settings, overtimeEntries, year, m);
    const totalM = baseM + allowM + otPayM;
    yearTotal += totalM;
    yearRows.push({
      month: m,
      base: baseM,
      allowance: allowM,
      otPay: otPayM,
      otHours: otHoursM,
      total: totalM,
      filled: recM !== null || otHoursM > 0,
    });
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">給与・残業</h1>
          <p className="mt-1 text-sm text-text-secondary">
            残業代は基本給・所定労働時間から自動計算されます。日付をタップして入力してください
          </p>
        </div>
        <MonthRecordEditor
          year={year}
          month={month}
          record={record}
          defaultBaseSalary={settings.baseSalary}
          defaultAllowanceTotal={defaultAllowanceTotal}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="基本給+手当" value={yen(base + allow)} color={THEME.primary} icon={<Wallet size={18} />} />
        <StatCard label="残業時間" value={hoursLabel(otHours)} color={THEME.accent} icon={<Clock3 size={18} />} />
        <StatCard
          label="残業代"
          value={yen(otPay)}
          sub="基本給から自動計算"
          color={THEME.pink}
          icon={<Zap size={18} />}
        />
        <StatCard label="当月合計" value={yen(monthTotal)} color={THEME.amber} icon={<ClipboardList size={18} />} />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle icon={<CalendarDays size={16} />}>残業カレンダー</SectionTitle>
          <MonthNav year={year} month={month} basePath="/salary" param="month" />
        </div>
        <p className="mt-2.5 text-[11px] text-text-muted">日付をタップすると残業時間の追加・編集ができます</p>
        <div className="mt-3">
          <OvertimeCalendar year={year} month={month} entries={overtimeEntries} settings={settings} />
        </div>
      </Card>

      <StatCard
        label={`${year}年 年間合計（実績・概算）`}
        value={yen(yearTotal)}
        sub="各月の合計を12ヶ月分積算"
        color={THEME.primary}
        icon={<ClipboardList size={18} />}
      />

      <Card>
        <div className="hidden gap-2 px-2 pb-2 text-xs font-semibold text-text-muted sm:grid sm:grid-cols-[3rem_1.5rem_1fr_5rem_1fr_1fr_2.5rem]">
          <span>月</span>
          <span />
          <span>基本給+手当</span>
          <span>残業時間</span>
          <span>残業代</span>
          <span>合計</span>
          <span />
        </div>
        <div className="flex flex-col gap-2">
          {yearRows.map((r) => {
            const isCurrent = r.month === month;
            return (
              <div
                key={r.month}
                className="grid grid-cols-2 items-center gap-x-2 gap-y-1 rounded-2xl px-4 py-3.5 sm:grid-cols-[3rem_1.5rem_1fr_5rem_1fr_1fr_2.5rem]"
                style={{
                  backgroundColor: isCurrent ? THEME.primaryLight : r.filled ? "transparent" : "rgba(255,247,238,0.5)",
                }}
              >
                <span className="text-sm font-bold text-text-primary">{MONTH_NAMES_JP[r.month - 1]}</span>
                <span className="hidden sm:block">
                  {r.filled ? (
                    <CheckCircle2 size={16} color={THEME.success} />
                  ) : (
                    <Circle size={16} color={THEME.textMuted} />
                  )}
                </span>
                <span className="truncate text-sm text-text-primary">{yen(r.base + r.allowance)}</span>
                <span className="truncate text-sm text-text-secondary">{hoursLabel(r.otHours)}</span>
                <span className="truncate text-sm" style={{ color: THEME.accent }}>
                  {yen(r.otPay)}
                </span>
                <span className="truncate text-sm font-bold text-text-primary">{yen(r.total)}</span>
                <Link
                  href={`/salary?month=${year}-${String(r.month).padStart(2, "0")}`}
                  className="flex h-8 w-8 items-center justify-center justify-self-end rounded-full text-primary-dark hover:bg-primary-light"
                  aria-label="このカレンダーを開く"
                >
                  <CalendarDays size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

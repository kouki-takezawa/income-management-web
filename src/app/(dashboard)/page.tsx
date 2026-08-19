import Link from "next/link";
import {
  Wallet,
  PiggyBank,
  Info,
  Clock3,
  PieChart as PieChartIcon,
  BarChart3,
  Palmtree,
  AlertTriangle,
  Gift,
  FileSpreadsheet,
  FileText,
  Receipt,
  Landmark,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { requireUserId } from "@/lib/session";
import {
  generateRecurringBudgetTransactions,
  getAssetAccounts,
  getAssetSnapshots,
  getBonuses,
  getBudgetTransactions,
  getLeaveManualGrants,
  getLeaveUsages,
  getMonthlyRecords,
  getOrCreateSettings,
  getOvertimeEntries,
} from "@/lib/data";
import { parseYearMonthParam, parseYearParam } from "@/lib/params";
import { addMonths, daysInMonthOf, todayYMD, toISO } from "@/lib/business/dates";
import {
  annualSummary,
  currentFiscalYear,
  findRecord,
  fiscalYearLabel,
  monthOvertimeSummary,
  recordAllowanceTotal,
  recordBaseSalary,
} from "@/lib/business/salary";
import { estimateFurusatoLimit, estimateNetIncome } from "@/lib/business/tax";
import { leaveBalance } from "@/lib/business/leave";
import { monthlySummary as budgetMonthlySummary } from "@/lib/business/budget";
import { currentTotalAssets, totalAssetsAsOf } from "@/lib/business/assets";
import { MONTH_NAMES_JP } from "@/lib/business/constants";
import { yen, hoursLabel, daysLabel } from "@/lib/format";
import { THEME, CATEGORY_COLORS } from "@/lib/theme";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { MonthNav, FiscalYearNav } from "@/components/Nav";
import { IncomePieChart } from "@/components/charts/IncomePieChart";
import { MonthlyBarChart } from "@/components/charts/MonthlyBarChart";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; fy?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const today = todayYMD();

  // 定期支出の未生成分を先に追いつかせてから読む（/budget を開いていなくても反映されるように）
  await generateRecurringBudgetTransactions(userId);

  const [
    settings,
    monthlyRecords,
    overtimeEntries,
    bonuses,
    leaveUsages,
    leaveManualGrants,
    assetAccounts,
    assetSnapshots,
    budgetTransactions,
  ] = await Promise.all([
    getOrCreateSettings(userId),
    getMonthlyRecords(userId),
    getOvertimeEntries(userId),
    getBonuses(userId),
    getLeaveUsages(userId),
    getLeaveManualGrants(userId),
    getAssetAccounts(userId),
    getAssetSnapshots(userId),
    getBudgetTransactions(userId),
  ]);

  const { year: dashYear, month: dashMonth } = parseYearMonthParam(params.month, today.y, today.m);
  const totalAssets = currentTotalAssets(assetAccounts, assetSnapshots);

  const prevMonthYmd = addMonths(today, -1);
  const prevMonthEndDate = toISO({
    y: prevMonthYmd.y,
    m: prevMonthYmd.m,
    d: daysInMonthOf(prevMonthYmd.y, prevMonthYmd.m),
  });
  const prevTotalAssets = totalAssetsAsOf(assetAccounts, assetSnapshots, prevMonthEndDate);
  const assetChangePercent = prevTotalAssets > 0 ? ((totalAssets - prevTotalAssets) / prevTotalAssets) * 100 : null;

  const budgetSummary = budgetMonthlySummary(
    budgetTransactions,
    `${dashYear}-${String(dashMonth).padStart(2, "0")}`
  );
  const fiscalYear = parseYearParam(params.fy, currentFiscalYear(settings.fiscalStartMonth, today));

  const monthRecord = findRecord(monthlyRecords, dashYear, dashMonth);
  const monthBase = recordBaseSalary(settings, monthRecord);
  const monthAllow = recordAllowanceTotal(settings, monthRecord);
  const { pay: monthOtPay, hours: monthOtHours } = monthOvertimeSummary(settings, overtimeEntries, dashYear, dashMonth);
  const monthGross = monthBase + monthAllow + monthOtPay;

  // 「今月のお金の流れ」: 給与の総支給に家計簿の収入（副収入など）を足したものを収入合計とし、
  // 家計簿の支出を差し引いた額を貯蓄として見せる。給与と家計簿という別々の記録を、
  // ダッシュボードでは1つの流れとして繋げて表示する。
  const totalMonthIncome = monthGross + budgetSummary.income;
  const monthSavings = totalMonthIncome - budgetSummary.expense;
  const savingsRate = totalMonthIncome > 0 ? (monthSavings / totalMonthIncome) * 100 : null;

  const monthNet =
    settings.showNetEstimate && monthGross > 0
      ? estimateNetIncome(monthGross, settings.age, settings.prefecture, 12)
      : null;
  const furusato = monthNet ? estimateFurusatoLimit(monthGross * 12, settings.age, settings.prefecture) : null;

  const summary = annualSummary(settings, monthlyRecords, overtimeEntries, bonuses, settings.fiscalStartMonth, fiscalYear);
  const leaveBal = leaveBalance(
    { hireDate: settings.hireDate, annualLeaveDays: settings.annualLeaveDays },
    leaveManualGrants,
    leaveUsages,
    today
  );

  const breakdown = [
    { name: "基本給", value: summary.base, color: CATEGORY_COLORS.base },
    { name: "手当", value: summary.allowance, color: CATEGORY_COLORS.allowance },
    { name: "残業代", value: summary.overtime, color: CATEGORY_COLORS.overtime },
    { name: "賞与", value: summary.bonus, color: CATEGORY_COLORS.bonus },
  ];

  const barData = summary.months.map((m) => ({
    label: MONTH_NAMES_JP[m.month - 1],
    total: m.total,
    hasData: m.hasRecord,
  }));

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">ダッシュボード</h1>
          <p className="mt-1 text-sm text-text-secondary">収入・支出・資産の状況をまとめて確認できます</p>
        </div>
        <MonthNav year={dashYear} month={dashMonth} basePath="/" param="month" />
      </div>

      <Link href="/assets">
        <Card className="bg-primary-light!">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-text-secondary">
                <Landmark size={16} />
                資産総額
              </div>
              <div className="mt-2 truncate text-4xl font-black text-text-primary sm:text-5xl">{yen(totalAssets)}</div>
              {assetChangePercent !== null && (
                <div
                  className={`mt-2 flex items-center gap-1 text-sm font-semibold ${
                    assetChangePercent >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {assetChangePercent >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                  先月末比 {assetChangePercent >= 0 ? "+" : ""}
                  {assetChangePercent.toFixed(1)}%
                </div>
              )}
            </div>
            <span className="text-xs font-semibold text-primary-dark">資産管理で詳しく見る →</span>
          </div>
        </Card>
      </Link>

      <div className="flex flex-col gap-4">
        <SectionTitle icon={<Wallet size={16} />}>今月のお金の流れ</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="収入合計"
            value={yen(totalMonthIncome)}
            sub="給与総支給＋家計簿の収入"
            color={THEME.success}
            icon={<ArrowDownToLine size={18} />}
          />
          <StatCard
            label="支出"
            value={yen(budgetSummary.expense)}
            sub="家計簿の記録より"
            color={THEME.danger}
            icon={<ArrowUpFromLine size={18} />}
          />
          <StatCard
            label="今月の貯蓄"
            value={yen(monthSavings)}
            sub={savingsRate !== null ? `貯蓄率 ${savingsRate.toFixed(0)}%` : null}
            color={THEME.primary}
            icon={<PiggyBank size={18} />}
          />
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/budget">
            <Button type="button" variant="outline" icon={<Receipt size={14} />}>
              家計簿を見る
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="bg-primary-light!" style={{ minHeight: 260 }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
              <Wallet size={20} />
            </div>
            <span className="text-sm font-bold text-text-secondary">今月の総支給（額面）</span>
          </div>
          <div className="mt-4 truncate text-4xl font-black text-text-primary">{yen(monthGross)}</div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Pill color={THEME.primaryDark}>基本給+手当 {yen(monthBase + monthAllow)}</Pill>
            <Pill color={THEME.accent}>残業代 {yen(monthOtPay)}</Pill>
          </div>
          <div className="mt-2.5 text-[11px] text-text-muted">残業時間 {hoursLabel(monthOtHours)}</div>
        </Card>

        <Card className="bg-success/35!" style={{ minHeight: 260 }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success text-white">
              <PiggyBank size={20} />
            </div>
            <span className="text-sm font-bold text-text-secondary">今月の手取り概算</span>
          </div>
          {monthNet ? (
            <>
              <div className="mt-4 truncate text-4xl font-black text-text-primary">{yen(monthNet.net)}</div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-text-secondary">社会保険料</span>
                <span className="text-text-primary">-{yen(monthNet.socialInsurance)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-text-secondary">所得税+住民税(概算)</span>
                <span className="text-text-primary">-{yen(monthNet.incomeTax + monthNet.residentTax)}</span>
              </div>
              <div className="mt-3 text-[10px] leading-relaxed text-text-muted">
                ※ {settings.prefecture}・{settings.age}歳想定、年収を12等分した簡易概算です。実際の手取り額とは異なる場合があります。
              </div>
            </>
          ) : (
            <div className="mt-8 flex flex-col items-center gap-2 text-center">
              <Info size={22} className="text-text-muted" />
              <p className="text-sm text-text-muted">
                {settings.showNetEstimate ? "この月のデータがまだありません" : "非表示に設定されています"}
              </p>
              <p className="text-[11px] text-text-muted">「設定」からいつでも表示できます</p>
            </div>
          )}
        </Card>
      </div>

      {furusato && (
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: THEME.pink, color: "#fff" }}>
              <Gift size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-text-secondary">ふるさと納税 目安上限額</div>
              <div className="mt-1 text-3xl font-black text-text-primary">{yen(furusato.limit)}</div>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
            ※ 独身・扶養なしという単純化した前提での概算です。自己負担額（¥2,000）は必ず発生します。iDeCo・医療費控除・扶養控除など、ここで考慮していない他の控除により実際の上限は変動します。あくまで目安としてご利用ください。
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-text-primary">年間サマリー</h2>
          <div className="flex flex-wrap items-center gap-2.5">
            <FiscalYearNav
              fiscalYear={fiscalYear}
              label={fiscalYearLabel(settings.fiscalStartMonth, fiscalYear)}
              basePath="/"
              param="fy"
              extra={`&month=${dashYear}-${String(dashMonth).padStart(2, "0")}`}
            />
            <Link href={`/api/export/csv?fy=${fiscalYear}`} prefetch={false}>
              <Button type="button" variant="outline" icon={<FileSpreadsheet size={14} />}>
                CSVダウンロード
              </Button>
            </Link>
            <Link href={`/api/export/pdf?fy=${fiscalYear}`} prefetch={false}>
              <Button type="button" variant="outline" icon={<FileText size={14} />}>
                PDFダウンロード
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="年収（額面・年度合計）"
            value={yen(summary.total)}
            sub="基本給+手当+残業代+賞与"
            color={THEME.primary}
            icon={<Wallet size={18} />}
          />
          <StatCard
            label="年間残業時間"
            value={hoursLabel(summary.overtimeHours)}
            sub="カレンダーから自動集計"
            color={THEME.accent}
            icon={<Clock3 size={18} />}
          />
          <StatCard
            label="有給残日数"
            value={daysLabel(leaveBal.remaining)}
            color={THEME.success}
            icon={<Palmtree size={18} />}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Card className="h-auto lg:col-span-7 sm:h-[320px]">
            <SectionTitle icon={<PieChartIcon size={16} />}>年収の内訳</SectionTitle>
            <div className="mt-2 h-72 sm:h-60">
              <IncomePieChart data={breakdown} />
            </div>
          </Card>
          <Card className="lg:col-span-5" style={{ height: 320 }}>
            <SectionTitle icon={<BarChart3 size={16} />}>月別支給額の推移</SectionTitle>
            <div style={{ height: 250 }} className="mt-2">
              <MonthlyBarChart data={barData} />
            </div>
          </Card>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionTitle icon={<Palmtree size={16} />}>有給休暇</SectionTitle>
        <Card>
          <div className="flex flex-wrap items-center gap-6 divide-x divide-border">
            <div className="pr-6">
              <div className="text-xs text-text-secondary">残日数</div>
              <div className="mt-1 text-2xl font-extrabold text-success">{daysLabel(leaveBal.remaining)}</div>
            </div>
            <div className="px-6">
              <div className="text-xs text-text-secondary">累計付与 / 消化</div>
              <div className="mt-1 text-base font-semibold text-text-primary">
                {daysLabel(leaveBal.grantedTotal)} / {daysLabel(leaveBal.usedTotal)}
              </div>
            </div>
            <div className="min-w-0 flex-1 px-6">
              <div className="text-xs text-text-secondary">次回付与</div>
              <div className="mt-1 truncate text-sm font-semibold text-text-primary">
                {leaveBal.nextGrant
                  ? `${leaveBal.nextGrant.date.y}/${String(leaveBal.nextGrant.date.m).padStart(2, "0")}/${String(
                      leaveBal.nextGrant.date.d
                    ).padStart(2, "0")}（${leaveBal.nextGrant.days}日）`
                  : "設定画面で入社日を登録してください"}
              </div>
            </div>
            {leaveBal.soonExpiring.length > 0 && (
              <div className="flex items-center gap-2 rounded-2xl bg-warning/15 px-3.5 py-2 pl-6">
                <AlertTriangle size={16} className="shrink-0 text-warning" />
                <span className="text-xs font-semibold whitespace-nowrap text-warning">
                  {daysLabel(leaveBal.soonExpiring.reduce((s, b) => s + b.remaining, 0))}が時効間近
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

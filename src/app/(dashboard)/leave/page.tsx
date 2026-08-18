import Link from "next/link";
import { AlertTriangle, Info, Palmtree, PlusCircle, CalendarClock, CalendarCheck, History } from "lucide-react";
import { requireUserId } from "@/lib/session";
import { getLeaveManualGrants, getLeaveUsages, getOrCreateSettings } from "@/lib/data";
import { parseYearMonthParam } from "@/lib/params";
import { todayYMD, formatSlash } from "@/lib/business/dates";
import { leaveBalance } from "@/lib/business/leave";
import { daysLabel } from "@/lib/format";
import { THEME } from "@/lib/theme";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ManualGrantButton } from "@/components/leave/ManualGrantButton";
import { LeaveManager } from "@/components/leave/LeaveManager";

export default async function LeavePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const today = todayYMD();

  const settings = await getOrCreateSettings(userId);

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary">有給休暇</h1>
        <p className="mt-1 text-sm text-text-secondary">
          「設定」で登録した年間付与日数をもとに、入社6ヶ月後から毎年自動で付与します
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <ManualGrantButton />
      </div>
    </div>
  );

  if (!settings.hireDate) {
    return (
      <div className="flex flex-col gap-7">
        {header}
        <Card>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Info size={26} className="text-primary" />
            <p className="text-base font-bold text-text-primary">入社日が未設定です</p>
            <p className="text-sm text-text-secondary">
              「設定」画面で入社日と年間付与日数を登録すると、有給の自動付与・残日数が計算されます。
            </p>
            <Link href="/settings" className="mt-2 text-sm font-semibold text-primary-dark hover:underline">
              設定画面へ
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!settings.annualLeaveDays) {
    return (
      <div className="flex flex-col gap-7">
        {header}
        <Card>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Info size={26} className="text-primary" />
            <p className="text-base font-bold text-text-primary">年間付与日数が未設定です</p>
            <p className="text-sm text-text-secondary">
              「設定」画面の「有給休暇の設定」で、毎年付与される日数を登録してください。
            </p>
            <Link href="/settings" className="mt-2 text-sm font-semibold text-primary-dark hover:underline">
              設定画面へ
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const [usages, manualGrants] = await Promise.all([getLeaveUsages(userId), getLeaveManualGrants(userId)]);
  const { year, month } = parseYearMonthParam(params.month, today.y, today.m);

  const bal = leaveBalance({ hireDate: settings.hireDate, annualLeaveDays: settings.annualLeaveDays }, manualGrants, usages, today);

  const nextGrantLabel = bal.nextGrant ? `${formatSlash(bal.nextGrant.date)}（${bal.nextGrant.days}日）` : "算定済みの将来付与はありません";

  const grantsSorted = [...bal.buckets].sort((a, b) => (a.date.y !== b.date.y ? b.date.y - a.date.y : a.date.m !== b.date.m ? b.date.m - a.date.m : b.date.d - a.date.d));

  return (
    <div className="flex flex-col gap-7">
      {header}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="残日数" value={daysLabel(bal.remaining)} color={THEME.success} icon={<Palmtree size={18} />} />
        <StatCard label="累計付与" value={daysLabel(bal.grantedTotal)} color={THEME.primary} icon={<PlusCircle size={18} />} />
        <StatCard label="消化日数" value={daysLabel(bal.usedTotal)} color={THEME.accent} icon={<CalendarCheck size={18} />} />
        <StatCard label="次回付与予定" value={nextGrantLabel} color={THEME.amber} icon={<CalendarClock size={18} />} />
      </div>

      {bal.soonExpiring.length > 0 && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-warning/12 px-5 py-3.5">
          <AlertTriangle size={18} className="shrink-0 text-warning" />
          <p className="text-sm font-semibold text-warning">
            {daysLabel(bal.soonExpiring.reduce((s, b) => s + b.remaining, 0))}分が90日以内に時効（付与から2年）で消滅予定です。計画的な取得をおすすめします。
          </p>
        </div>
      )}

      <LeaveManager year={year} month={month} usages={usages} />

      <Card>
        <SectionTitle icon={<History size={16} />}>付与履歴</SectionTitle>
        <div className="mt-3 flex max-h-[340px] flex-col gap-1 overflow-y-auto scrollbar-thin">
          {grantsSorted.length === 0 && <p className="px-2 py-6 text-sm text-text-muted">付与履歴はありません</p>}
          {grantsSorted.map((b, i) => {
            const expired = b.expiry.y < today.y || (b.expiry.y === today.y && (b.expiry.m < today.m || (b.expiry.m === today.m && b.expiry.d < today.d)));
            return (
              <div key={i} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm">
                <span className="w-[92px] shrink-0 text-text-secondary">{formatSlash(b.date)}</span>
                <span className="min-w-0 flex-1 truncate text-text-primary">{b.label}</span>
                <span className="w-12 shrink-0 text-text-primary">{b.days}日</span>
                <span className="w-16 shrink-0 font-semibold" style={{ color: expired ? THEME.textMuted : THEME.success }}>
                  残{b.remaining}日
                </span>
                <span className="w-32 shrink-0 text-right text-[11px] text-text-muted">時効 {formatSlash(b.expiry)}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

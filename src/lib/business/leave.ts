// 有給休暇管理（付与日数は自動計算せず、設定した「年間付与日数」を使用。
// 付与のタイミングのみ、入社から6ヶ月後を初回として12ヶ月ごとに自動で繰り返す。
// 時効2年をシミュレート）
// Python版 app_state.py の auto_grants / next_grant_date / leave_balance を移植
import { addMonths, addYears, compareYMD, diffDays, parseISO, todayYMD, YMD } from "./dates";

const FIRST_GRANT_MONTHS_OFFSET = 6;
const GRANT_INTERVAL_MONTHS = 12;

export interface GrantSeed {
  date: YMD;
  days: number;
  label: string;
}

export interface LeaveBucket {
  date: YMD;
  days: number;
  remaining: number;
  expiry: YMD;
  label: string;
}

export interface LeaveUsageLike {
  date: string;
  days: number;
}

export interface LeaveManualGrantLike {
  date: string;
  days: number;
  note?: string | null;
}

export function autoGrants(hireDateStr: string | null | undefined, annualDays: number, asOf: YMD): GrantSeed[] {
  const hire = parseISO(hireDateStr);
  if (!hire || !annualDays) return [];
  const grants: GrantSeed[] = [];
  let monthsOffset = FIRST_GRANT_MONTHS_OFFSET;
   
  while (true) {
    const gdate = addMonths(hire, monthsOffset);
    if (compareYMD(gdate, asOf) > 0) break;
    grants.push({ date: gdate, days: annualDays, label: "定期付与" });
    monthsOffset += GRANT_INTERVAL_MONTHS;
  }
  return grants;
}

export function nextGrantDate(
  hireDateStr: string | null | undefined,
  annualDays: number,
  asOf: YMD
): { date: YMD; days: number } | null {
  const hire = parseISO(hireDateStr);
  if (!hire || !annualDays) return null;
  let monthsOffset = FIRST_GRANT_MONTHS_OFFSET;
   
  while (true) {
    const gdate = addMonths(hire, monthsOffset);
    if (compareYMD(gdate, asOf) > 0) return { date: gdate, days: annualDays };
    monthsOffset += GRANT_INTERVAL_MONTHS;
  }
}

export interface LeaveBalanceSettings {
  hireDate: string | null | undefined;
  annualLeaveDays: number;
}

export interface LeaveBalanceResult {
  remaining: number;
  grantedTotal: number;
  usedTotal: number;
  buckets: LeaveBucket[];
  nextGrant: { date: YMD; days: number } | null;
  soonExpiring: LeaveBucket[];
}

type Event =
  | { date: YMD; priority: 0; kind: "grant"; bucket: LeaveBucket }
  | { date: YMD; priority: 1; kind: "use"; amount: number };

export function leaveBalance(
  settings: LeaveBalanceSettings,
  manualGrants: LeaveManualGrantLike[],
  usages: LeaveUsageLike[],
  asOf: YMD = todayYMD()
): LeaveBalanceResult {
  const hireDateStr = settings.hireDate;
  const annualDays = settings.annualLeaveDays ?? 0;

  const buckets: LeaveBucket[] = [];
  for (const g of autoGrants(hireDateStr, annualDays, asOf)) {
    buckets.push({ date: g.date, days: g.days, remaining: g.days, expiry: addYears(g.date, 2), label: g.label });
  }
  for (const g of manualGrants) {
    const gdate = parseISO(g.date);
    if (gdate && compareYMD(gdate, asOf) <= 0 && g.days > 0) {
      buckets.push({
        date: gdate,
        days: g.days,
        remaining: g.days,
        expiry: addYears(gdate, 2),
        label: g.note || "手動付与",
      });
    }
  }
  buckets.sort((a, b) => compareYMD(a.date, b.date));

  const events: Event[] = [];
  for (const b of buckets) {
    events.push({ date: b.date, priority: 0, kind: "grant", bucket: b });
  }
  for (const u of usages) {
    const udate = parseISO(u.date);
    if (udate && compareYMD(udate, asOf) <= 0) {
      events.push({ date: udate, priority: 1, kind: "use", amount: u.days });
    }
  }
  for (const g of manualGrants) {
    const gdate = parseISO(g.date);
    if (gdate && compareYMD(gdate, asOf) <= 0 && g.days < 0) {
      events.push({ date: gdate, priority: 1, kind: "use", amount: -g.days });
    }
  }
  events.sort((a, b) => {
    const c = compareYMD(a.date, b.date);
    if (c !== 0) return c;
    return a.priority - b.priority;
  });

  let active: LeaveBucket[] = [];
  for (const ev of events) {
    if (ev.kind === "grant") {
      active.push(ev.bucket);
    } else {
      // 消化イベント: この時点で既に時効消滅しているバケットを先に除外
      active = active.filter((b) => compareYMD(b.expiry, ev.date) >= 0);
      active.sort((a, b) => compareYMD(a.date, b.date));
      let amount = ev.amount;
      for (const b of active) {
        if (amount <= 0) break;
        const take = Math.min(b.remaining, amount);
        b.remaining -= take;
        amount -= take;
      }
    }
  }

  active = active.filter((b) => compareYMD(b.expiry, asOf) >= 0);
  const remainingTotal = active.reduce((sum, b) => sum + b.remaining, 0);
  const grantedTotal = buckets
    .filter((b) => compareYMD(b.date, asOf) <= 0)
    .reduce((sum, b) => sum + b.days, 0);
  const usedTotal = usages.reduce((sum, u) => {
    const d = parseISO(u.date);
    return d && compareYMD(d, asOf) <= 0 ? sum + u.days : sum;
  }, 0);

  const upcoming = hireDateStr ? nextGrantDate(hireDateStr, annualDays, asOf) : null;
  const soonExpiring = active
    .filter((b) => diffDays(b.expiry, asOf) <= 90 && b.remaining > 0)
    .sort((a, b) => compareYMD(a.expiry, b.expiry));

  return {
    remaining: remainingTotal,
    grantedTotal,
    usedTotal,
    buckets,
    nextGrant: upcoming,
    soonExpiring,
  };
}

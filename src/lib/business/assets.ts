// 資産管理（口座・残高スナップショット）の集計ロジック。DBアクセスを含まない純粋関数のみを置く。
import { addMonths, daysInMonthOf, toISO, todayYMD, type YMD } from "@/lib/business/dates";

export interface AssetAccountData {
  id: string;
  name: string;
  type: "cash" | "bank" | "investment";
}

export interface AssetSnapshotData {
  id: string;
  assetAccountId: string;
  date: string; // YYYY-MM-DD
  value: number;
  note: string | null;
}

export const ASSET_TYPE_LABEL: Record<AssetAccountData["type"], string> = {
  cash: "現金",
  bank: "銀行預金",
  investment: "投資信託・株式等",
};

export const ASSET_TYPE_COLOR: Record<AssetAccountData["type"], string> = {
  cash: "#F6CD79",
  bank: "#8FCFBB",
  investment: "#C9AEE0",
};

export function latestSnapshot(
  snapshots: AssetSnapshotData[],
  accountId: string
): AssetSnapshotData | undefined {
  return snapshots
    .filter((s) => s.assetAccountId === accountId)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

// asOfDate 時点でアカウント毎に「その日以前で最新」のスナップショットを合計する
export function totalAssetsAsOf(
  accounts: AssetAccountData[],
  snapshots: AssetSnapshotData[],
  asOfDate: string
): number {
  let total = 0;
  for (const account of accounts) {
    const latest = snapshots
      .filter((s) => s.assetAccountId === account.id && s.date <= asOfDate)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (latest) total += latest.value;
  }
  return total;
}

export function currentTotalAssets(accounts: AssetAccountData[], snapshots: AssetSnapshotData[]): number {
  return accounts.reduce((sum, account) => sum + (latestSnapshot(snapshots, account.id)?.value ?? 0), 0);
}

export interface AllocationItem {
  name: string;
  value: number;
  color: string;
}

export function assetAllocation(
  accounts: AssetAccountData[],
  snapshots: AssetSnapshotData[]
): AllocationItem[] {
  const totals = new Map<AssetAccountData["type"], number>();
  for (const account of accounts) {
    const snapshot = latestSnapshot(snapshots, account.id);
    if (!snapshot) continue;
    totals.set(account.type, (totals.get(account.type) ?? 0) + snapshot.value);
  }
  return [...totals.entries()].map(([type, value]) => ({
    name: ASSET_TYPE_LABEL[type],
    value,
    color: ASSET_TYPE_COLOR[type],
  }));
}

// 直近 months ヶ月分（当月を含む）の資産総額推移。ダッシュボード/資産一覧のグラフ用。
export function assetsTrend(
  accounts: AssetAccountData[],
  snapshots: AssetSnapshotData[],
  today: YMD = todayYMD(),
  months = 6
): { label: string; total: number }[] {
  const result: { label: string; total: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const ymd = addMonths(today, -i);
    // その月の末日時点の残高で評価する
    const asOfDate = toISO({ y: ymd.y, m: ymd.m, d: daysInMonthOf(ymd.y, ymd.m) });
    result.push({ label: `${ymd.m}月`, total: totalAssetsAsOf(accounts, snapshots, asOfDate) });
  }
  return result;
}

export function accountValueTrend(
  snapshots: AssetSnapshotData[],
  accountId: string
): { date: string; value: number }[] {
  return [...snapshots]
    .filter((s) => s.assetAccountId === accountId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({ date: s.date.slice(5), value: s.value }));
}

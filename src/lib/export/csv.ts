import "server-only";
import type { AnnualSummary } from "@/lib/business/salary";
import { MONTH_NAMES_JP } from "@/lib/business/constants";
import { bonusByMonthMap, type ExportBonusLike } from "./shared";
import type { BudgetCategoryData, BudgetTransactionData } from "@/lib/business/budget";
import { categoryName } from "@/lib/business/budget";
import type { AssetAccountData, AssetSnapshotData } from "@/lib/business/assets";

const BOM = String.fromCharCode(0xfeff);

/** CSVのフィールドとしてカンマ・改行・ダブルクォートを含む値を安全にエスケープする */
function csvField(value: string | number): string {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * 年度の月次内訳を CSV（UTF-8 + BOM。Windows の Excel でも文字化けしないように）
 * として組み立てる。12ヶ月分の行 + 合計行。
 */
export function buildAnnualCsv(summary: AnnualSummary, bonuses: ExportBonusLike[]): string {
  const bonusMap = bonusByMonthMap(bonuses);
  const lines: string[] = [];
  lines.push(["月", "基本給", "手当", "残業代", "賞与", "合計"].join(","));

  for (const m of summary.months) {
    const bonus = Math.round(bonusMap.get(`${m.year}-${m.month}`) ?? 0);
    const rowTotal = Math.round(m.base + m.allowance + m.overtime + bonus);
    lines.push(
      [
        MONTH_NAMES_JP[m.month - 1],
        Math.round(m.base),
        Math.round(m.allowance),
        Math.round(m.overtime),
        bonus,
        rowTotal,
      ].join(",")
    );
  }

  lines.push(
    [
      "合計",
      Math.round(summary.base),
      Math.round(summary.allowance),
      Math.round(summary.overtime),
      Math.round(summary.bonus),
      Math.round(summary.total),
    ].join(",")
  );

  return BOM + lines.join("\r\n") + "\r\n";
}

/** 家計簿の全取引を CSV にする（全期間・日付昇順） */
export function buildBudgetCsv(
  transactions: BudgetTransactionData[],
  categories: BudgetCategoryData[]
): string {
  const lines: string[] = [];
  lines.push(["日付", "種別", "カテゴリ", "金額", "メモ"].join(","));

  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  for (const t of sorted) {
    lines.push(
      [
        csvField(t.date),
        csvField(t.type === "income" ? "収入" : "支出"),
        csvField(categoryName(categories, t.categoryId)),
        t.amount,
        csvField(t.memo ?? ""),
      ].join(",")
    );
  }

  return BOM + lines.join("\r\n") + "\r\n";
}

/** 資産の残高記録を CSV にする（全口座・全期間・日付昇順） */
export function buildAssetsCsv(accounts: AssetAccountData[], snapshots: AssetSnapshotData[]): string {
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "不明な口座";
  const lines: string[] = [];
  lines.push(["日付", "口座名", "残高・評価額", "メモ"].join(","));

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  for (const s of sorted) {
    lines.push(
      [csvField(s.date), csvField(accountName(s.assetAccountId)), s.value, csvField(s.note ?? "")].join(",")
    );
  }

  return BOM + lines.join("\r\n") + "\r\n";
}

import "server-only";
import type { AnnualSummary } from "@/lib/business/salary";
import { MONTH_NAMES_JP } from "@/lib/business/constants";
import { bonusByMonthMap, type ExportBonusLike } from "./shared";

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

  // 先頭に UTF-8 BOM を付与 (Windows Excel 対策)。リテラル文字ではなくエスケープで
  // 明示することで、エディタ/ツールを経由しても確実に U+FEFF 1文字になるようにする。
  const BOM = String.fromCharCode(0xfeff);
  return BOM + lines.join("\r\n") + "\r\n";
}

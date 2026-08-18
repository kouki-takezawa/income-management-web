import "server-only";
import { parseISO } from "@/lib/business/dates";

export interface ExportBonusLike {
  date: string;
  amount: number;
}

/** 月ごとの賞与合計（キー: "YYYY-M"）。CSV/PDF エクスポートで共有する。 */
export function bonusByMonthMap(bonuses: ExportBonusLike[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const b of bonuses) {
    const d = parseISO(b.date);
    if (!d) continue;
    const key = `${d.y}-${d.m}`;
    map.set(key, (map.get(key) ?? 0) + b.amount);
  }
  return map;
}

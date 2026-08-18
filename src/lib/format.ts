// 表示用フォーマッタ

export function yen(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "¥0";
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

// Python の f"{x:g}" 相当（末尾の余計な 0 を省く数値表示）。
export function trimNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "0";
  const rounded = Math.round(n * 100) / 100;
  return rounded.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

export function hoursLabel(n: number | null | undefined): string {
  return `${trimNumber(n)} h`;
}

export function daysLabel(n: number | null | undefined): string {
  return `${trimNumber(n)} 日`;
}

// フォーム入力文字列 -> 数値（カンマ・円マーク除去、空欄は default）
export function toNumber(value: string | number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const cleaned = value.trim().replace(/,/g, "").replace(/¥/g, "");
  if (cleaned === "") return fallback;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

// 空欄は null（未入力=継承の表現に使う）
export function toOptionalNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value.trim() === "") return null;
  return toNumber(value, 0);
}

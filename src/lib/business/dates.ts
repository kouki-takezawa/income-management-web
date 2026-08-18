// 日付ユーティリティ（YYYY-MM-DD の文字列を扱う。タイムゾーンに依存しないよう
// Date オブジェクトの UTC ではなくローカルの年月日のみを使う独自実装）

export interface YMD {
  y: number;
  m: number; // 1-12
  d: number;
}

export function parseISO(s: string | null | undefined): YMD | null {
  if (!s) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  // 実在する日付かどうか検証
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return null;
  }
  return { y, m, d };
}

export function toISO(ymd: YMD): string {
  const mm = String(ymd.m).padStart(2, "0");
  const dd = String(ymd.d).padStart(2, "0");
  return `${ymd.y}-${mm}-${dd}`;
}

export function compareYMD(a: YMD, b: YMD): number {
  if (a.y !== b.y) return a.y - b.y;
  if (a.m !== b.m) return a.m - b.m;
  return a.d - b.d;
}

export function ymdLessOrEqual(a: YMD, b: YMD): boolean {
  return compareYMD(a, b) <= 0;
}

export function ymdLess(a: YMD, b: YMD): boolean {
  return compareYMD(a, b) < 0;
}

function daysInMonth(y: number, m: number): number {
  // m: 1-12
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function addMonths(ymd: YMD, months: number): YMD {
  const total = ymd.m - 1 + months;
  const y = ymd.y + Math.floor(total / 12);
  const m = ((total % 12) + 12) % 12 + 1;
  let day = ymd.d;
  const maxDay = daysInMonth(y, m);
  if (day > maxDay) day = maxDay;
  return { y, m, d: day };
}

export function addYears(ymd: YMD, years: number): YMD {
  const y = ymd.y + years;
  const maxDay = daysInMonth(y, ymd.m);
  const d = Math.min(ymd.d, maxDay);
  return { y, m: ymd.m, d };
}

export function todayYMD(): YMD {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}

// 2つの日付の差分日数 (a - b)
export function diffDays(a: YMD, b: YMD): number {
  const da = Date.UTC(a.y, a.m - 1, a.d);
  const db = Date.UTC(b.y, b.m - 1, b.d);
  return Math.round((da - db) / 86400000);
}

export function formatSlash(ymd: YMD): string {
  const mm = String(ymd.m).padStart(2, "0");
  const dd = String(ymd.d).padStart(2, "0");
  return `${ymd.y}/${mm}/${dd}`;
}

// 日曜=0 ... 土曜=6 (JavaScript の Date.getDay() と同じ)
export function weekdayOf(ymd: YMD): number {
  return new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d)).getUTCDay();
}

export function daysInMonthOf(y: number, m: number): number {
  return daysInMonth(y, m);
}

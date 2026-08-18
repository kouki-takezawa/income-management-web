export function parseYearMonthParam(
  value: string | undefined,
  fallbackYear: number,
  fallbackMonth: number
): { year: number; month: number } {
  if (value) {
    const m = /^(\d{4})-(\d{1,2})$/.exec(value);
    if (m) {
      const year = Number(m[1]);
      const month = Number(m[2]);
      if (month >= 1 && month <= 12) return { year, month };
    }
  }
  return { year: fallbackYear, month: fallbackMonth };
}

export function parseYearParam(value: string | undefined, fallback: number): number {
  if (value) {
    const n = Number(value);
    if (Number.isInteger(n)) return n;
  }
  return fallback;
}

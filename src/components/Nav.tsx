import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTH_NAMES_JP } from "@/lib/business/constants";

function monthHref(basePath: string, year: number, month: number, param: string): string {
  return `${basePath}?${param}=${year}-${String(month).padStart(2, "0")}`;
}

export function MonthNav({
  year,
  month,
  basePath,
  param = "month",
}: {
  year: number;
  month: number;
  basePath: string;
  param?: string;
}) {
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }
  let nextYear = year;
  let nextMonth = month + 1;
  if (nextMonth === 13) {
    nextMonth = 1;
    nextYear += 1;
  }

  return (
    <div className="flex items-center gap-0.5">
      <Link
        href={monthHref(basePath, prevYear, prevMonth, param)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-primary-light"
        aria-label="前の月"
      >
        <ChevronLeft size={18} />
      </Link>
      <span className="rounded-full bg-primary-light px-4 py-2 text-sm font-semibold text-text-primary">
        {year}年 {MONTH_NAMES_JP[month - 1]}
      </span>
      <Link
        href={monthHref(basePath, nextYear, nextMonth, param)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-primary-light"
        aria-label="次の月"
      >
        <ChevronRight size={18} />
      </Link>
    </div>
  );
}

export function FiscalYearNav({
  fiscalYear,
  label,
  basePath,
  param = "fy",
  extra = "",
}: {
  fiscalYear: number;
  label: string;
  basePath: string;
  param?: string;
  extra?: string;
}) {
  return (
    <div className="flex items-center gap-0">
      <Link
        href={`${basePath}?${param}=${fiscalYear - 1}${extra}`}
        className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary hover:bg-bg"
        aria-label="前の年度"
      >
        <ChevronLeft size={16} />
      </Link>
      <span className="rounded-full bg-bg px-3.5 py-1.5 text-xs font-semibold text-text-primary whitespace-nowrap">
        {label}
      </span>
      <Link
        href={`${basePath}?${param}=${fiscalYear + 1}${extra}`}
        className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary hover:bg-bg"
        aria-label="次の年度"
      >
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

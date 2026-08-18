"use client";

import type { ReactNode } from "react";
import { daysInMonthOf, weekdayOf, todayYMD, compareYMD } from "@/lib/business/dates";
import { WEEKDAY_NAMES_JP } from "@/lib/business/constants";
import { THEME } from "@/lib/theme";

export function CalendarGrid({
  year,
  month,
  renderCell,
  cellBg,
  onDayClick,
}: {
  year: number;
  month: number;
  renderCell: (day: number) => ReactNode;
  cellBg?: (day: number) => string | undefined;
  onDayClick: (day: number) => void;
}) {
  const sunOffset = weekdayOf({ y: year, m: month, d: 1 });
  const daysInMonth = daysInMonthOf(year, month);
  const cells: (number | null)[] = [...Array(sunOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const today = todayYMD();

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_NAMES_JP.map((w, i) => (
          <div
            key={w}
            className="py-1 text-center text-xs font-bold"
            style={{ color: i === 0 ? THEME.danger : i === 6 ? THEME.primaryDark : THEME.textSecondary }}
          >
            {w}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex flex-col gap-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map((d, i) => {
              if (d === null) return <div key={i} className="h-[70px]" />;
              const isToday = compareYMD({ y: year, m: month, d }, today) === 0;
              const bg = cellBg?.(d);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onDayClick(d)}
                  className="flex h-[70px] flex-col items-center justify-center gap-1 rounded-2xl transition-colors hover:bg-primary-light"
                  style={{
                    backgroundColor: bg ?? "rgba(255,255,255,0.6)",
                    boxShadow: isToday ? `inset 0 0 0 1.6px ${THEME.primary}` : undefined,
                  }}
                >
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: i === 0 ? THEME.danger : i === 6 ? THEME.primaryDark : THEME.textPrimary }}
                  >
                    {d}
                  </span>
                  <span className="flex h-[18px] items-center justify-center">{renderCell(d)}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

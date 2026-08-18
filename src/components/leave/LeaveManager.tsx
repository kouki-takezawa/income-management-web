"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Pencil } from "lucide-react";
import { CalendarGrid } from "@/components/CalendarGrid";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { MonthNav } from "@/components/Nav";
import { withAlpha } from "@/lib/color";
import { THEME } from "@/lib/theme";
import { toISO } from "@/lib/business/dates";
import { LEAVE_TYPES, type LeaveType } from "@/lib/business/constants";
import { upsertLeaveUsage, deleteLeaveUsage } from "@/actions/leave";

export interface LeaveUsageRow {
  id: string;
  date: string;
  type: string;
  days: number;
  note: string | null;
}

const TYPE_COLOR: Record<string, string> = {
  full: THEME.primary,
  half_am: THEME.accent,
  half_pm: THEME.amber,
};

export function LeaveManager({
  year,
  month,
  usages,
}: {
  year: number;
  month: number;
  usages: LeaveUsageRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [type, setType] = useState<LeaveType>("full");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const usagesByDate = useMemo(() => {
    const map = new Map<string, LeaveUsageRow>();
    for (const u of usages) map.set(u.date, u);
    return map;
  }, [usages]);

  const existing = selectedDate ? usagesByDate.get(selectedDate) : undefined;

  function openDate(dateIso: string) {
    const u = usagesByDate.get(dateIso);
    setType((u?.type as LeaveType) ?? "full");
    setNote(u?.note ?? "");
    setError(null);
    setSelectedDate(dateIso);
  }

  function openDay(day: number) {
    openDate(toISO({ y: year, m: month, d: day }));
  }

  function save() {
    if (!selectedDate) return;
    setError(null);
    startTransition(async () => {
      const result = await upsertLeaveUsage({ date: selectedDate, type, note });
      if (!result.success) {
        setError(result.error ?? "保存に失敗しました");
        return;
      }
      setSelectedDate(null);
      router.refresh();
    });
  }

  function remove() {
    if (!selectedDate) return;
    startTransition(async () => {
      await deleteLeaveUsage(selectedDate);
      setSelectedDate(null);
      router.refresh();
    });
  }

  const usagesSorted = [...usages].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle icon={<CalendarDays size={16} />}>有給カレンダー</SectionTitle>
          <MonthNav year={year} month={month} basePath="/leave" param="month" />
        </div>
        <p className="mt-2.5 text-[11px] text-text-muted">日付をクリックすると取得記録の追加・編集ができます</p>
        <div className="mt-3">
          <CalendarGrid
            year={year}
            month={month}
            onDayClick={openDay}
            cellBg={(day) => {
              const iso = toISO({ y: year, m: month, d: day });
              const u = usagesByDate.get(iso);
              return u ? withAlpha(TYPE_COLOR[u.type] ?? THEME.primary, 0.3) : undefined;
            }}
            renderCell={(day) => {
              const iso = toISO({ y: year, m: month, d: day });
              const u = usagesByDate.get(iso);
              if (!u) return null;
              const label = LEAVE_TYPES[u.type as LeaveType]?.short ?? LEAVE_TYPES.full.short;
              return (
                <span
                  className="rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white"
                  style={{ backgroundColor: TYPE_COLOR[u.type] ?? THEME.primary }}
                >
                  {label}
                </span>
              );
            }}
          />
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<Pencil size={16} />}>取得履歴</SectionTitle>
        <div className="mt-3 flex max-h-[340px] flex-col gap-1.5 overflow-y-auto scrollbar-thin">
          {usagesSorted.length === 0 && <p className="px-2 py-6 text-sm text-text-muted">取得履歴はありません</p>}
          {usagesSorted.map((u) => {
            const typeInfo = LEAVE_TYPES[u.type as LeaveType] ?? LEAVE_TYPES.full;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => openDate(u.date)}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-bg"
              >
                <span className="w-[92px] shrink-0 text-sm text-text-secondary">{u.date}</span>
                <span
                  className="w-14 shrink-0 rounded-md px-2 py-1 text-center text-[11px] font-bold text-white"
                  style={{ backgroundColor: TYPE_COLOR[u.type] ?? THEME.primary }}
                >
                  {typeInfo.short}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{u.note || "-"}</span>
                <span className="shrink-0 text-sm font-semibold" style={{ color: THEME.accent }}>
                  {u.days}日
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {selectedDate && (
        <Modal title={existing ? "取得履歴を編集" : "有給取得を記録"} onClose={() => setSelectedDate(null)}>
          <div className="flex flex-col gap-4">
            <Field label="取得日">
              <TextInput type="date" value={selectedDate} readOnly disabled />
            </Field>
            <Field label="種別">
              <Select value={type} onChange={(e) => setType(e.target.value as LeaveType)}>
                {Object.entries(LEAVE_TYPES).map(([key, v]) => (
                  <option key={key} value={key}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="メモ">
              <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="任意" />
            </Field>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <div className="mt-1 flex items-center justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setSelectedDate(null)}>
                キャンセル
              </Button>
              {existing && (
                <Button variant="danger" type="button" onClick={remove} disabled={isPending}>
                  削除
                </Button>
              )}
              <Button type="button" onClick={save} disabled={isPending}>
                {isPending ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

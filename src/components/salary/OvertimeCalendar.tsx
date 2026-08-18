"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarGrid } from "@/components/CalendarGrid";
import { Modal } from "@/components/ui/Modal";
import { Field, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { withAlpha } from "@/lib/color";
import { THEME } from "@/lib/theme";
import { yen, trimNumber } from "@/lib/format";
import { toISO } from "@/lib/business/dates";
import { OVERTIME_CATEGORIES, OVERTIME_CATEGORY_LABELS, type OvertimeCategory } from "@/lib/business/constants";
import { entryPay, entryTotalHours, type SettingsLike, type OvertimeHours } from "@/lib/business/salary";
import { upsertOvertimeEntry, deleteOvertimeEntry } from "@/actions/salary";

export interface CalendarOvertimeEntry {
  date: string;
  hours: OvertimeHours;
  note: string | null;
}

const ZERO_HOURS: OvertimeHours = { weekday: 0, late_night: 0, holiday: 0, holiday_late_night: 0 };

export function OvertimeCalendar({
  year,
  month,
  entries,
  settings,
}: {
  year: number;
  month: number;
  entries: CalendarOvertimeEntry[];
  settings: SettingsLike;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [form, setForm] = useState<Record<OvertimeCategory, string>>({
    weekday: "",
    late_night: "",
    holiday: "",
    holiday_late_night: "",
  });
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarOvertimeEntry>();
    for (const e of entries) map.set(e.date, e);
    return map;
  }, [entries]);

  const selectedIso = selectedDay ? toISO({ y: year, m: month, d: selectedDay }) : null;
  const existing = selectedIso ? entriesByDate.get(selectedIso) : undefined;

  function openDay(day: number) {
    const iso = toISO({ y: year, m: month, d: day });
    const e = entriesByDate.get(iso);
    const h = e?.hours ?? ZERO_HOURS;
    setForm({
      weekday: h.weekday ? String(h.weekday) : "",
      late_night: h.late_night ? String(h.late_night) : "",
      holiday: h.holiday ? String(h.holiday) : "",
      holiday_late_night: h.holiday_late_night ? String(h.holiday_late_night) : "",
    });
    setNote(e?.note ?? "");
    setError(null);
    setSelectedDay(day);
  }

  const previewHours: OvertimeHours = {
    weekday: Number(form.weekday) || 0,
    late_night: Number(form.late_night) || 0,
    holiday: Number(form.holiday) || 0,
    holiday_late_night: Number(form.holiday_late_night) || 0,
  };
  const previewTotalHours = entryTotalHours({ date: selectedIso ?? "", hours: previewHours });
  const previewPay = entryPay(settings, { date: selectedIso ?? "", hours: previewHours });

  function save() {
    if (!selectedIso) return;
    setError(null);
    startTransition(async () => {
      const result = await upsertOvertimeEntry({ date: selectedIso, hours: previewHours, note });
      if (!result.success) {
        setError(result.error ?? "保存に失敗しました");
        return;
      }
      setSelectedDay(null);
      router.refresh();
    });
  }

  function remove() {
    if (!selectedIso) return;
    startTransition(async () => {
      await deleteOvertimeEntry(selectedIso);
      setSelectedDay(null);
      router.refresh();
    });
  }

  return (
    <>
      <CalendarGrid
        year={year}
        month={month}
        onDayClick={openDay}
        cellBg={(day) => {
          const iso = toISO({ y: year, m: month, d: day });
          const e = entriesByDate.get(iso);
          const total = e ? entryTotalHours(e) : 0;
          return total > 0 ? withAlpha(THEME.accent, 0.32) : undefined;
        }}
        renderCell={(day) => {
          const iso = toISO({ y: year, m: month, d: day });
          const e = entriesByDate.get(iso);
          const total = e ? entryTotalHours(e) : 0;
          return total > 0 ? <Pill color={THEME.accent}>{trimNumber(total)}h</Pill> : null;
        }}
      />

      {selectedDay !== null && selectedIso && (
        <Modal
          title={`${year}年${month}月${selectedDay}日 の残業`}
          onClose={() => setSelectedDay(null)}
          width={600}
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3.5">
              {OVERTIME_CATEGORIES.map((cat) => (
                <Field key={cat} label={`${OVERTIME_CATEGORY_LABELS[cat]}（時間）`}>
                  <TextInput
                    inputMode="decimal"
                    value={form[cat]}
                    onChange={(e) => setForm((f) => ({ ...f, [cat]: e.target.value }))}
                    placeholder="0"
                  />
                </Field>
              ))}
            </div>
            <Field label="メモ">
              <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="任意" />
            </Field>
            <div className="rounded-2xl bg-bg px-4 py-3 text-sm text-text-secondary">
              合計 {trimNumber(previewTotalHours)} 時間 ／ 残業代 {yen(previewPay)}
            </div>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <div className="mt-1 flex items-center justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setSelectedDay(null)}>
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

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { yen } from "@/lib/format";
import { upsertMonthlyRecord, deleteMonthlyRecord } from "@/actions/salary";

export function MonthRecordEditor({
  year,
  month,
  record,
  defaultBaseSalary,
  defaultAllowanceTotal,
}: {
  year: number;
  month: number;
  record: { baseSalaryOverride: number | null; allowancesOverride: number | null; note: string | null } | null;
  defaultBaseSalary: number;
  defaultAllowanceTotal: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [base, setBase] = useState(record?.baseSalaryOverride != null ? String(record.baseSalaryOverride) : "");
  const [allowance, setAllowance] = useState(
    record?.allowancesOverride != null ? String(record.allowancesOverride) : ""
  );
  const [note, setNote] = useState(record?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setBase(record?.baseSalaryOverride != null ? String(record.baseSalaryOverride) : "");
    setAllowance(record?.allowancesOverride != null ? String(record.allowancesOverride) : "");
    setNote(record?.note ?? "");
    setError(null);
    setOpen(true);
  }

  function save() {
    startTransition(async () => {
      const result = await upsertMonthlyRecord({
        year,
        month,
        baseSalaryOverride: base.trim() === "" ? null : Number(base),
        allowancesOverride: allowance.trim() === "" ? null : Number(allowance),
        note,
      });
      if (!result.success) {
        setError(result.error ?? "保存に失敗しました");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteMonthlyRecord(year, month);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="outline" type="button" icon={<Pencil size={15} />} onClick={openModal}>
        この月の基本給・手当
      </Button>

      {open && (
        <Modal title={`${year}年 ${month}月 の基本給・手当`} onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-4">
            <Field label="基本給（円）" hint={`未入力 = 設定値 ${yen(defaultBaseSalary)}`}>
              <TextInput inputMode="numeric" value={base} onChange={(e) => setBase(e.target.value)} />
            </Field>
            <Field label="諸手当合計（円）" hint={`未入力 = 設定合計 ${yen(defaultAllowanceTotal)}`}>
              <TextInput inputMode="numeric" value={allowance} onChange={(e) => setAllowance(e.target.value)} />
            </Field>
            <Field label="メモ">
              <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="任意" />
            </Field>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <div className="mt-1 flex items-center justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                キャンセル
              </Button>
              {record && (
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

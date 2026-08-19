"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useFeedback } from "@/lib/useFeedback";
import { addManualGrant } from "@/actions/leave";

const todayIso = () => new Date().toISOString().slice(0, 10);

export function ManualGrantButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [days, setDays] = useState("");
  const [note, setNote] = useState("特別付与");
  const [error, setError] = useState<string | null>(null);
  const [feedback, showFeedback] = useFeedback();

  function openModal() {
    setDate(todayIso());
    setDays("");
    setNote("特別付与");
    setError(null);
    setOpen(true);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await addManualGrant({ date, days: Number(days), note });
      if (!result.success) {
        setError(result.error ?? "保存に失敗しました");
        return;
      }
      setOpen(false);
      showFeedback("保存しました");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      {feedback && <span className="text-sm font-semibold text-success">{feedback}</span>}
      <Button variant="outline" type="button" icon={<SlidersHorizontal size={15} />} onClick={openModal}>
        付与を手動調整
      </Button>

      {open && (
        <Modal title="付与を手動調整" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-4">
            <Field label="日付">
              <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="日数（付与は+、取消・特別消化は-）">
              <TextInput inputMode="decimal" value={days} onChange={(e) => setDays(e.target.value)} placeholder="例: 1 または -1" />
            </Field>
            <Field label="内容メモ">
              <TextInput value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <div className="mt-1 flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                キャンセル
              </Button>
              <Button type="button" onClick={save} disabled={isPending}>
                {isPending ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

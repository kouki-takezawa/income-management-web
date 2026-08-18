"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, History, Gift, Landmark } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, TextInput } from "@/components/ui/Field";
import { yen } from "@/lib/format";
import { THEME } from "@/lib/theme";
import { upsertBonus, deleteBonus } from "@/actions/bonus";

export interface BonusRow {
  id: string;
  date: string;
  name: string;
  amount: number;
}

interface FormState {
  id?: string;
  date: string;
  name: string;
  amount: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export function BonusManager({
  bonuses,
  thisYearTotal,
  lifetimeTotal,
  thisYearLabel,
}: {
  bonuses: BonusRow[];
  thisYearTotal: number;
  lifetimeTotal: number;
  thisYearLabel: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openNew() {
    setForm({ date: todayIso(), name: "夏季賞与", amount: "" });
    setError(null);
  }

  function openEdit(b: BonusRow) {
    setForm({ id: b.id, date: b.date, name: b.name, amount: String(b.amount) });
    setError(null);
  }

  function save() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const result = await upsertBonus({
        id: form.id,
        date: form.date,
        name: form.name,
        amount: Number(form.amount) || 0,
      });
      if (!result.success) {
        setError(result.error ?? "保存に失敗しました");
        return;
      }
      setForm(null);
      router.refresh();
    });
  }

  function remove() {
    if (!form?.id) return;
    startTransition(async () => {
      await deleteBonus(form.id!);
      setForm(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">賞与</h1>
          <p className="mt-1 text-sm text-text-secondary">賞与・一時金の支給履歴を管理します</p>
        </div>
        <Button type="button" icon={<Plus size={16} />} onClick={openNew}>
          賞与を追加
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="今年の賞与合計" value={yen(thisYearTotal)} sub={thisYearLabel} color={THEME.pink} icon={<Gift size={18} />} />
        <StatCard
          label="累計賞与"
          value={yen(lifetimeTotal)}
          sub={`${bonuses.length}件`}
          color={THEME.primary}
          icon={<Landmark size={18} />}
        />
      </div>

      <Card className="mt-6">
        <SectionTitle icon={<History size={16} />}>支給履歴</SectionTitle>
        <div className="mt-3 flex flex-col gap-2">
          {bonuses.length === 0 && (
            <p className="px-2 py-6 text-sm text-text-muted">まだ賞与が登録されていません。「賞与を追加」から登録してください。</p>
          )}
          {bonuses.map((b) => (
            <div key={b.id} className="flex items-center gap-4 rounded-2xl bg-bg/60 px-4 py-3.5">
              <span className="w-24 shrink-0 text-sm text-text-secondary">{b.date}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{b.name}</span>
              <span className="shrink-0 text-sm font-bold" style={{ color: THEME.pink }}>
                {yen(b.amount)}
              </span>
              <button
                type="button"
                onClick={() => openEdit(b)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary-light"
                aria-label="編集"
              >
                <Pencil size={15} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {form && (
        <Modal title={form.id ? "賞与を編集" : "賞与を追加"} onClose={() => setForm(null)}>
          <div className="flex flex-col gap-4">
            <Field label="支給日（YYYY-MM-DD）">
              <TextInput
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
            <Field label="名称">
              <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="金額（円）">
              <TextInput
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <div className="mt-1 flex items-center justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setForm(null)}>
                キャンセル
              </Button>
              {form.id && (
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

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Field, TextInput } from "@/components/ui/Field";
import { AssetsTrendChart } from "@/components/charts/AssetsTrendChart";
import { yen } from "@/lib/format";
import { THEME } from "@/lib/theme";
import { useFeedback } from "@/lib/useFeedback";
import { todayISOString } from "@/lib/business/dates";
import {
  ASSET_TYPE_LABEL,
  accountValueTrend,
  latestSnapshot,
  type AssetAccountData,
  type AssetSnapshotData,
} from "@/lib/business/assets";
import { deleteAssetAccount, deleteAssetSnapshot, upsertAssetSnapshot } from "@/actions/assets";

interface SnapshotFormState {
  id?: string;
  date: string;
  value: string;
  note: string;
}

export function AccountDetail({
  account,
  snapshots,
}: {
  account: AssetAccountData;
  snapshots: AssetSnapshotData[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<SnapshotFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, showFeedback] = useFeedback();

  const history = useMemo(
    () => [...snapshots].sort((a, b) => b.date.localeCompare(a.date)),
    [snapshots]
  );
  const latest = latestSnapshot(snapshots, account.id);
  const trend = useMemo(
    () => accountValueTrend(snapshots, account.id).map((p) => ({ label: p.date, total: p.value })),
    [snapshots, account.id]
  );

  function openNew() {
    setError(null);
    setForm({ date: todayISOString(), value: "", note: "" });
  }

  function openEdit(s: AssetSnapshotData) {
    setError(null);
    setForm({ id: s.id, date: s.date, value: String(s.value), note: s.note ?? "" });
  }

  function save() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const result = await upsertAssetSnapshot({
        id: form.id,
        assetAccountId: account.id,
        date: form.date,
        value: Number(form.value) || 0,
        note: form.note,
      });
      if (!result.success) {
        setError(result.error ?? "保存に失敗しました");
        return;
      }
      setForm(null);
      showFeedback("保存しました");
      router.refresh();
    });
  }

  function removeSnapshot() {
    if (!form?.id) return;
    startTransition(async () => {
      await deleteAssetSnapshot(form.id!, account.id);
      setForm(null);
      showFeedback("削除しました");
      router.refresh();
    });
  }

  function removeAccount() {
    startTransition(async () => {
      await deleteAssetAccount(account.id);
      router.push("/assets");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/assets" className="flex w-fit items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary-dark">
        <ArrowLeft size={16} />
        資産管理へ戻る
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">{account.name}</h1>
          <p className="mt-1 text-sm text-text-secondary">{ASSET_TYPE_LABEL[account.type]}</p>
        </div>
        <div className="flex items-center gap-3">
          {feedback && <span className="text-sm font-semibold text-success">{feedback}</span>}
          <Button type="button" icon={<Plus size={16} />} onClick={openNew}>
            残高を記録
          </Button>
        </div>
      </div>

      <StatCard
        label="最新の残高・評価額"
        value={latest ? yen(latest.value) : "未記録"}
        sub={latest ? `最終更新 ${latest.date}` : null}
        color={THEME.primary}
      />

      {trend.length > 1 && (
        <Card style={{ minHeight: 280 }}>
          <SectionTitle icon={<TrendingUp size={16} />}>推移</SectionTitle>
          <div style={{ height: 220 }} className="mt-2">
            <AssetsTrendChart data={trend} gradientId="accountValueGradient" />
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>記録履歴</SectionTitle>
        <div className="mt-3 flex flex-col gap-2">
          {history.length === 0 && <p className="px-2 py-6 text-sm text-text-muted">まだ記録がありません。「残高を記録」から登録してください。</p>}
          {history.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-bg/60 px-4 py-3.5">
              <span className="w-24 shrink-0 text-sm text-text-secondary">{s.date}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{s.note}</span>
              <span className="shrink-0 text-sm font-bold text-text-primary">{yen(s.value)}</span>
              <button
                type="button"
                onClick={() => openEdit(s)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary-light"
                aria-label="編集"
              >
                <Pencil size={15} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border border-danger/30">
        <SectionTitle icon={<Trash2 size={16} />}>この口座を削除</SectionTitle>
        <p className="mt-2 text-xs text-text-muted">口座を削除すると、記録した残高履歴もすべて削除されます。元に戻せません。</p>
        <div className="mt-3">
          <ConfirmButton onConfirm={removeAccount} disabled={isPending} label="口座を削除" />
        </div>
      </Card>

      {form && (
        <Modal title={form.id ? "記録を編集" : "残高・評価額を記録"} onClose={() => setForm(null)}>
          <div className="flex flex-col gap-4">
            <Field label="日付">
              <TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="残高・評価額（円）">
              <TextInput inputMode="numeric" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0" />
            </Field>
            <Field label="メモ（任意）">
              <TextInput value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Field>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <div className="mt-1 flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setForm(null)}>
                キャンセル
              </Button>
              {form.id && <ConfirmButton onConfirm={removeSnapshot} disabled={isPending} />}
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

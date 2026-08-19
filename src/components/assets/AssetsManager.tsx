"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, ChevronRight, Landmark, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { IncomePieChart } from "@/components/charts/IncomePieChart";
import { AssetsTrendChart } from "@/components/charts/AssetsTrendChart";
import { yen } from "@/lib/format";
import { THEME } from "@/lib/theme";
import {
  ASSET_TYPE_COLOR,
  ASSET_TYPE_LABEL,
  assetAllocation,
  assetsTrend,
  currentTotalAssets,
  latestSnapshot,
  type AssetAccountData,
  type AssetSnapshotData,
} from "@/lib/business/assets";
import { upsertAssetAccount } from "@/actions/assets";

interface AccountFormState {
  id?: string;
  name: string;
  type: AssetAccountData["type"];
}

export function AssetsManager({
  accounts,
  snapshots,
}: {
  accounts: AssetAccountData[];
  snapshots: AssetSnapshotData[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<AccountFormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => currentTotalAssets(accounts, snapshots), [accounts, snapshots]);
  const allocation = useMemo(() => assetAllocation(accounts, snapshots), [accounts, snapshots]);
  const trend = useMemo(() => assetsTrend(accounts, snapshots), [accounts, snapshots]);

  function openNew() {
    setError(null);
    setForm({ name: "", type: "bank" });
  }

  function save() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const result = await upsertAssetAccount(form);
      if (!result.success) {
        setError(result.error ?? "保存に失敗しました");
        return;
      }
      setForm(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">資産管理</h1>
          <p className="mt-1 text-sm text-text-secondary">現金・預金・投資の残高をまとめて記録できます</p>
        </div>
        <Button type="button" icon={<Plus size={16} />} onClick={openNew}>
          口座を追加
        </Button>
      </div>

      <StatCard label="資産総額" value={yen(total)} sub="最新のスナップショット合計" color={THEME.primary} icon={<Landmark size={18} />} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5" style={{ minHeight: 320 }}>
          <SectionTitle icon={<PieChartIcon size={16} />}>資産配分</SectionTitle>
          <div className="mt-2 h-72 sm:h-60">
            {allocation.length > 0 ? (
              <IncomePieChart data={allocation} />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-text-muted">
                まだ残高が記録されていません
              </div>
            )}
          </div>
        </Card>
        <Card className="lg:col-span-7" style={{ minHeight: 320 }}>
          <SectionTitle icon={<TrendingUp size={16} />}>資産推移（直近6ヶ月）</SectionTitle>
          <div style={{ height: 250 }} className="mt-2">
            <AssetsTrendChart data={trend} gradientId="assetsTotalGradient" />
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle icon={<Landmark size={16} />}>資産口座一覧</SectionTitle>
        <div className="mt-3 flex flex-col gap-2">
          {accounts.length === 0 && (
            <p className="px-2 py-6 text-sm text-text-muted">まだ口座が登録されていません。「口座を追加」から登録してください。</p>
          )}
          {accounts.map((account) => {
            const snapshot = latestSnapshot(snapshots, account.id);
            return (
              <Link
                key={account.id}
                href={`/assets/${account.id}`}
                className="flex items-center gap-3 rounded-2xl bg-bg/60 px-4 py-3.5 hover:bg-primary-light/60"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-bold"
                  style={{ backgroundColor: `${ASSET_TYPE_COLOR[account.type]}33`, color: ASSET_TYPE_COLOR[account.type] }}
                >
                  {account.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{account.name}</p>
                  <p className="text-xs text-text-secondary">
                    {ASSET_TYPE_LABEL[account.type]}
                    {snapshot ? ` ・ 最終更新 ${snapshot.date}` : " ・ 未記録"}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-text-primary">
                  {snapshot ? yen(snapshot.value) : "―"}
                </span>
                <ChevronRight size={16} className="shrink-0 text-text-muted" />
              </Link>
            );
          })}
        </div>
      </Card>

      {form && (
        <Modal title="口座を追加" onClose={() => setForm(null)}>
          <div className="flex flex-col gap-4">
            <Field label="口座名">
              <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例：普通預金" />
            </Field>
            <Field label="種別">
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as AssetAccountData["type"] })}
              >
                {(Object.keys(ASSET_TYPE_LABEL) as AssetAccountData["type"][]).map((type) => (
                  <option key={type} value={type}>
                    {ASSET_TYPE_LABEL[type]}
                  </option>
                ))}
              </Select>
            </Field>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <div className="mt-1 flex items-center justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setForm(null)}>
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

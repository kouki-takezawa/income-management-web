"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, BadgeCheck, Palmtree, Percent, CreditCard, Calculator, Save } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PREFECTURES } from "@/lib/business/constants";
import { updateSettings, type AllowanceInput } from "@/actions/settings";
import type { SettingsData } from "@/lib/settings";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const m = i + 1;
  return { value: m, label: m === 1 ? "1月始まり（暦年）" : `${m}月始まり` };
});

let nextId = 0;
function newAllowanceId() {
  nextId += 1;
  return `new-${Date.now()}-${nextId}`;
}

export function SettingsForm({ settings }: { settings: SettingsData }) {
  const [isPending, startTransition] = useTransition();
  const [baseSalary, setBaseSalary] = useState(String(settings.baseSalary));
  const [standardMonthlyHours, setStandardMonthlyHours] = useState(String(settings.standardMonthlyHours));
  const [hireDate, setHireDate] = useState(settings.hireDate ?? "");
  const [annualLeaveDays, setAnnualLeaveDays] = useState(String(settings.annualLeaveDays));
  const [fiscalStartMonth, setFiscalStartMonth] = useState(settings.fiscalStartMonth);
  const [age, setAge] = useState(String(settings.age));
  const [prefecture, setPrefecture] = useState(settings.prefecture);
  const [showNetEstimate, setShowNetEstimate] = useState(settings.showNetEstimate);
  const [rates, setRates] = useState({
    weekday: String(settings.overtimeRates.weekday),
    late_night: String(settings.overtimeRates.late_night),
    holiday: String(settings.overtimeRates.holiday),
    holiday_late_night: String(settings.overtimeRates.holiday_late_night),
  });
  const [allowances, setAllowances] = useState<AllowanceInput[]>(settings.allowances);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function addAllowance() {
    setAllowances((prev) => [...prev, { id: newAllowanceId(), name: "新しい手当", amount: 0, includeInBase: false }]);
  }

  function removeAllowance(id: string) {
    setAllowances((prev) => prev.filter((a) => a.id !== id));
  }

  function updateAllowance(id: string, patch: Partial<AllowanceInput>) {
    setAllowances((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSettings({
        baseSalary: Number(baseSalary) || 0,
        standardMonthlyHours: Number(standardMonthlyHours) || 0,
        overtimeRates: {
          weekday: Number(rates.weekday) || 0,
          late_night: Number(rates.late_night) || 0,
          holiday: Number(rates.holiday) || 0,
          holiday_late_night: Number(rates.holiday_late_night) || 0,
        },
        hireDate: hireDate.trim() || null,
        annualLeaveDays: Number(annualLeaveDays) || 0,
        fiscalStartMonth,
        age: Number(age) || 0,
        prefecture,
        showNetEstimate,
        allowances,
      });
      if (!result.success) {
        setError(result.error ?? "保存に失敗しました");
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary">設定</h1>
        <p className="mt-1 text-sm text-text-secondary">給与・残業計算や有給付与の基準となる情報を登録します</p>
      </div>

      <Card>
        <SectionTitle icon={<BadgeCheck size={16} />}>基本情報</SectionTitle>
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="w-56">
            <Field label="基本給（月額・円）">
              <TextInput inputMode="numeric" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} />
            </Field>
          </div>
          <div className="w-56">
            <Field label="所定労働時間（月・時間）" hint="残業の時給単価計算に使用">
              <TextInput
                inputMode="numeric"
                value={standardMonthlyHours}
                onChange={(e) => setStandardMonthlyHours(e.target.value)}
              />
            </Field>
          </div>
          <div className="w-56">
            <Field label="年度の開始月">
              <Select value={fiscalStartMonth} onChange={(e) => setFiscalStartMonth(Number(e.target.value))}>
                {MONTH_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<Palmtree size={16} />}>有給休暇の設定</SectionTitle>
        <p className="mt-2 text-xs leading-relaxed text-text-muted">
          毎年の付与日数は自動計算せず、ここで設定した日数を使用します。入社日から6ヶ月後を初回付与日とし、以降12ヶ月ごとに同じ日数を自動で付与します。
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="w-56">
            <Field label="入社日" hint="初回付与日（入社6ヶ月後）の計算に使用">
              <TextInput type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
            </Field>
          </div>
          <div className="w-56">
            <Field label="年間付与日数" hint="毎年の付与日数（自動計算ではなく手動設定）">
              <TextInput
                inputMode="numeric"
                value={annualLeaveDays}
                onChange={(e) => setAnnualLeaveDays(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<Percent size={16} />}>残業割増率</SectionTitle>
        <p className="mt-2 text-xs text-text-muted">
          労働基準法の最低ライン：平日25%、深夜+25%、休日35%。就業規則に合わせて調整してください。
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="w-44">
            <Field label="平日残業 割増率（%）">
              <TextInput
                inputMode="numeric"
                value={rates.weekday}
                onChange={(e) => setRates((r) => ({ ...r, weekday: e.target.value }))}
              />
            </Field>
          </div>
          <div className="w-44">
            <Field label="深夜残業 割増率（%）">
              <TextInput
                inputMode="numeric"
                value={rates.late_night}
                onChange={(e) => setRates((r) => ({ ...r, late_night: e.target.value }))}
              />
            </Field>
          </div>
          <div className="w-44">
            <Field label="休日出勤 割増率（%）">
              <TextInput
                inputMode="numeric"
                value={rates.holiday}
                onChange={(e) => setRates((r) => ({ ...r, holiday: e.target.value }))}
              />
            </Field>
          </div>
          <div className="w-44">
            <Field label="休日深夜 割増率（%）">
              <TextInput
                inputMode="numeric"
                value={rates.holiday_late_night}
                onChange={(e) => setRates((r) => ({ ...r, holiday_late_night: e.target.value }))}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <SectionTitle icon={<CreditCard size={16} />}>諸手当</SectionTitle>
          <Button variant="outline" type="button" icon={<Plus size={15} />} onClick={addAllowance}>
            手当を追加
          </Button>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {allowances.length === 0 && <p className="text-sm text-text-muted">通勤手当・役職手当などを登録できます</p>}
          {allowances.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3.5">
              <div className="w-48">
                <TextInput
                  value={a.name}
                  onChange={(e) => updateAllowance(a.id, { name: e.target.value })}
                  placeholder="項目名"
                />
              </div>
              <div className="w-40">
                <TextInput
                  inputMode="numeric"
                  value={a.amount || ""}
                  onChange={(e) => updateAllowance(a.id, { amount: Number(e.target.value) || 0 })}
                  placeholder="月額（円）"
                />
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <input
                  type="checkbox"
                  checked={a.includeInBase}
                  onChange={(e) => updateAllowance(a.id, { includeInBase: e.target.checked })}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                割増計算に算入
              </label>
              <button
                type="button"
                onClick={() => removeAllowance(a.id)}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-danger hover:bg-danger/10"
                aria-label="削除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<Calculator size={16} />}>手取り概算の設定</SectionTitle>
        <p className="mt-2 text-xs leading-relaxed text-text-muted">
          年齢と都道府県から、社会保険料（健康保険・介護保険・厚生年金・雇用保険）と所得税・住民税の概算を計算します。（協会けんぽ
          令和7年度（2025年度）都道府県別保険料率を使用）
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="w-32">
            <Field label="年齢" hint="40歳以上は介護保険料が加算">
              <TextInput inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
            </Field>
          </div>
          <div className="w-56">
            <Field label="お住まいの都道府県">
              <Select value={prefecture} onChange={(e) => setPrefecture(e.target.value)}>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <label className="mb-3 flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={showNetEstimate}
              onChange={(e) => setShowNetEstimate(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            ダッシュボードに手取り概算を表示する
          </label>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        {saved && !error && <p className="text-sm font-medium text-success">設定を保存しました</p>}
        <Button type="button" icon={<Save size={16} />} onClick={save} disabled={isPending}>
          {isPending ? "保存中..." : "設定を保存"}
        </Button>
      </div>
    </div>
  );
}

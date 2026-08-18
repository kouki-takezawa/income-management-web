"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PiggyBank, Wallet, Palmtree, MapPin, ArrowRight, ArrowLeft } from "lucide-react";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PREFECTURES } from "@/lib/business/constants";
import { completeOnboardingAction, skipOnboardingAction } from "@/actions/onboarding";
import type { SettingsData } from "@/lib/settings";

const STEPS = [
  { title: "基本給・所定労働時間", icon: Wallet },
  { title: "入社日・年間付与日数", icon: Palmtree },
  { title: "都道府県・年齢", icon: MapPin },
] as const;

export function OnboardingWizard({ settings }: { settings: SettingsData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [baseSalary, setBaseSalary] = useState(String(settings.baseSalary));
  const [standardMonthlyHours, setStandardMonthlyHours] = useState(String(settings.standardMonthlyHours));
  const [hireDate, setHireDate] = useState(settings.hireDate ?? "");
  const [annualLeaveDays, setAnnualLeaveDays] = useState(String(settings.annualLeaveDays));
  const [prefecture, setPrefecture] = useState(settings.prefecture);
  const [age, setAge] = useState(String(settings.age));

  function finish() {
    setError(null);
    startTransition(async () => {
      const result = await completeOnboardingAction({
        baseSalary: Number(baseSalary) || 0,
        standardMonthlyHours: Number(standardMonthlyHours) || 0,
        hireDate: hireDate.trim() || null,
        annualLeaveDays: Number(annualLeaveDays) || 0,
        prefecture,
        age: Number(age) || 0,
      });
      if (!result.success) {
        setError(result.error ?? "保存に失敗しました");
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  function skip() {
    setError(null);
    startTransition(async () => {
      await skipOnboardingAction();
      router.push("/");
      router.refresh();
    });
  }

  const isLast = step === STEPS.length - 1;
  const StepIcon = STEPS[step].icon;

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary text-white shadow-soft">
          <PiggyBank size={28} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-text-primary">ようこそ！はじめに設定しましょう</h1>
          <p className="mt-1 text-sm text-text-secondary">3ステップだけ。あとから「設定」でいつでも変更できます</p>
        </div>
      </div>

      <div className="rounded-3xl bg-card p-7 shadow-soft">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary-dark">
              <StepIcon size={16} />
            </span>
            <span className="text-sm font-bold text-text-primary">
              STEP {step + 1} / {STEPS.length}：{STEPS[step].title}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-6 rounded-full"
                style={{ backgroundColor: i <= step ? "var(--color-primary)" : "var(--color-border)" }}
              />
            ))}
          </div>
        </div>

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <Field label="基本給（月額・円）" hint="毎月の基本給の額面です">
              <TextInput inputMode="numeric" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} />
            </Field>
            <Field label="所定労働時間（月・時間）" hint="残業の時給単価計算に使用します">
              <TextInput
                inputMode="numeric"
                value={standardMonthlyHours}
                onChange={(e) => setStandardMonthlyHours(e.target.value)}
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <Field label="入社日" hint="有給の初回付与日（入社6ヶ月後）の計算に使用します">
              <TextInput type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
            </Field>
            <Field label="年間付与日数" hint="毎年付与される有給日数（自動計算ではなく手動設定）">
              <TextInput
                inputMode="numeric"
                value={annualLeaveDays}
                onChange={(e) => setAnnualLeaveDays(e.target.value)}
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <Field label="お住まいの都道府県" hint="健康保険料率の計算に使用します">
              <Select value={prefecture} onChange={(e) => setPrefecture(e.target.value)}>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="年齢" hint="40歳以上は介護保険料が加算されます">
              <TextInput inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
            </Field>
          </div>
        )}

        {error && <p className="mt-4 text-sm font-medium text-danger">{error}</p>}

        <div className="mt-7 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={skip} disabled={isPending}>
            スキップ
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                icon={<ArrowLeft size={15} />}
                onClick={() => setStep((s) => s - 1)}
                disabled={isPending}
              >
                戻る
              </Button>
            )}
            {isLast ? (
              <Button type="button" onClick={finish} disabled={isPending}>
                {isPending ? "保存中..." : "はじめる"}
              </Button>
            ) : (
              <Button
                type="button"
                icon={<ArrowRight size={15} />}
                onClick={() => setStep((s) => s + 1)}
                disabled={isPending}
              >
                次へ
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

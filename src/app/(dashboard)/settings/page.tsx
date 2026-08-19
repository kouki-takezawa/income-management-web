import { ChevronDown } from "lucide-react";
import { requireUserId } from "@/lib/session";
import { getOrCreateSettings, getUserEmail } from "@/lib/data";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { AccountForm } from "@/components/settings/AccountForm";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const [settings, email] = await Promise.all([getOrCreateSettings(userId), getUserEmail(userId)]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary">設定</h1>
        <p className="mt-1 text-sm text-text-secondary">給与・残業計算や有給付与の基準となる情報を登録します</p>
      </div>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-3xl bg-card p-4 shadow-soft sm:p-6">
          <span className="text-sm font-bold text-text-primary">アカウント設定（メールアドレス・パスワードの変更）</span>
          <ChevronDown size={18} className="shrink-0 text-text-secondary transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-4">
          <AccountForm currentEmail={email} />
        </div>
      </details>

      <SettingsForm settings={settings} />
    </div>
  );
}

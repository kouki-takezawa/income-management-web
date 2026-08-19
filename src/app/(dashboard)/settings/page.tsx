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

      <AccountForm currentEmail={email} />
      <SettingsForm settings={settings} />
    </div>
  );
}

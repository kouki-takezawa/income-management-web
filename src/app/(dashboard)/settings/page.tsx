import { requireUserId } from "@/lib/session";
import { getOrCreateSettings } from "@/lib/data";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const settings = await getOrCreateSettings(userId);

  return <SettingsForm settings={settings} />;
}

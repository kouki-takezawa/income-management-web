import { requireUserId } from "@/lib/session";
import { getAssetAccounts, getAssetSnapshots } from "@/lib/data";
import { AssetsManager } from "@/components/assets/AssetsManager";

export default async function AssetsPage() {
  const userId = await requireUserId();

  const [accounts, snapshots] = await Promise.all([getAssetAccounts(userId), getAssetSnapshots(userId)]);

  return <AssetsManager accounts={accounts} snapshots={snapshots} />;
}

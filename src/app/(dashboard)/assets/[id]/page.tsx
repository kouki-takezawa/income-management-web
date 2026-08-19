import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { getAssetAccountById, getAssetSnapshotsForAccount } from "@/lib/data";
import { AccountDetail } from "@/components/assets/AccountDetail";

export default async function AssetAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;

  const account = await getAssetAccountById(userId, id);
  if (!account) notFound();

  const snapshots = await getAssetSnapshotsForAccount(id);

  return <AccountDetail account={account} snapshots={snapshots} />;
}

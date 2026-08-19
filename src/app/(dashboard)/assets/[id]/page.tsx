import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { getAssetAccountById, getAssetSnapshotsForAccount } from "@/lib/data";
import { AccountDetail } from "@/components/assets/AccountDetail";

export default async function AssetAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;

  // 口座の所有者チェックとスナップショット取得は互いに依存しないので並行実行する
  // （不正/存在しないIDの場合に無駄な1クエリが増える代わりに、正規のアクセスでは
  // 往復を1回減らせる — 個人利用アプリなので後者を優先する）。
  const [account, snapshots] = await Promise.all([
    getAssetAccountById(userId, id),
    getAssetSnapshotsForAccount(id),
  ]);
  if (!account) notFound();

  return <AccountDetail account={account} snapshots={snapshots} />;
}

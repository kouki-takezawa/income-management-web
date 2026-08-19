import { requireUserId } from "@/lib/session";
import { getAssetAccounts, getAssetSnapshots } from "@/lib/data";
import { buildAssetsCsv } from "@/lib/export/csv";

export const runtime = "nodejs";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return new Response("認証が必要です", { status: 401 });
  }

  const [accounts, snapshots] = await Promise.all([getAssetAccounts(userId), getAssetSnapshots(userId)]);
  const csv = buildAssetsCsv(accounts, snapshots);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        `attachment; filename="assets.csv"; ` + `filename*=UTF-8''${encodeURIComponent("資産管理.csv")}`,
      "Cache-Control": "no-store",
    },
  });
}

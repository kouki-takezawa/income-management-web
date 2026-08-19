import { requireUserId } from "@/lib/session";
import { getBudgetTransactions, getOrCreateBudgetCategories } from "@/lib/data";
import { buildBudgetCsv } from "@/lib/export/csv";

export const runtime = "nodejs";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return new Response("認証が必要です", { status: 401 });
  }

  const [categories, transactions] = await Promise.all([
    getOrCreateBudgetCategories(userId),
    getBudgetTransactions(userId),
  ]);
  const csv = buildBudgetCsv(transactions, categories);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        `attachment; filename="budget.csv"; ` + `filename*=UTF-8''${encodeURIComponent("家計簿.csv")}`,
      "Cache-Control": "no-store",
    },
  });
}

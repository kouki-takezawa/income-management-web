import { requireUserId } from "@/lib/session";
import {
  generateRecurringBudgetTransactions,
  getBudgetTransactions,
  getOrCreateBudgetCategories,
  getRecurringBudgetItems,
} from "@/lib/data";
import { parseYearMonthParam } from "@/lib/params";
import { todayYMD } from "@/lib/business/dates";
import { BudgetManager } from "@/components/budget/BudgetManager";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const today = todayYMD();

  // 定期支出の生成はカテゴリ・定期項目一覧の取得と並行して走らせ、明細一覧
  // （getBudgetTransactions）だけ生成完了を待つ（新規生成分を同じリクエストで
  // 反映するために必要な依存はこれだけなので、他の2つの取得はブロックしない）。
  const generation = generateRecurringBudgetTransactions(userId);
  const [categories, recurringItems] = await Promise.all([
    getOrCreateBudgetCategories(userId),
    getRecurringBudgetItems(userId),
  ]);
  await generation;
  const transactions = await getBudgetTransactions(userId);

  const { year, month } = parseYearMonthParam(params.month, today.y, today.m);

  return (
    <BudgetManager
      year={year}
      month={month}
      categories={categories}
      transactions={transactions}
      recurringItems={recurringItems}
    />
  );
}

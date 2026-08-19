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

  // 定期支出の未生成分を先に追いつかせてから明細を読む（同じリクエスト内で反映させるため）
  await generateRecurringBudgetTransactions(userId);

  const [categories, transactions, recurringItems] = await Promise.all([
    getOrCreateBudgetCategories(userId),
    getBudgetTransactions(userId),
    getRecurringBudgetItems(userId),
  ]);

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

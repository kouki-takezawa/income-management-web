import { requireUserId } from "@/lib/session";
import { getBudgetTransactions, getOrCreateBudgetCategories } from "@/lib/data";
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

  const [categories, transactions] = await Promise.all([
    getOrCreateBudgetCategories(userId),
    getBudgetTransactions(userId),
  ]);

  const { year, month } = parseYearMonthParam(params.month, today.y, today.m);

  return <BudgetManager year={year} month={month} categories={categories} transactions={transactions} />;
}

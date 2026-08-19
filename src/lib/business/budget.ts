// 家計簿（収支記録）の集計ロジック。DBアクセスを含まない純粋関数のみを置く。
import { addMonths, type YMD } from "@/lib/business/dates";

export interface BudgetCategoryData {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  monthlyLimit: number | null;
}

export interface BudgetTransactionData {
  id: string;
  date: string; // YYYY-MM-DD
  type: "income" | "expense";
  categoryId: string;
  amount: number;
  memo: string | null;
}

const FALLBACK_CATEGORY_COLOR = "#9C8B80";

export function findCategory(
  categories: BudgetCategoryData[],
  categoryId: string
): BudgetCategoryData | undefined {
  return categories.find((c) => c.id === categoryId);
}

export function categoryName(categories: BudgetCategoryData[], categoryId: string): string {
  return findCategory(categories, categoryId)?.name ?? "その他";
}

export function monthlySummary(transactions: BudgetTransactionData[], periodPrefix: string) {
  const inPeriod = transactions.filter((t) => t.date.startsWith(periodPrefix));
  const income = inPeriod.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = inPeriod.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}

export interface CategoryBreakdownItem {
  name: string;
  value: number;
  color: string;
}

// 期間内の支出をカテゴリ別に集計する（IncomePieChart にそのまま渡せる形）
export function categoryBreakdown(
  transactions: BudgetTransactionData[],
  categories: BudgetCategoryData[]
): CategoryBreakdownItem[] {
  // カテゴリIDではなく解決後の表示名でまとめる。削除済みカテゴリの取引は
  // すべて「その他」に落ちるため、実在する「その他」カテゴリの取引と
  // 同じ1行に集約されないと同名で複数行に分かれてしまう。
  // BudgetCategory には (userId, name, type) の一意制約があるため、同名で
  // 集約対象になり得るのは「削除済みカテゴリ（fallback）」と「実在する同名カテゴリ」の
  // 組み合わせのみ。実在カテゴリの色を常に優先し、fallback色で上書きされないようにする。
  const totals = new Map<string, CategoryBreakdownItem>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const category = findCategory(categories, t.categoryId);
    const name = category?.name ?? "その他";
    const existing = totals.get(name);
    if (existing) {
      existing.value += t.amount;
      if (category) existing.color = category.color;
    } else {
      totals.set(name, { name, value: t.amount, color: category?.color ?? FALLBACK_CATEGORY_COLOR });
    }
  }
  return [...totals.values()].sort((a, b) => b.value - a.value);
}

export interface PeriodFlow {
  label: string;
  income: number;
  expense: number;
}

// periods は "YYYY-MM" または "YYYY" の配列（表示したい順で渡す）
export function periodTrend(transactions: BudgetTransactionData[], periods: string[]): PeriodFlow[] {
  return periods.map((prefix) => {
    const { income, expense } = monthlySummary(transactions, prefix);
    return { label: prefix, income, expense };
  });
}

export interface CategoryBudgetStatus {
  categoryId: string;
  name: string;
  color: string;
  limit: number;
  spent: number;
  overBudget: boolean;
}

// 月間予算（monthlyLimit）が設定されている支出カテゴリだけを対象に、当期間の
// 使用状況を計算する。予算未設定のカテゴリは対象外（アラートを出しようがないため）。
export function categoryBudgetStatuses(
  transactions: BudgetTransactionData[],
  categories: BudgetCategoryData[]
): CategoryBudgetStatus[] {
  return categories
    .filter((c) => c.type === "expense" && c.monthlyLimit != null && c.monthlyLimit > 0)
    .map((c) => {
      const spent = transactions
        .filter((t) => t.type === "expense" && t.categoryId === c.id)
        .reduce((s, t) => s + t.amount, 0);
      const limit = c.monthlyLimit as number;
      return { categoryId: c.id, name: c.name, color: c.color, limit, spent, overBudget: spent > limit };
    })
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit);
}

export interface RecurringBudgetItemData {
  id: string;
  name: string;
  type: "income" | "expense";
  categoryId: string;
  amount: number;
  dayOfMonth: number;
  memo: string | null;
  active: boolean;
  lastGeneratedMonth: string | null;
}

function parseMonthStr(monthStr: string): YMD {
  const [y, m] = monthStr.split("-").map(Number);
  return { y, m, d: 1 };
}

// この定期項目について「今すぐ生成すべき YYYY-MM のリスト」を返す純粋関数。
// - 初回（lastGeneratedMonth が null）は当月から開始する（過去に遡って一括生成しない）
// - 当月分は、発生日（dayOfMonth）を過ぎているときだけ対象にする
// - 訪問間隔が空いていた場合（数ヶ月ぶりのアクセス等）は、未生成の月をまとめて返す
export function pendingRecurringMonths(
  item: Pick<RecurringBudgetItemData, "dayOfMonth" | "lastGeneratedMonth">,
  today: YMD
): string[] {
  let cursor: YMD = item.lastGeneratedMonth
    ? addMonths(parseMonthStr(item.lastGeneratedMonth), 1)
    : { y: today.y, m: today.m, d: 1 };

  const months: string[] = [];
  while (cursor.y < today.y || (cursor.y === today.y && cursor.m <= today.m)) {
    const isCurrentMonth = cursor.y === today.y && cursor.m === today.m;
    if (isCurrentMonth && today.d < item.dayOfMonth) break;
    months.push(`${cursor.y}-${String(cursor.m).padStart(2, "0")}`);
    if (isCurrentMonth) break;
    cursor = addMonths(cursor, 1);
  }
  return months;
}

export const DEFAULT_BUDGET_CATEGORIES: { name: string; type: "income" | "expense"; color: string }[] = [
  { name: "食費", type: "expense", color: "#F0A9A0" },
  { name: "住居費", type: "expense", color: "#D9847A" },
  { name: "光熱費", type: "expense", color: "#F6CD79" },
  { name: "通信費", type: "expense", color: "#8FCFBB" },
  { name: "交通費", type: "expense", color: "#C9AEE0" },
  { name: "日用品", type: "expense", color: "#93C77E" },
  { name: "娯楽", type: "expense", color: "#F0B15E" },
  { name: "医療", type: "expense", color: "#E38F86" },
  { name: "その他", type: "expense", color: FALLBACK_CATEGORY_COLOR },
  { name: "給与", type: "income", color: "#8FCFBB" },
  { name: "副収入", type: "income", color: "#C9AEE0" },
  { name: "その他", type: "income", color: FALLBACK_CATEGORY_COLOR },
];

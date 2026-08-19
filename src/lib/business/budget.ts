// 家計簿（収支記録）の集計ロジック。DBアクセスを含まない純粋関数のみを置く。

export interface BudgetCategoryData {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
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

export function monthOptions(transactions: BudgetTransactionData[], defaultMonth: string): string[] {
  const set = new Set(transactions.map((t) => t.date.slice(0, 7)));
  set.add(defaultMonth);
  return [...set].sort().reverse();
}

export function yearOptions(transactions: BudgetTransactionData[], defaultYear: string): string[] {
  const set = new Set(transactions.map((t) => t.date.slice(0, 4)));
  set.add(defaultYear);
  return [...set].sort().reverse();
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

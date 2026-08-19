"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Pencil,
  Receipt,
  PieChart as PieChartIcon,
  BarChart3,
  Tags,
  Trash2,
  Search,
  X,
  Check,
  Repeat,
  AlertTriangle,
  FileSpreadsheet,
  ChevronDown,
  CalendarRange,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { OverflowMenu, OverflowMenuItem } from "@/components/ui/OverflowMenu";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { MonthNav } from "@/components/Nav";
import { IncomePieChart } from "@/components/charts/IncomePieChart";
import { BudgetTrendChart } from "@/components/charts/BudgetTrendChart";
import { yen } from "@/lib/format";
import { THEME } from "@/lib/theme";
import { useFeedback } from "@/lib/useFeedback";
import { addMonths, toISO } from "@/lib/business/dates";
import {
  categoryBreakdown,
  categoryBudgetStatuses,
  categoryName,
  monthlySummary,
  periodTrend,
  type BudgetCategoryData,
  type BudgetTransactionData,
  type RecurringBudgetItemData,
} from "@/lib/business/budget";
import {
  deleteBudgetCategory,
  deleteBudgetTransaction,
  upsertBudgetCategory,
  upsertBudgetTransaction,
} from "@/actions/budget";
import { deleteRecurringBudgetItem, upsertRecurringBudgetItem } from "@/actions/recurring";

const CATEGORY_COLOR_SWATCHES = [
  THEME.primary,
  THEME.primaryDark,
  THEME.accent,
  THEME.amber,
  THEME.pink,
  THEME.success,
  THEME.warning,
  THEME.danger,
  THEME.textSecondary,
];

const todayIso = () => new Date().toISOString().slice(0, 10);

interface TxFormState {
  id?: string;
  date: string;
  type: "income" | "expense";
  categoryId: string;
  amount: string;
  memo: string;
}

interface CategoryFormState {
  id?: string;
  name: string;
  type: "income" | "expense";
  color: string;
  monthlyLimit: string;
}

interface RecurringFormState {
  id?: string;
  name: string;
  type: "income" | "expense";
  categoryId: string;
  amount: string;
  dayOfMonth: string;
  memo: string;
  active: boolean;
}

export function BudgetManager({
  year,
  month,
  categories,
  transactions,
  recurringItems,
}: {
  year: number;
  month: number;
  categories: BudgetCategoryData[];
  transactions: BudgetTransactionData[];
  recurringItems: RecurringBudgetItemData[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [txForm, setTxForm] = useState<TxFormState | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [feedback, showFeedback] = useFeedback();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [catForm, setCatForm] = useState<CategoryFormState | null>(null);
  const [catError, setCatError] = useState<string | null>(null);
  const [catFeedback, showCatFeedback] = useFeedback();
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [recurringForm, setRecurringForm] = useState<RecurringFormState | null>(null);
  const [recurringError, setRecurringError] = useState<string | null>(null);
  const [recurringFeedback, showRecurringFeedback] = useFeedback();
  const [confirmDeleteRecurringId, setConfirmDeleteRecurringId] = useState<string | null>(null);

  const periodPrefix = `${year}-${String(month).padStart(2, "0")}`;

  const periodTx = useMemo(
    () => transactions.filter((t) => t.date.startsWith(periodPrefix)),
    [transactions, periodPrefix]
  );

  const isSearching = searchQuery.trim().length > 0;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return transactions
      .filter((t) => {
        const name = categoryName(categories, t.categoryId).toLowerCase();
        const memo = (t.memo ?? "").toLowerCase();
        return name.includes(q) || memo.includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, categories, searchQuery]);

  const visibleTx = isSearching ? searchResults : periodTx;

  const summary = useMemo(() => monthlySummary(transactions, periodPrefix), [transactions, periodPrefix]);
  const prevSummary = useMemo(() => {
    const prevMonth = addMonths({ y: year, m: month, d: 1 }, -1);
    const prevPrefix = toISO(prevMonth).slice(0, 7);
    return monthlySummary(transactions, prevPrefix);
  }, [transactions, year, month]);
  const deltaPercent = (current: number, prev: number): number | null => (prev > 0 ? ((current - prev) / prev) * 100 : null);
  const breakdown = useMemo(() => categoryBreakdown(periodTx, categories), [periodTx, categories]);
  const budgetStatuses = useMemo(() => categoryBudgetStatuses(periodTx, categories), [periodTx, categories]);
  const overBudgetStatuses = budgetStatuses.filter((s) => s.overBudget);

  const trendData = useMemo(() => {
    const base = { y: year, m: month, d: 1 };
    const months = Array.from({ length: 12 }, (_, i) => addMonths(base, i - 11));
    const prefixes = months.map((m) => toISO(m).slice(0, 7));
    const flows = periodTrend(transactions, prefixes);
    return flows.map((f, i) => ({ label: `${months[i].m}月`, income: f.income, expense: f.expense }));
  }, [transactions, year, month]);

  const yearTx = useMemo(() => transactions.filter((t) => t.date.startsWith(String(year))), [transactions, year]);
  const annualSummary = useMemo(() => monthlySummary(transactions, String(year)), [transactions, year]);
  const annualBreakdown = useMemo(() => categoryBreakdown(yearTx, categories), [yearTx, categories]);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  function openNewTx() {
    setTxError(null);
    setTxForm({
      date: todayIso(),
      type: "expense",
      categoryId: expenseCategories[0]?.id ?? "",
      amount: "",
      memo: "",
    });
  }

  // どの画面からでも押せるクイック追加FAB（/budget?new=1）から来た場合、記録フォームを
  // 自動で開く。開いたら URL のクエリだけ削除しておく（再読み込みのたびに開かないように）。
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    openNewTx();
    const params = new URLSearchParams(searchParams);
    params.delete("new");
    const query = params.toString();
    router.replace(query ? `/budget?${query}` : "/budget", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function openEditTx(t: BudgetTransactionData) {
    setTxError(null);
    setTxForm({
      id: t.id,
      date: t.date,
      type: t.type,
      categoryId: t.categoryId,
      amount: String(t.amount),
      memo: t.memo ?? "",
    });
  }

  function switchTxType(type: "income" | "expense") {
    if (!txForm) return;
    const pool = type === "expense" ? expenseCategories : incomeCategories;
    setTxForm({ ...txForm, type, categoryId: pool[0]?.id ?? "" });
  }

  function saveTx() {
    if (!txForm) return;
    setTxError(null);
    startTransition(async () => {
      const result = await upsertBudgetTransaction({
        id: txForm.id,
        date: txForm.date,
        type: txForm.type,
        categoryId: txForm.categoryId,
        amount: Number(txForm.amount) || 0,
        memo: txForm.memo,
      });
      if (!result.success) {
        setTxError(result.error ?? "保存に失敗しました");
        return;
      }
      setTxForm(null);
      showFeedback("保存しました");
      router.refresh();
    });
  }

  function removeTx() {
    if (!txForm?.id) return;
    startTransition(async () => {
      await deleteBudgetTransaction(txForm.id!);
      setTxForm(null);
      showFeedback("削除しました");
      router.refresh();
    });
  }

  function openNewCategory(type: "income" | "expense") {
    setCatError(null);
    setCatForm({ name: "", type, color: CATEGORY_COLOR_SWATCHES[0], monthlyLimit: "" });
  }

  function openEditCategory(c: BudgetCategoryData) {
    setCatError(null);
    setCatForm({
      id: c.id,
      name: c.name,
      type: c.type,
      color: c.color,
      monthlyLimit: c.monthlyLimit != null ? String(c.monthlyLimit) : "",
    });
  }

  function saveCategory() {
    if (!catForm) return;
    setCatError(null);
    startTransition(async () => {
      const result = await upsertBudgetCategory({
        id: catForm.id,
        name: catForm.name,
        type: catForm.type,
        color: catForm.color,
        monthlyLimit: catForm.monthlyLimit.trim() === "" ? null : Number(catForm.monthlyLimit),
      });
      if (!result.success) {
        setCatError(result.error ?? "保存に失敗しました");
        return;
      }
      setCatForm(null);
      showCatFeedback("保存しました");
      router.refresh();
    });
  }

  function removeCategory(id: string) {
    startTransition(async () => {
      await deleteBudgetCategory(id);
      setConfirmDeleteCategoryId(null);
      showCatFeedback("削除しました");
      router.refresh();
    });
  }

  function openNewRecurring() {
    setRecurringError(null);
    setRecurringForm({
      type: "expense",
      name: "",
      categoryId: expenseCategories[0]?.id ?? "",
      amount: "",
      dayOfMonth: "1",
      memo: "",
      active: true,
    });
  }

  function openEditRecurring(r: RecurringBudgetItemData) {
    setRecurringError(null);
    setRecurringForm({
      id: r.id,
      name: r.name,
      type: r.type,
      categoryId: r.categoryId,
      amount: String(r.amount),
      dayOfMonth: String(r.dayOfMonth),
      memo: r.memo ?? "",
      active: r.active,
    });
  }

  function switchRecurringType(type: "income" | "expense") {
    if (!recurringForm) return;
    const pool = type === "expense" ? expenseCategories : incomeCategories;
    setRecurringForm({ ...recurringForm, type, categoryId: pool[0]?.id ?? "" });
  }

  function saveRecurring() {
    if (!recurringForm) return;
    setRecurringError(null);
    startTransition(async () => {
      const result = await upsertRecurringBudgetItem({
        id: recurringForm.id,
        name: recurringForm.name,
        type: recurringForm.type,
        categoryId: recurringForm.categoryId,
        amount: Number(recurringForm.amount) || 0,
        dayOfMonth: Number(recurringForm.dayOfMonth) || 0,
        memo: recurringForm.memo,
        active: recurringForm.active,
      });
      if (!result.success) {
        setRecurringError(result.error ?? "保存に失敗しました");
        return;
      }
      setRecurringForm(null);
      showRecurringFeedback("保存しました");
      router.refresh();
    });
  }

  function removeRecurring(id: string) {
    startTransition(async () => {
      await deleteRecurringBudgetItem(id);
      setConfirmDeleteRecurringId(null);
      showRecurringFeedback("削除しました");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">家計簿</h1>
          <p className="mt-1 text-sm text-text-secondary">収入・支出を記録して月ごとの収支を確認できます</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {feedback && <span className="text-sm font-semibold text-success">{feedback}</span>}
          <MonthNav year={year} month={month} basePath="/budget" param="month" />
          <OverflowMenu>
            <OverflowMenuItem icon={<Repeat size={15} />} onClick={() => setRecurringModalOpen(true)}>
              定期支出
            </OverflowMenuItem>
            <OverflowMenuItem icon={<Tags size={15} />} onClick={() => setCategoryModalOpen(true)}>
              カテゴリ管理
            </OverflowMenuItem>
            <OverflowMenuItem icon={<FileSpreadsheet size={15} />} href="/api/export/budget-csv">
              CSVダウンロード
            </OverflowMenuItem>
          </OverflowMenu>
          <Button type="button" icon={<Plus size={16} />} onClick={openNewTx}>
            記録を追加
          </Button>
        </div>
      </div>

      {overBudgetStatuses.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-danger/12 px-5 py-3.5">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
          <p className="text-sm font-semibold text-danger">
            {overBudgetStatuses.map((s) => s.name).join("・")}が今月の予算を超えています
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="今月の収入"
          value={yen(summary.income)}
          deltaPercent={deltaPercent(summary.income, prevSummary.income)}
          color={THEME.success}
        />
        <StatCard
          label="今月の支出"
          value={yen(summary.expense)}
          deltaPercent={deltaPercent(summary.expense, prevSummary.expense)}
          deltaGoodDirection="down"
          color={THEME.danger}
        />
        <StatCard
          label="差引"
          value={yen(summary.balance)}
          deltaPercent={deltaPercent(summary.balance, prevSummary.balance)}
          color={THEME.primary}
        />
      </div>

      {budgetStatuses.length > 0 && (
        <Card>
          <SectionTitle icon={<AlertTriangle size={16} />}>予算の使用状況</SectionTitle>
          <div className="mt-3 flex flex-col gap-3">
            {budgetStatuses.map((s) => {
              const percent = Math.min(100, Math.round((s.spent / s.limit) * 100));
              return (
                <div key={s.categoryId}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-text-primary">{s.name}</span>
                    <span className={`font-bold ${s.overBudget ? "text-danger" : "text-text-secondary"}`}>
                      {yen(s.spent)} / {yen(s.limit)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${percent}%`, backgroundColor: s.overBudget ? THEME.danger : s.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card style={{ minHeight: 320 }}>
        <SectionTitle icon={<PieChartIcon size={16} />}>カテゴリ別支出</SectionTitle>
        <div className="mt-2 h-72 sm:h-60">
          {breakdown.length > 0 ? (
            <IncomePieChart data={breakdown} />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-text-muted">
              この月の支出はまだ記録されていません
            </div>
          )}
        </div>
      </Card>
      <Card>
        <SectionTitle icon={<BarChart3 size={16} />}>収支の推移（直近12ヶ月）</SectionTitle>
        <div style={{ height: 280 }} className="mt-2">
          <BudgetTrendChart data={trendData} />
        </div>
      </Card>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-3xl bg-card p-4 shadow-soft sm:p-6">
          <span className="flex items-center gap-2 text-sm font-bold text-text-primary">
            <CalendarRange size={16} />
            {year}年の年間サマリーを見る
          </span>
          <ChevronDown size={18} className="shrink-0 text-text-secondary transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="年間収入" value={yen(annualSummary.income)} color={THEME.success} />
            <StatCard label="年間支出" value={yen(annualSummary.expense)} color={THEME.danger} />
            <StatCard label="年間差引" value={yen(annualSummary.balance)} color={THEME.primary} />
          </div>
          <Card style={{ minHeight: 320 }}>
            <SectionTitle icon={<PieChartIcon size={16} />}>カテゴリ別支出（{year}年）</SectionTitle>
            <div className="mt-2 h-72 sm:h-60">
              {annualBreakdown.length > 0 ? (
                <IncomePieChart data={annualBreakdown} />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-text-muted">
                  この年の支出はまだ記録されていません
                </div>
              )}
            </div>
          </Card>
        </div>
      </details>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle icon={<Receipt size={16} />}>{isSearching ? "検索結果（全期間）" : "明細一覧"}</SectionTitle>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="カテゴリ・メモで検索"
              className="w-full rounded-full border border-border bg-bg/60 py-2 pl-9 pr-8 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:bg-white placeholder:text-text-muted"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="検索をクリア"
                className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-text-muted hover:text-text-secondary"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {visibleTx.length === 0 && (
            <p className="px-2 py-6 text-sm text-text-muted">
              {isSearching ? "該当する記録が見つかりません" : "この月の記録はまだありません。「記録を追加」から登録してください。"}
            </p>
          )}
          {visibleTx.map((t) => {
            const category = categories.find((c) => c.id === t.categoryId);
            return (
              <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-bg/60 px-4 py-3.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: category?.color ?? THEME.textMuted }}
                />
                <span className={`shrink-0 text-sm text-text-secondary ${isSearching ? "w-24" : "w-20"}`}>
                  {isSearching ? t.date : t.date.slice(5)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">
                  {categoryName(categories, t.categoryId)}
                  {t.memo ? ` ・ ${t.memo}` : ""}
                </span>
                <span
                  className="shrink-0 text-sm font-bold"
                  style={{ color: t.type === "income" ? THEME.success : THEME.danger }}
                >
                  {t.type === "income" ? "+" : "-"}
                  {yen(t.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => openEditTx(t)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary-light"
                  aria-label="編集"
                >
                  <Pencil size={15} />
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {txForm && (
        <Modal title={txForm.id ? "記録を編集" : "収支を記録"} onClose={() => setTxForm(null)}>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={txForm.type === "expense" ? "primary" : "outline"}
                className="flex-1"
                onClick={() => switchTxType("expense")}
              >
                支出
              </Button>
              <Button
                type="button"
                variant={txForm.type === "income" ? "primary" : "outline"}
                className="flex-1"
                onClick={() => switchTxType("income")}
              >
                収入
              </Button>
            </div>
            <Field label="日付">
              <TextInput type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} />
            </Field>
            <Field label="金額（円）">
              <TextInput
                inputMode="numeric"
                value={txForm.amount}
                onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                placeholder="0"
              />
            </Field>
            <Field label="カテゴリ">
              <Select
                value={txForm.categoryId}
                onChange={(e) => setTxForm({ ...txForm, categoryId: e.target.value })}
              >
                {(txForm.type === "expense" ? expenseCategories : incomeCategories).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="メモ（任意）">
              <TextInput value={txForm.memo} onChange={(e) => setTxForm({ ...txForm, memo: e.target.value })} />
            </Field>
            {txError && <p className="text-sm font-medium text-danger">{txError}</p>}
            <div className="mt-1 flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setTxForm(null)}>
                キャンセル
              </Button>
              {txForm.id && <ConfirmButton onConfirm={removeTx} disabled={isPending} />}
              <Button type="button" onClick={saveTx} disabled={isPending}>
                {isPending ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {categoryModalOpen && (
        <Modal
          title="カテゴリ管理"
          onClose={() => {
            setCategoryModalOpen(false);
            setCatForm(null);
            setConfirmDeleteCategoryId(null);
          }}
          width={440}
        >
          <div className="flex flex-col gap-5">
            {catFeedback && <p className="-mt-2 text-sm font-semibold text-success">{catFeedback}</p>}
            {(["expense", "income"] as const).map((type) => (
              <div key={type}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary">{type === "expense" ? "支出カテゴリ" : "収入カテゴリ"}</span>
                  <button
                    type="button"
                    onClick={() => openNewCategory(type)}
                    className="flex items-center gap-1 text-xs font-semibold text-primary-dark hover:underline"
                  >
                    <Plus size={13} /> 追加
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {(type === "expense" ? expenseCategories : incomeCategories).map((c) => (
                    <div key={c.id} className="flex items-center gap-2.5 rounded-xl bg-bg/60 px-3 py-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-text-primary">{c.name}</p>
                        {c.monthlyLimit != null && (
                          <p className="truncate text-xs text-text-muted">予算 {yen(c.monthlyLimit)}</p>
                        )}
                      </div>
                      {confirmDeleteCategoryId === c.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCategoryId(null)}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-primary-light"
                            aria-label="キャンセル"
                          >
                            <X size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCategory(c.id)}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger text-white"
                            aria-label="本当に削除する"
                            disabled={isPending}
                          >
                            <Check size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditCategory(c)}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-primary-light"
                            aria-label="編集"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCategoryId(c.id)}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-danger hover:bg-danger/10"
                            aria-label="削除"
                            disabled={isPending}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {catForm && (
              <div className="flex flex-col gap-3 rounded-2xl border border-border p-3.5">
                <Field label="カテゴリ名">
                  <TextInput value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
                </Field>
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-text-secondary">色</span>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_COLOR_SWATCHES.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCatForm({ ...catForm, color })}
                        className="h-7 w-7 rounded-full transition-transform"
                        style={{
                          backgroundColor: color,
                          outline: catForm.color === color ? `2px solid ${THEME.textPrimary}` : "none",
                          outlineOffset: 2,
                        }}
                        aria-label={color}
                      />
                    ))}
                  </div>
                </div>
                {catForm.type === "expense" && (
                  <Field label="月間予算（円・任意）" hint="設定すると使いすぎ時に家計簿画面で警告します">
                    <TextInput
                      inputMode="numeric"
                      value={catForm.monthlyLimit}
                      onChange={(e) => setCatForm({ ...catForm, monthlyLimit: e.target.value })}
                      placeholder="未設定"
                    />
                  </Field>
                )}
                {catError && <p className="text-sm font-medium text-danger">{catError}</p>}
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button variant="ghost" type="button" onClick={() => setCatForm(null)}>
                    キャンセル
                  </Button>
                  <Button type="button" onClick={saveCategory} disabled={isPending}>
                    {isPending ? "保存中..." : "保存"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {recurringModalOpen && (
        <Modal
          title="定期支出"
          onClose={() => {
            setRecurringModalOpen(false);
            setRecurringForm(null);
            setConfirmDeleteRecurringId(null);
          }}
          width={480}
        >
          <div className="flex flex-col gap-4">
            <p className="-mt-1 text-xs leading-relaxed text-text-muted">
              家賃・サブスクなど毎月決まって発生する収支を登録すると、発生日を過ぎたタイミングで自動的に家計簿へ記録されます。
            </p>
            {recurringFeedback && <p className="text-sm font-semibold text-success">{recurringFeedback}</p>}

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary">登録済みの項目</span>
              <button
                type="button"
                onClick={openNewRecurring}
                className="flex items-center gap-1 text-xs font-semibold text-primary-dark hover:underline"
              >
                <Plus size={13} /> 追加
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {recurringItems.length === 0 && (
                <p className="px-1 py-4 text-sm text-text-muted">まだ登録されていません。「追加」から登録してください。</p>
              )}
              {recurringItems.map((r) => (
                <div key={r.id} className="flex items-center gap-2.5 rounded-xl bg-bg/60 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm ${r.active ? "text-text-primary" : "text-text-muted line-through"}`}>
                      {r.name}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      毎月{r.dayOfMonth}日 ・ {r.type === "income" ? "+" : "-"}
                      {yen(r.amount)}
                      {!r.active && " ・ 停止中"}
                    </p>
                  </div>
                  {confirmDeleteRecurringId === r.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteRecurringId(null)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-primary-light"
                        aria-label="キャンセル"
                      >
                        <X size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRecurring(r.id)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger text-white"
                        aria-label="本当に削除する"
                        disabled={isPending}
                      >
                        <Check size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditRecurring(r)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-primary-light"
                        aria-label="編集"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteRecurringId(r.id)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-danger hover:bg-danger/10"
                        aria-label="削除"
                        disabled={isPending}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {recurringForm && (
              <div className="flex flex-col gap-3 rounded-2xl border border-border p-3.5">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={recurringForm.type === "expense" ? "primary" : "outline"}
                    className="flex-1"
                    onClick={() => switchRecurringType("expense")}
                  >
                    支出
                  </Button>
                  <Button
                    type="button"
                    variant={recurringForm.type === "income" ? "primary" : "outline"}
                    className="flex-1"
                    onClick={() => switchRecurringType("income")}
                  >
                    収入
                  </Button>
                </div>
                <Field label="名称">
                  <TextInput
                    value={recurringForm.name}
                    onChange={(e) => setRecurringForm({ ...recurringForm, name: e.target.value })}
                    placeholder="例：家賃"
                  />
                </Field>
                <Field label="カテゴリ">
                  <Select
                    value={recurringForm.categoryId}
                    onChange={(e) => setRecurringForm({ ...recurringForm, categoryId: e.target.value })}
                  >
                    {(recurringForm.type === "expense" ? expenseCategories : incomeCategories).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Field label="金額（円）">
                      <TextInput
                        inputMode="numeric"
                        value={recurringForm.amount}
                        onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })}
                        placeholder="0"
                      />
                    </Field>
                  </div>
                  <div className="w-28">
                    <Field label="発生日" hint="1〜28">
                      <TextInput
                        inputMode="numeric"
                        value={recurringForm.dayOfMonth}
                        onChange={(e) => setRecurringForm({ ...recurringForm, dayOfMonth: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
                <Field label="メモ（任意）">
                  <TextInput
                    value={recurringForm.memo}
                    onChange={(e) => setRecurringForm({ ...recurringForm, memo: e.target.value })}
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={recurringForm.active}
                    onChange={(e) => setRecurringForm({ ...recurringForm, active: e.target.checked })}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  有効にする
                </label>
                {recurringError && <p className="text-sm font-medium text-danger">{recurringError}</p>}
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button variant="ghost" type="button" onClick={() => setRecurringForm(null)}>
                    キャンセル
                  </Button>
                  <Button type="button" onClick={saveRecurring} disabled={isPending}>
                    {isPending ? "保存中..." : "保存"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

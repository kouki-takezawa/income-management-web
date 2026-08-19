"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Receipt, PieChart as PieChartIcon, BarChart3, Tags, Trash2, Search, X, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
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
  categoryName,
  monthlySummary,
  periodTrend,
  type BudgetCategoryData,
  type BudgetTransactionData,
} from "@/lib/business/budget";
import {
  deleteBudgetCategory,
  deleteBudgetTransaction,
  upsertBudgetCategory,
  upsertBudgetTransaction,
} from "@/actions/budget";

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
}

export function BudgetManager({
  year,
  month,
  categories,
  transactions,
}: {
  year: number;
  month: number;
  categories: BudgetCategoryData[];
  transactions: BudgetTransactionData[];
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
  const breakdown = useMemo(() => categoryBreakdown(periodTx, categories), [periodTx, categories]);

  const trendData = useMemo(() => {
    const base = { y: year, m: month, d: 1 };
    const months = Array.from({ length: 6 }, (_, i) => addMonths(base, i - 5));
    const prefixes = months.map((m) => toISO(m).slice(0, 7));
    const flows = periodTrend(transactions, prefixes);
    return flows.map((f, i) => ({ label: `${months[i].m}月`, income: f.income, expense: f.expense }));
  }, [transactions, year, month]);

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
    setCatForm({ name: "", type, color: CATEGORY_COLOR_SWATCHES[0] });
  }

  function openEditCategory(c: BudgetCategoryData) {
    setCatError(null);
    setCatForm({ id: c.id, name: c.name, type: c.type, color: c.color });
  }

  function saveCategory() {
    if (!catForm) return;
    setCatError(null);
    startTransition(async () => {
      const result = await upsertBudgetCategory(catForm);
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
          <Button type="button" variant="outline" icon={<Tags size={15} />} onClick={() => setCategoryModalOpen(true)}>
            カテゴリ管理
          </Button>
          <Button type="button" icon={<Plus size={16} />} onClick={openNewTx}>
            記録を追加
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="今月の収入" value={yen(summary.income)} color={THEME.success} />
        <StatCard label="今月の支出" value={yen(summary.expense)} color={THEME.danger} />
        <StatCard label="差引" value={yen(summary.balance)} color={THEME.primary} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7" style={{ minHeight: 320 }}>
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
        <Card className="lg:col-span-5" style={{ minHeight: 320 }}>
          <SectionTitle icon={<BarChart3 size={16} />}>収支の推移（直近6ヶ月）</SectionTitle>
          <div style={{ height: 250 }} className="mt-2">
            <BudgetTrendChart data={trendData} />
          </div>
        </Card>
      </div>

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
            <div className="mt-1 flex items-center justify-end gap-2">
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
                      <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{c.name}</span>
                      {confirmDeleteCategoryId === c.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCategoryId(null)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-primary-light"
                            aria-label="キャンセル"
                          >
                            <X size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCategory(c.id)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger text-white"
                            aria-label="本当に削除する"
                            disabled={isPending}
                          >
                            <Check size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditCategory(c)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-primary-light"
                            aria-label="編集"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCategoryId(c.id)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-danger hover:bg-danger/10"
                            aria-label="削除"
                            disabled={isPending}
                          >
                            <Trash2 size={13} />
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
                {catError && <p className="text-sm font-medium text-danger">{catError}</p>}
                <div className="flex items-center justify-end gap-2">
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
    </div>
  );
}

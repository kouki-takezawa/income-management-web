import "server-only";
import path from "node:path";
import { Document, Page, View, Text, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";
import type { AnnualSummary } from "@/lib/business/salary";
import { MONTH_NAMES_JP } from "@/lib/business/constants";
import { THEME, CATEGORY_COLORS } from "@/lib/theme";
import { bonusByMonthMap, type ExportBonusLike } from "./shared";

// @react-pdf/renderer はブラウザ用フォント（Helvetica 等）しか内蔵していないため、
// 日本語ラベルを描画するには CJK 対応フォントを明示的に登録する必要がある。
// @fontsource/noto-sans-jp が同梱する woff ファイル（Node 実行時に fs 経由で読む）
// を使う（woff2 ではなく woff v1 を選択: fontkit の woff2/brotli 展開より確実に
// 動作するため）。
//
// パスは require.resolve() ではなく path.join(process.cwd(), ...) の実行時文字列
// 結合で組み立てる。require.resolve() だとビルド時に Turbopack がこのバイナリ
// ファイルをモジュールとして解決しようとして "Unknown module type" エラーになる
// ため（react-pdf は内部で fs 経由で読むだけで import/require はしないので、
// これで問題なく動く）。Vercel のサーバーレス関数バンドルに実ファイルが含まれる
// ように next.config.ts の outputFileTracingIncludes で明示的に含めている。
let fontRegistered = false;
function ensureFont() {
  if (fontRegistered) return;
  const fontPath = path.join(
    process.cwd(),
    "node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff"
  );
  Font.register({ family: "NotoSansJP", src: fontPath });
  // 英語用のハイフネーション処理を無効化（日本語には不要で、変な位置で文字が
  // 分割されるのを防ぐ）
  Font.registerHyphenationCallback((word) => [word]);
  fontRegistered = true;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    backgroundColor: THEME.bg,
    padding: 32,
    fontSize: 10,
    color: THEME.textPrimary,
  },
  headerBar: {
    backgroundColor: THEME.primary,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 11,
    color: "#FFFFFF",
    marginTop: 4,
  },
  totalCard: {
    backgroundColor: THEME.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
  },
  totalLabel: {
    fontSize: 10,
    color: THEME.textSecondary,
  },
  totalValue: {
    fontSize: 26,
    color: THEME.textPrimary,
    marginTop: 4,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: THEME.border,
  },
  breakdownLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 13,
    marginBottom: 8,
    marginTop: 4,
    color: THEME.textPrimary,
  },
  table: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: THEME.card,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: THEME.primaryLight,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: THEME.border,
  },
  tableRowAlt: {
    backgroundColor: THEME.bg,
  },
  totalsRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    backgroundColor: THEME.primaryLight,
  },
  colMonth: { width: "16%" },
  colAmount: { width: "21%", textAlign: "right" },
  headerCellText: { fontSize: 9, color: THEME.textSecondary },
  cellText: { fontSize: 9, color: THEME.textPrimary },
  totalsCellText: { fontSize: 9, color: THEME.textPrimary },
  footer: {
    marginTop: 18,
    fontSize: 8,
    color: THEME.textMuted,
  },
});

function formatYen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

export interface AnnualSummaryPdfData {
  fiscalYearLabel: string;
  summary: AnnualSummary;
  bonuses: ExportBonusLike[];
  generatedAt: string;
}

function AnnualSummaryDocument({ fiscalYearLabel, summary, bonuses, generatedAt }: AnnualSummaryPdfData) {
  const bonusMap = bonusByMonthMap(bonuses);
  const breakdown = [
    { label: "基本給", value: summary.base, color: CATEGORY_COLORS.base },
    { label: "手当", value: summary.allowance, color: CATEGORY_COLORS.allowance },
    { label: "残業代", value: summary.overtime, color: CATEGORY_COLORS.overtime },
    { label: "賞与", value: summary.bonus, color: CATEGORY_COLORS.bonus },
  ];

  return (
    <Document title={`年収サマリー ${fiscalYearLabel}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <Text style={styles.title}>年収サマリー</Text>
          <Text style={styles.subtitle}>{fiscalYearLabel}</Text>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>年収（額面・年度合計）</Text>
          <Text style={styles.totalValue}>{formatYen(summary.total)}</Text>
          {breakdown.map((b) => (
            <View key={b.label} style={styles.breakdownRow}>
              <View style={styles.breakdownLabelRow}>
                <View style={[styles.dot, { backgroundColor: b.color }]} />
                <Text style={styles.cellText}>{b.label}</Text>
              </View>
              <Text style={styles.cellText}>{formatYen(b.value)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>月別内訳</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerCellText, styles.colMonth]}>月</Text>
            <Text style={[styles.headerCellText, styles.colAmount]}>基本給</Text>
            <Text style={[styles.headerCellText, styles.colAmount]}>手当</Text>
            <Text style={[styles.headerCellText, styles.colAmount]}>残業代</Text>
            <Text style={[styles.headerCellText, styles.colAmount]}>賞与</Text>
            <Text style={[styles.headerCellText, styles.colAmount]}>合計</Text>
          </View>
          {summary.months.map((m, i) => {
            const bonus = bonusMap.get(`${m.year}-${m.month}`) ?? 0;
            const rowTotal = m.base + m.allowance + m.overtime + bonus;
            return (
              <View
                key={`${m.year}-${m.month}`}
                style={i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
              >
                <Text style={[styles.cellText, styles.colMonth]}>{MONTH_NAMES_JP[m.month - 1]}</Text>
                <Text style={[styles.cellText, styles.colAmount]}>{formatYen(m.base)}</Text>
                <Text style={[styles.cellText, styles.colAmount]}>{formatYen(m.allowance)}</Text>
                <Text style={[styles.cellText, styles.colAmount]}>{formatYen(m.overtime)}</Text>
                <Text style={[styles.cellText, styles.colAmount]}>{bonus > 0 ? formatYen(bonus) : "-"}</Text>
                <Text style={[styles.cellText, styles.colAmount]}>{formatYen(rowTotal)}</Text>
              </View>
            );
          })}
          <View style={styles.totalsRow}>
            <Text style={[styles.totalsCellText, styles.colMonth]}>合計</Text>
            <Text style={[styles.totalsCellText, styles.colAmount]}>{formatYen(summary.base)}</Text>
            <Text style={[styles.totalsCellText, styles.colAmount]}>{formatYen(summary.allowance)}</Text>
            <Text style={[styles.totalsCellText, styles.colAmount]}>{formatYen(summary.overtime)}</Text>
            <Text style={[styles.totalsCellText, styles.colAmount]}>{formatYen(summary.bonus)}</Text>
            <Text style={[styles.totalsCellText, styles.colAmount]}>{formatYen(summary.total)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>{generatedAt} 作成 ／ 年収管理アプリ ／ この帳票は入力データに基づく概算です。</Text>
      </Page>
    </Document>
  );
}

export async function renderAnnualSummaryPdf(data: AnnualSummaryPdfData): Promise<Buffer> {
  ensureFont();
  return renderToBuffer(<AnnualSummaryDocument {...data} />);
}

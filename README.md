# income-management-web（年収・家計管理Web）

🔗 **本番URL**: [https://nenshu-kanri-web.vercel.app](https://nenshu-kanri-web.vercel.app)

会社員（給与所得者）向けに、給与・残業・賞与・有給休暇・家計簿・資産推移を一つの画面でまとめて管理できる、個人開発のWebアプリケーションです。もともとは「年収管理web（nenshu-kanri-web）」という名前で作られたPythonデスクトップアプリを、Next.jsベースのWebアプリとして作り直したものです。

## 目的・背景

給与明細や家計簿、資産残高などは別々のアプリ・紙・Excelに分散しがちで、「今年の手取りはいくらになりそうか」「今月は使いすぎていないか」「有給はあと何日残っているか」を横断的に把握しづらいという課題があります。本アプリは、これらの情報を1つのデータベースにまとめ、月次の給与・残業計算から手取り概算、家計簿、資産の推移までをダッシュボードで俯瞰できるようにすることを目的としています。

- 想定ユーザー: 自分の年収・家計・資産を継続的に記録し、可視化したい個人（主に会社員）
- 複数ユーザー対応: 最初に作成したアカウントが自動的に「オーナー（管理者）」となり、他ユーザーのパスワード再発行などができる簡易な管理機能を持つ

## 主な機能

- **給与・残業管理**: 月ごとの基本給・手当・残業時間（平日/深夜/休日/休日深夜）を記録し、カレンダーUIで入力
- **賞与（ボーナス）管理**: 支給日・名称・金額を記録
- **有給休暇管理**: 取得日・種別・日数を記録し、入社日や年間付与日数から残日数を自動計算（手動付与にも対応）
- **手取り概算**: 社会保険料（健康保険・厚生年金・雇用保険）と所得税（累進課税）の概算計算により、額面から手取りを試算（都道府県別の健康保険料率、年齢による介護保険料の有無などを考慮）
- **家計簿（budget）**: 収入・支出をカテゴリ別（カテゴリごとに月間予算上限を設定可能）に記録し、毎月自動発生する項目（家賃・サブスクなど）は「継続支出／収入」として登録すれば自動生成
- **資産管理**: 現金・銀行口座・投資口座などの口座ごとに残高（スナップショット）を記録し、資産推移をグラフで確認
- **前年比較**: 年収・支出などを前年同月・前年同期間と比較
- **ダッシュボードでの可視化**: 月次推移の棒グラフ、内訳の円グラフ、資産・家計の推移グラフなど（Recharts使用）
- **CSV / PDFエクスポート**: 給与記録・家計簿・資産推移をCSVやPDFで出力
- **オンボーディング**: 初回ログイン時に基本給・所定労働時間・有給日数などの初期設定をウィザード形式で入力
- **認証・ユーザー管理**: メール・パスワードによるログイン（NextAuth.js）、パスワード再設定（管理者によるトークン発行にも対応）、オーナー権限によるユーザー管理画面
- **PWA対応 / モバイルファーストUI**: ボトムシートモーダルやFAB（フローティングアクションボタン）など、スマートフォンでの操作を意識したUI

## 技術スタック

- **フレームワーク**: [Next.js 16](https://nextjs.org/)（App Router, Server Actions）+ React 19 + TypeScript
- **DB / ORM**: PostgreSQL（Vercel Postgres）+ [Prisma 7](https://www.prisma.io/)（`prisma db push` によるマイグレーションレス運用）
- **認証**: [NextAuth.js (Auth.js) v5](https://authjs.dev/) + bcryptjs によるパスワードハッシュ化
- **UI**: Tailwind CSS 4、lucide-react（アイコン）、Noto Sans JP フォント
- **グラフ**: [Recharts](https://recharts.org/)
- **PDF生成**: [@react-pdf/renderer](https://react-pdf.org/)
- **デプロイ**: Vercel

## ディレクトリ構成（抜粋）

```
src/
  app/                 # ルーティング（App Router）。(dashboard)配下が主要画面
    (dashboard)/         給与・賞与・有給・家計簿・資産・前年比較・設定・管理者画面
    api/                 NextAuthのAPIルート、CSV/PDFエクスポート、アイコン生成
  actions/             Server Actions（給与・賞与・有給・家計簿・資産・設定・認証など）
  components/          画面ごとのUIコンポーネント（salary/bonus/leave/budget/assets/charts等）
  lib/
    business/            給与計算・税/社会保険料計算・有給計算・家計簿計算などのドメインロジック
    export/              CSV/PDFエクスポート処理
    prisma.ts            Prismaクライアントの初期化（Vercel Postgres用ドライバアダプタ）
prisma/
  schema.prisma        DBスキーマ（User, Settings, MonthlyRecord, OvertimeEntry, Bonus,
                        LeaveUsage, BudgetCategory/Transaction, AssetAccount/Snapshot 等）
```

## 開発環境のセットアップ

このプロジェクトは [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) をベースに構築されています。

まず、環境変数（PostgreSQL接続情報など）を `.env` に設定し、Prismaクライアントを生成します。

```bash
npx prisma generate
```

開発サーバーを起動します。

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
# または
bun dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと画面が表示されます。

`app/page.tsx` を編集すると、ページはファイル保存に合わせて自動更新されます。

このプロジェクトはVercelのフォントである [Geist](https://vercel.com/font) を自動的に最適化・読み込みするために [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) を使用しています。

## Next.jsについてさらに学ぶ

Next.jsについて詳しく知りたい場合は、以下のリソースを参照してください。

- [Next.js Documentation](https://nextjs.org/docs) - Next.jsの機能やAPIについて学べます。
- [Learn Next.js](https://nextjs.org/learn) - インタラクティブなNext.jsチュートリアルです。

[Next.jsのGitHubリポジトリ](https://github.com/vercel/next.js) もぜひご覧ください。フィードバックやコントリビューションを歓迎しています。

## Vercelへのデプロイ

Next.jsアプリをデプロイする最も簡単な方法は、Next.jsの開発元が提供する [Vercelプラットフォーム](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) を使うことです。

本プロジェクトの `vercel-build` スクリプトは、デプロイのたびに `prisma generate && prisma db push --accept-data-loss` を実行し、`prisma/schema.prisma` の内容をそのままDBに反映します（マイグレーションファイルを持たない運用のため）。

詳細は [Next.jsのデプロイに関するドキュメント](https://nextjs.org/docs/app/building-your-application/deploying) を参照してください。

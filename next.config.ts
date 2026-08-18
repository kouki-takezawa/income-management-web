import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF エクスポート（src/lib/export/pdf.tsx）が日本語フォント（@fontsource/noto-sans-jp
  // の woff ファイル）を実行時に fs 経由で読み込む。動的に組み立てたパスなので
  // ファイルトレーサーが自動検出できない可能性があるため、Vercel のサーバーレス
  // 関数バンドルに確実に含めるよう明示しておく。
  outputFileTracingIncludes: {
    "/api/export/pdf": ["./node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff"],
  },
};

export default nextConfig;

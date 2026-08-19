import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

// PWA マニフェスト・ホーム画面アイコン用に動的にPNGを生成する。絵文字やCJKグリフは
// ImageResponse (Satori) の既定フォントで正しく描画される保証がないため、フォント読み込み
// 不要な純粋な図形（コイン風の丸）だけでアイコンを構成する。
export async function GET(_req: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size: sizeParam } = await params;
  const size = Math.min(512, Math.max(16, Math.round(Number(sizeParam)) || 192));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F0A9A0",
          borderRadius: size * 0.22,
        }}
      >
        <span
          style={{
            fontSize: size * 0.56,
            fontWeight: 800,
            color: "#FFFFFF",
            fontFamily: "sans-serif",
          }}
        >
          ¥
        </span>
      </div>
    ),
    { width: size, height: size }
  );
}

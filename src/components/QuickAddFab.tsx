"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

// どの画面からでも家計簿の記録をすぐ追加できるフローティングボタン。
// /budget では同じ操作のボタンが既にヘッダーにあるため重複を避けて非表示にする。
// 元いたページ（クエリ含む）を from に載せておき、キャンセル・閉じる操作で
// 家計簿ページに取り残されず元の画面に戻れるようにする。
export function QuickAddFab() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (pathname === "/budget") return null;

  const query = searchParams.toString();
  const from = encodeURIComponent(query ? `${pathname}?${query}` : pathname);

  return (
    <Link
      href={`/budget?new=1&from=${from}`}
      aria-label="家計簿に記録を追加"
      className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-soft transition-transform active:scale-95 md:right-8"
      style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
    >
      <Plus size={26} />
    </Link>
  );
}

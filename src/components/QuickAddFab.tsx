"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

// どの画面からでも家計簿の記録をすぐ追加できるフローティングボタン。
// /budget では同じ操作のボタンが既にヘッダーにあるため重複を避けて非表示にする。
export function QuickAddFab() {
  const pathname = usePathname();
  if (pathname === "/budget") return null;

  return (
    <Link
      href="/budget?new=1"
      aria-label="家計簿に記録を追加"
      className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-soft transition-transform active:scale-95 md:right-8"
      style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
    >
      <Plus size={26} />
    </Link>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, PiggyBank, X } from "lucide-react";
import { logoutAction } from "@/actions/logout";
import { visibleNavItems } from "@/lib/nav";

// モバイル・タブレット幅（md 未満）ではデスクトップの固定幅サイドバーの代わりに、
// 上部の固定バー + ハンバーガーメニューから開くスライドインドロワーを表示する。
export function MobileNav({ userEmail, role }: { userEmail: string; role: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navItems = visibleNavItems(role);

  // ページ遷移したらドロワーを自動で閉じる。useEffect + setState だとカスケード
  // レンダリングになるため、React 推奨の「レンダー中に state を調整する」パターンで
  // 実装する（前回の pathname を保持し、変化していたら即座に補正する）。
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  return (
    <div className="md:hidden">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-sidebar px-4 shadow-soft-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
            <PiggyBank size={16} />
          </div>
          <span className="text-sm font-extrabold text-text-primary">年収管理</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-sidebar-2"
          aria-label="メニューを開く"
          aria-expanded={open}
        >
          <Menu size={20} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40" role="presentation">
          <div
            className="absolute inset-0 bg-[#5B4A42]/30 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute inset-y-0 left-0 flex w-72 max-w-[82vw] flex-col bg-sidebar px-4 py-6 shadow-soft"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-6 flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-soft-sm">
                  <PiggyBank size={20} />
                </div>
                <div>
                  <div className="text-[15px] font-extrabold text-text-primary">年収管理</div>
                  <div className="text-[11px] text-text-secondary">給与・残業・賞与・有給</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-sidebar-2"
                aria-label="メニューを閉じる"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto scrollbar-thin">
              {navItems.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                      active ? "bg-primary text-white shadow-soft-sm" : "text-text-secondary hover:bg-sidebar-2"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-border/70 pt-4">
              <div className="mb-2 truncate px-2 text-[11px] text-text-secondary" title={userEmail}>
                {userEmail}
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-sidebar-2"
                >
                  <LogOut size={16} />
                  ログアウト
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

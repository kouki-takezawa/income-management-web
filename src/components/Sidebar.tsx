"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, PiggyBank } from "lucide-react";
import { logoutAction } from "@/actions/logout";
import { visibleNavItems } from "@/lib/nav";

export function Sidebar({ userEmail, role }: { userEmail: string; role: string }) {
  const pathname = usePathname();
  const navItems = visibleNavItems(role);

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col bg-sidebar px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-soft-sm">
          <PiggyBank size={22} />
        </div>
        <div>
          <div className="text-[15px] font-extrabold text-text-primary">年収管理</div>
          <div className="text-[11px] text-text-secondary">給与・残業・賞与・有給</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
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
    </aside>
  );
}

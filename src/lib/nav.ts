import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Wallet, Gift, Palmtree, TrendingUp, Settings, ShieldCheck } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** true の場合は role === "owner" のときだけ表示する */
  ownerOnly?: boolean;
}

// サイドバー（デスクトップ）とハンバーガーメニュー（モバイル）で共有するナビ項目。
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/salary", label: "給与・残業", icon: Wallet },
  { href: "/bonus", label: "賞与", icon: Gift },
  { href: "/leave", label: "有給休暇", icon: Palmtree },
  { href: "/comparison", label: "前年比較", icon: TrendingUp },
  { href: "/settings", label: "設定", icon: Settings },
  { href: "/admin/users", label: "ユーザー管理", icon: ShieldCheck, ownerOnly: true },
];

export function visibleNavItems(role: string | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.ownerOnly || role === "owner");
}

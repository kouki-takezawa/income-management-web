import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getOrCreateSettings } from "@/lib/data";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { QuickAddFab } from "@/components/QuickAddFab";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const role = session?.user?.role ?? "member";

  // 初回ログイン後、オンボーディングが未完了なら /onboarding へリダイレクトする
  // （/onboarding 自体はこの (dashboard) レイアウトの外にあるルートなので、
  // ここでのチェックが無限リダイレクトになることはない）。
  if (session?.user?.id) {
    const settings = await getOrCreateSettings(session.user.id);
    if (!settings.onboardingCompleted) {
      redirect("/onboarding");
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userEmail={email} role={role} />
      <MobileNav userEmail={email} role={role} />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 pt-20 pb-8 sm:px-6 md:px-10 md:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <QuickAddFab />
    </div>
  );
}

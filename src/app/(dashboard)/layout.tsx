import type { ReactNode } from "react";
import { auth } from "@/auth";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const email = session?.user?.email ?? "";

  return (
    <div className="flex min-h-screen">
      <Sidebar userEmail={email} />
      <main className="min-w-0 flex-1 overflow-y-auto px-6 py-8 md:px-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

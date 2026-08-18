import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminUsersList } from "@/components/admin/AdminUsersList";

export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary">ユーザー管理</h1>
        <p className="mt-1 text-sm text-text-secondary">
          パスワードを忘れたユーザーのために、再設定リンクを発行して直接共有できます（メールは送信されません）。
        </p>
      </div>
      <AdminUsersList users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))} />
    </div>
  );
}

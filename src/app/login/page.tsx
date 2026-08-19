import { PiggyBank } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const params = await searchParams;
  const resetSuccess = params.reset === "success";
  const accountUpdated = params.reset === "account-updated";

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary text-white shadow-soft">
            <PiggyBank size={28} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary">年収管理アプリ</h1>
            <p className="mt-1 text-sm text-text-secondary">おかえりなさい。ログインしてください</p>
          </div>
        </div>
        <div className="rounded-3xl bg-card p-7 shadow-soft">
          <LoginForm resetSuccess={resetSuccess} accountUpdated={accountUpdated} />
        </div>
      </div>
    </div>
  );
}

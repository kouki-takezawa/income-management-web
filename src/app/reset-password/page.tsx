import Link from "next/link";
import { PiggyBank, Info } from "lucide-react";
import { findValidResetToken } from "@/lib/password-reset";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";
  const record = await findValidResetToken(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary text-white shadow-soft">
            <PiggyBank size={28} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary">パスワードの再設定</h1>
            <p className="mt-1 text-sm text-text-secondary">新しいパスワードを設定してください</p>
          </div>
        </div>
        <div className="rounded-3xl bg-card p-7 shadow-soft">
          {record ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Info size={24} className="text-text-muted" />
              <p className="text-sm text-text-secondary">
                このリンクは無効か、有効期限が切れています。管理者にリンクの再発行を依頼してください。
              </p>
              <Link href="/login" className="mt-2 text-sm font-semibold text-primary-dark hover:underline">
                ログイン画面へ戻る
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import "server-only";
import { auth } from "@/auth";

/**
 * サーバーアクション／ルートハンドラの入口で必ず呼び出し、セッションを
 * サーバー側で再検証する。クライアントから渡された userId は絶対に信用しない。
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("認証が必要です。再度ログインしてください。");
  }
  return userId;
}

/**
 * サーバーアクションの入口で呼び出し、管理者（role=owner）であることを検証する。
 * ユーザー管理系のアクション（パスワード再設定リンク発行など）専用。
 */
export async function requireOwnerId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || session?.user?.role !== "owner") {
    throw new Error("管理者権限が必要です。");
  }
  return userId;
}

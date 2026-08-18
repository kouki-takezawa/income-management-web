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

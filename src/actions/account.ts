"use server";

import bcrypt from "bcryptjs";
import { prisma, isUniqueConstraintError } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { signOut } from "@/auth";
import { isValidEmail } from "@/lib/email";

export interface ActionResult {
  success: boolean;
  error?: string;
}

async function verifyCurrentPassword(
  userId: string,
  currentPassword: string
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "ユーザーが見つかりません" };
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) return { ok: false, error: "現在のパスワードが正しくありません" };
  return { ok: true, email: user.email };
}

// メール・パスワードを変更したら、安全のため（そして JWT セッションに埋め込まれた
// 古いメールアドレスが再ログインまで残り続けるのを避けるため）強制的にログアウトする。
// signOut の redirectTo は Next.js の redirect() を内部で呼ぶため、この関数は正常系では
// 戻り値を返さずにログイン画面へ遷移する。以降の return は型を満たすためだけの到達不能コード。
async function forceReauth(): Promise<never> {
  await signOut({ redirectTo: "/login?reset=account-updated" });
  throw new Error("unreachable");
}

export async function updateAccountEmail(input: { email: string; currentPassword: string }): Promise<ActionResult> {
  const userId = await requireUserId();
  const email = input.email.trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return { success: false, error: "有効なメールアドレスを入力してください" };
  }

  const verified = await verifyCurrentPassword(userId, input.currentPassword);
  if (!verified.ok) return { success: false, error: verified.error };

  if (email === verified.email) {
    return { success: false, error: "現在と同じメールアドレスです" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "このメールアドレスは既に使用されています" };
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { email } });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "このメールアドレスは既に使用されています" };
    }
    throw error;
  }
  return forceReauth();
}

export async function updateAccountPassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  const userId = await requireUserId();

  if (input.newPassword.length < 8) {
    return { success: false, error: "新しいパスワードは8文字以上で入力してください" };
  }
  if (input.newPassword !== input.confirmPassword) {
    return { success: false, error: "新しいパスワードが一致しません" };
  }

  const verified = await verifyCurrentPassword(userId, input.currentPassword);
  if (!verified.ok) return { success: false, error: verified.error };

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return forceReauth();
}

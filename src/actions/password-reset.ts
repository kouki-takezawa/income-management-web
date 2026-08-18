"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireOwnerId } from "@/lib/session";
import { generateRawToken, hashToken } from "@/lib/token";
import { findValidResetToken } from "@/lib/password-reset";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1時間

export interface GenerateResetLinkResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 管理者（owner）専用: 対象ユーザーのパスワード再設定リンクを発行する。
 * メールは送信しない — URL をその場で画面に表示し、管理者が直接（チャット等で）
 * 本人に共有する運用。
 */
export async function generatePasswordResetLink(targetUserId: string): Promise<GenerateResetLinkResult> {
  await requireOwnerId();

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!target) {
    return { success: false, error: "対象のユーザーが見つかりません" };
  }

  // 前回発行した未使用のリンクは無効化しておく（有効なリンクが複数残らないように）。
  await prisma.passwordResetToken.updateMany({
    where: { userId: targetUserId, usedAt: null },
    data: { usedAt: new Date() },
  });

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: { userId: targetUserId, tokenHash, expiresAt },
  });

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = `${proto}://${host}/reset-password?token=${rawToken}`;

  return { success: true, url };
}

export interface ResetPasswordState {
  error?: string;
}

const initialState: ResetPasswordState = {};

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!token) {
    return { error: "リンクが正しくありません。管理者にリンクの再発行を依頼してください。" };
  }
  if (password.length < 8) {
    return { error: "パスワードは8文字以上で入力してください" };
  }
  if (password !== confirm) {
    return { error: "パスワードが一致しません" };
  }

  const record = await findValidResetToken(token);
  if (!record) {
    return { error: "このリンクは無効か有効期限が切れています。管理者にリンクの再発行を依頼してください。" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  redirect("/login?reset=success");
  return initialState;
}

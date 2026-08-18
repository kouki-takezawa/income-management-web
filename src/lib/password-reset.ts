import "server-only";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/token";
import type { PasswordResetToken } from "@prisma/client";

/**
 * トークン文字列を検証し、有効（未使用・期限内）であればレコードを返す。
 * /reset-password ページの事前チェックと resetPasswordAction の両方から使う。
 */
export async function findValidResetToken(rawToken: string): Promise<PasswordResetToken | null> {
  if (!rawToken) return null;
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt.getTime() < Date.now()) return null;
  return record;
}

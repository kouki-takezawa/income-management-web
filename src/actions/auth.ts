"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";

export interface AuthFormState {
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signupAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!email || !EMAIL_RE.test(email)) {
    return { error: "有効なメールアドレスを入力してください" };
  }
  if (password.length < 8) {
    return { error: "パスワードは8文字以上で入力してください" };
  }
  if (password !== confirm) {
    return { error: "パスワードが一致しません" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "このメールアドレスは既に登録されています" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // このシステムで最初に作られるユーザーは自動的に owner（管理者）になる。
  // ADMIN_EMAIL が設定されていて一致する場合は、登録順に関わらず owner にする
  // （どちらのユーザーが最初に登録されるか確定できない場合の明示的な上書き）。
  const userCount = await prisma.user.count();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const role = userCount === 0 || (!!adminEmail && adminEmail === email) ? "owner" : "member";

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      settings: { create: {} },
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "登録は完了しましたが、自動ログインに失敗しました。ログイン画面からログインしてください。" };
    }
    throw error;
  }

  return {};
}

export async function loginAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください" };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "メールアドレスまたはパスワードが正しくありません" };
    }
    throw error;
  }

  return {};
}

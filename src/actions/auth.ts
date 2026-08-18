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
  await prisma.user.create({
    data: {
      email,
      passwordHash,
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

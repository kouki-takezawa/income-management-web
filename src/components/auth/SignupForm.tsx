"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type AuthFormState } from "@/actions/auth";
import { TextInput, Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initialState: AuthFormState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="メールアドレス">
        <TextInput type="email" name="email" required autoComplete="email" placeholder="you@example.com" />
      </Field>
      <Field label="パスワード" hint="8文字以上で入力してください">
        <TextInput type="password" name="password" required minLength={8} autoComplete="new-password" placeholder="********" />
      </Field>
      <Field label="パスワード（確認）">
        <TextInput type="password" name="confirm" required minLength={8} autoComplete="new-password" placeholder="********" />
      </Field>

      {state.error && (
        <p className="rounded-2xl bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "登録中..." : "アカウントを作成"}
      </Button>

      <p className="text-center text-sm text-text-secondary">
        既にアカウントをお持ちの方は{" "}
        <Link href="/login" className="font-semibold text-primary-dark hover:underline">
          ログイン
        </Link>
      </p>
    </form>
  );
}

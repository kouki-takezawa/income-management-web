"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/actions/auth";
import { TextInput, Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="メールアドレス">
        <TextInput type="email" name="email" required autoComplete="email" placeholder="you@example.com" />
      </Field>
      <Field label="パスワード">
        <TextInput type="password" name="password" required autoComplete="current-password" placeholder="********" />
      </Field>

      {state.error && (
        <p className="rounded-2xl bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "ログイン中..." : "ログイン"}
      </Button>

      <p className="text-center text-sm text-text-secondary">
        アカウントをお持ちでない方は{" "}
        <Link href="/signup" className="font-semibold text-primary-dark hover:underline">
          新規登録
        </Link>
      </p>
    </form>
  );
}

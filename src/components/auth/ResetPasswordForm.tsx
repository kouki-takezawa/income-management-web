"use client";

import { useActionState } from "react";
import { resetPasswordAction, type ResetPasswordState } from "@/actions/password-reset";
import { TextInput, Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <Field label="新しいパスワード" hint="8文字以上で入力してください">
        <TextInput type="password" name="password" required minLength={8} autoComplete="new-password" placeholder="********" />
      </Field>
      <Field label="新しいパスワード（確認）">
        <TextInput type="password" name="confirm" required minLength={8} autoComplete="new-password" placeholder="********" />
      </Field>

      {state.error && (
        <p className="rounded-2xl bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "設定中..." : "パスワードを再設定"}
      </Button>
    </form>
  );
}

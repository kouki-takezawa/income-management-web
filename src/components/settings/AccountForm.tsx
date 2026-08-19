"use client";

import { useState, useTransition } from "react";
import { KeyRound, Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Field, TextInput, PasswordInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { updateAccountEmail, updateAccountPassword } from "@/actions/account";

export function AccountForm({ currentEmail }: { currentEmail: string }) {
  const [isEmailPending, startEmailTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();

  const [email, setEmail] = useState(currentEmail);
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function saveEmail() {
    setEmailError(null);
    startEmailTransition(async () => {
      const result = await updateAccountEmail({ email, currentPassword: emailPassword });
      if (!result.success) {
        setEmailError(result.error ?? "変更に失敗しました");
      }
    });
  }

  function savePassword() {
    setPasswordError(null);
    startPasswordTransition(async () => {
      const result = await updateAccountPassword({ currentPassword, newPassword, confirmPassword });
      if (!result.success) {
        setPasswordError(result.error ?? "変更に失敗しました");
      }
    });
  }

  return (
    <Card>
      <SectionTitle icon={<KeyRound size={16} />}>アカウント</SectionTitle>
      <p className="mt-2 text-xs leading-relaxed text-text-muted">
        メールアドレス・パスワードを変更すると、安全のため自動的にログアウトします。新しい情報で再度ログインしてください。
      </p>

      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
          <Mail size={14} /> メールアドレスの変更
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="w-64">
            <Field label="新しいメールアドレス">
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </Field>
          </div>
          <div className="w-56">
            <Field label="現在のパスワード（確認用）">
              <PasswordInput
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
          </div>
        </div>
        {emailError && <p className="text-sm font-medium text-danger">{emailError}</p>}
        <div>
          <Button type="button" variant="outline" onClick={saveEmail} disabled={isEmailPending}>
            メールアドレスを変更
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
          <KeyRound size={14} /> パスワードの変更
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="w-56">
            <Field label="現在のパスワード">
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
          </div>
          <div className="w-56">
            <Field label="新しいパスワード" hint="8文字以上">
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
          </div>
          <div className="w-56">
            <Field label="新しいパスワード（確認）">
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
          </div>
        </div>
        {passwordError && <p className="text-sm font-medium text-danger">{passwordError}</p>}
        <div>
          <Button type="button" variant="outline" onClick={savePassword} disabled={isPasswordPending}>
            パスワードを変更
          </Button>
        </div>
      </div>
    </Card>
  );
}

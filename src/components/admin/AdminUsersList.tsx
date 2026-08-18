"use client";

import { useState, useTransition } from "react";
import { KeyRound, Copy, Check, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { THEME } from "@/lib/theme";
import { generatePasswordResetLink } from "@/actions/password-reset";

export interface AdminUserRow {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function UserRow({ user }: { user: AdminUserRow }) {
  const [isPending, startTransition] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    setUrl(null);
    setCopied(false);
    startTransition(async () => {
      const result = await generatePasswordResetLink(user.id);
      if (!result.success || !result.url) {
        setError(result.error ?? "発行に失敗しました");
        return;
      }
      setUrl(result.url);
    });
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("コピーに失敗しました。リンクを選択して手動でコピーしてください。");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-bg/60 px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{user.email}</span>
        {user.role === "owner" && (
          <Pill color={THEME.pink}>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={11} />
              オーナー
            </span>
          </Pill>
        )}
        <span className="shrink-0 text-xs text-text-muted">{formatDate(user.createdAt)} 登録</span>
        <Button
          variant="outline"
          type="button"
          icon={<KeyRound size={14} />}
          onClick={generate}
          disabled={isPending}
          className="ml-auto sm:ml-0"
        >
          {isPending ? "発行中..." : "パスワード再設定リンクを発行"}
        </Button>
      </div>
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      {url && (
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-white px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <TextInput
              readOnly
              value={url}
              className="min-w-0 flex-1 text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              type="button"
              variant="ghost"
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={copy}
            >
              {copied ? "コピー済み" : "コピー"}
            </Button>
          </div>
          <p className="text-[11px] leading-relaxed text-text-muted">
            このリンクの有効期限は発行から1時間、1回だけ使用できます。このリンクを本人に直接共有してください（チャットや口頭で伝達）。メールは送信されません。
          </p>
        </div>
      )}
    </div>
  );
}

export function AdminUsersList({ users }: { users: AdminUserRow[] }) {
  return (
    <Card>
      <div className="flex flex-col gap-3">
        {users.map((u) => (
          <UserRow key={u.id} user={u} />
        ))}
      </div>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Button } from "./Button";

// 「削除」ボタンの誤操作対策。1回目のクリックでは削除せず、その場でボタンを
// 「本当に削除する」+「キャンセル」に差し替える（別ダイアログは出さない）。
export function ConfirmButton({
  onConfirm,
  disabled,
  label = "削除",
  confirmLabel = "本当に削除する",
}: {
  onConfirm: () => void;
  disabled?: boolean;
  label?: string;
  confirmLabel?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" type="button" onClick={() => setConfirming(false)}>
          キャンセル
        </Button>
        <Button variant="danger" type="button" onClick={onConfirm} disabled={disabled}>
          {confirmLabel}
        </Button>
      </div>
    );
  }

  return (
    <Button variant="danger" type="button" onClick={() => setConfirming(true)} disabled={disabled}>
      {label}
    </Button>
  );
}

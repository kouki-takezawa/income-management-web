"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";

// 「削除」ボタンの誤操作対策。常に単一のボタンのまま（DOM上のボタン数は
// 増減しない）: 1回目のクリックではまだ削除せず、ラベルを「本当に削除する？」に
// 変えるだけ。一定時間内にもう一度クリックすると実行、それ以外（他のボタンを押す・
// 何もしない）なら数秒で元のラベルに戻る。ボタンが増えないので、モーダルの
// フッター（キャンセル/保存と横並び）でも折り返しなしで安全に収まる。
export function ConfirmButton({
  onConfirm,
  disabled,
  label = "削除",
  confirmLabel = "本当に削除する？",
  resetDelayMs = 3000,
}: {
  onConfirm: () => void;
  disabled?: boolean;
  label?: string;
  confirmLabel?: string;
  resetDelayMs?: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function handleClick() {
    if (confirming) {
      if (timer.current) clearTimeout(timer.current);
      setConfirming(false);
      onConfirm();
      return;
    }
    setConfirming(true);
    timer.current = setTimeout(() => setConfirming(false), resetDelayMs);
  }

  return (
    <Button variant="danger" type="button" onClick={handleClick} disabled={disabled}>
      {confirming ? confirmLabel : label}
    </Button>
  );
}

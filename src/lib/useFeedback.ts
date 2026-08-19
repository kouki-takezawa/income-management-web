import { useCallback, useEffect, useRef, useState } from "react";

// 保存・削除の完了を一言だけ添えて知らせるための小さなフック。
// モーダルは成功後に閉じてしまうことが多いので、呼び出し側は結果を表示できる
// 場所（見出しの横など）でこのメッセージを描画する。一定時間後に自動で消える。
export function useFeedback(duration = 2500) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const showFeedback = useCallback(
    (text: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
      timer.current = setTimeout(() => setMessage(null), duration);
    },
    [duration]
  );

  return [message, showFeedback] as const;
}

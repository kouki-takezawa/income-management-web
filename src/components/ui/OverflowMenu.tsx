"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

// ヘッダーに並ぶボタンが多くなりすぎるのを防ぐための「…」メニュー。
// 開閉は自前管理し、メニュー外クリックで閉じる。中身は OverflowMenuItem を並べる。
export function OverflowMenu({ children, label = "その他の操作" }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="flex h-10 w-10 items-center justify-center rounded-full border-[1.4px] border-primary text-primary-dark hover:bg-primary-light"
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className="absolute right-0 top-full z-20 mt-2 flex w-52 flex-col gap-0.5 rounded-2xl bg-card p-1.5 shadow-soft ring-1 ring-border"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function OverflowMenuItem({
  onClick,
  href,
  icon,
  children,
}: {
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const className =
    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-text-primary hover:bg-bg";
  if (href) {
    return (
      <a href={href} className={className}>
        {icon}
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {icon}
      {children}
    </button>
  );
}

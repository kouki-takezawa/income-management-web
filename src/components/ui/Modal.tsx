"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { X } from "lucide-react";

// スマホでは画面下からせり上がる「ボトムシート」、sm 以上では中央に浮くダイアログとして表示する。
export function Modal({
  title,
  onClose,
  children,
  width = 480,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#5B4A42]/30 backdrop-blur-[1px] sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-sheet-in max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 pt-3 shadow-soft scrollbar-thin sm:rounded-3xl sm:p-6"
        style={{ maxWidth: width, paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-border sm:hidden" />
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-text-primary">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary hover:bg-primary-light"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

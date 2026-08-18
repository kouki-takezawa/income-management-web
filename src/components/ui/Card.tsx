import type { ReactNode, CSSProperties } from "react";

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-3xl bg-card p-4 shadow-soft sm:p-6 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

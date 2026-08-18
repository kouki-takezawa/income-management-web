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
      className={`rounded-3xl bg-card p-6 shadow-soft ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

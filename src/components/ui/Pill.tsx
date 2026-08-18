import { THEME } from "@/lib/theme";

export function Pill({
  children,
  color = THEME.primary,
  textColor = "#fff",
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  textColor?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold whitespace-nowrap ${className}`}
      style={{ backgroundColor: color, color: textColor }}
    >
      {children}
    </span>
  );
}

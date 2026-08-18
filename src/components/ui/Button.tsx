import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost" | "danger";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  outline: "border-[1.4px] border-primary text-primary-dark bg-transparent hover:bg-primary-light",
  ghost: "text-text-secondary hover:bg-primary-light/60",
  danger: "text-danger hover:bg-danger/10",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  icon,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: ReactNode }) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {icon}
      {children}
    </button>
  );
}

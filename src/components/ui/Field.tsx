import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export const inputClass =
  "w-full rounded-2xl border border-border bg-bg/60 px-4 py-3 text-sm text-text-primary outline-none transition-colors focus:border-primary focus:bg-white placeholder:text-text-muted";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-text-secondary">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-text-muted">{hint}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

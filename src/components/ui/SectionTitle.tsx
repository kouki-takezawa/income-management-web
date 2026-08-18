import type { ReactNode } from "react";
import { withAlpha } from "@/lib/color";
import { THEME } from "@/lib/theme";

export function SectionTitle({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      {icon && (
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: withAlpha(THEME.primaryDark, 0.12), color: THEME.primaryDark }}
        >
          {icon}
        </span>
      )}
      <h2 className="text-[17px] font-extrabold text-text-primary">{children}</h2>
    </div>
  );
}

import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

interface ChipProps {
  children: ReactNode;
  className?: string;
  tone?: "coral" | "lavender" | "mint" | "soft";
}

const toneClasses = {
  coral: "bg-coral text-white",
  lavender: "bg-lavender text-charcoal",
  mint: "bg-mint text-charcoal",
  soft: "bg-tertiary-fixed text-on-tertiary-fixed-variant"
} as const;

export function Chip({ children, className, tone = "soft" }: ChipProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-4 py-2 font-label text-xs font-bold uppercase tracking-[0.18em] card-border shadow-tactile-sm",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

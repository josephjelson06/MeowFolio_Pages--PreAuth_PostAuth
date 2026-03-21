import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return (
    <section
      className={cx(
        "rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-low p-6 shadow-ambient",
        className
      )}
    >
      {children}
    </section>
  );
}

import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cx("rounded-[1.5rem] bg-white p-6 card-border shadow-tactile", className)}>
      {children}
    </div>
  );
}

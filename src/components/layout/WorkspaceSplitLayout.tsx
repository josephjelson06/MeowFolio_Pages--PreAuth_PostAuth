import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

type Variant = "editor" | "analysis" | "sidebar";

interface WorkspaceSplitLayoutProps {
  left: ReactNode;
  leftClassName?: string;
  right: ReactNode;
  rightClassName?: string;
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  editor: "xl:grid-cols-2",
  analysis: "xl:grid-cols-[minmax(360px,40%)_1fr]",
  sidebar: "xl:grid-cols-[380px_1fr]"
};

export function WorkspaceSplitLayout({
  left,
  leftClassName,
  right,
  rightClassName,
  variant = "analysis"
}: WorkspaceSplitLayoutProps) {
  return (
    <div className={cx("grid h-full min-h-0 w-full grid-cols-1 grid-rows-[minmax(0,1fr)] gap-6", variantClasses[variant])}>
      <div className={cx("h-full min-h-0 min-w-0 overflow-hidden", leftClassName)}>{left}</div>
      <div className={cx("h-full min-h-0 min-w-0 overflow-hidden", rightClassName)}>{right}</div>
    </div>
  );
}

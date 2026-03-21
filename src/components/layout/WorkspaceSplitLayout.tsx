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
  editor: "xl:grid-cols-[minmax(420px,45%)_1fr]",
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
    <div className={cx("grid h-full w-full grid-cols-1 gap-6", variantClasses[variant])}>
      <div className={cx("workspace-scroll min-h-[320px] overflow-auto", leftClassName)}>{left}</div>
      <div className={cx("workspace-scroll min-h-[320px] overflow-auto", rightClassName)}>{right}</div>
    </div>
  );
}

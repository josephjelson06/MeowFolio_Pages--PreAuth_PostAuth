import type { ReactNode } from "react";
import { cx } from "../../lib/cx";
import { TopNav } from "./TopNav";

interface AppLayoutProps {
  children: ReactNode;
  contentClassName?: string;
}

export function AppLayout({ children, contentClassName }: AppLayoutProps) {
  return (
    <div className="dotted-bg-soft flex min-h-screen flex-col">
      <TopNav
        links={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Editor", to: "/editor" },
          { label: "JD Analyzer", to: "/jd" },
          { label: "ATS Scorer", to: "/ats" }
        ]}
        mode="app"
        primaryAction={{ label: "Create New", to: "/editor" }}
      />
      <main className={cx("mx-auto flex w-full max-w-[1600px] flex-1", contentClassName)}>{children}</main>
    </div>
  );
}

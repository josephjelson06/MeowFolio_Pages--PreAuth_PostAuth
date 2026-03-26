import type { ReactNode } from "react";
import { cx } from "../../lib/cx";
import { TopNav } from "./TopNav";

interface AppLayoutProps {
  children: ReactNode;
  contentClassName?: string;
  viewportBound?: boolean;
}

export function AppLayout({ children, contentClassName, viewportBound = false }: AppLayoutProps) {
  return (
    <div className={cx("dotted-bg-soft flex flex-col", viewportBound ? "h-dvh overflow-hidden" : "min-h-screen")}>
      <TopNav
        links={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Resumes", to: "/resumes" },
          { label: "Editor", to: "/editor" },
          { label: "JD Analyzer", to: "/jd" },
          { label: "ATS Scorer", to: "/ats" }
        ]}
        mode="app"
        primaryAction={{ label: "Create New", to: "/editor" }}
      />
      <main
        className={cx(
          "mx-auto flex min-h-0 w-full max-w-[1600px] flex-1",
          viewportBound && "overflow-hidden",
          contentClassName
        )}
      >
        {children}
      </main>
    </div>
  );
}

import type { ReactNode } from "react";
import { TopNav } from "./TopNav";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="dotted-bg min-h-screen">
      <TopNav
        links={[
          { label: "Home", to: "/" },
          { label: "Dashboard", to: "/dashboard" },
          { label: "Editor", to: "/editor" }
        ]}
        mode="public"
        primaryAction={{ label: "Open App", to: "/dashboard" }}
        secondaryAction={{ label: "Preview UI", to: "/editor" }}
      />
      <main>{children}</main>
      <footer className="border-t-2 border-charcoal bg-white/60 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-on-surface-variant md:flex-row md:items-center md:justify-between">
          <p className="max-w-xl font-medium">
            Tactile Dreamscape rebuilt as a React UI system: one brand, one dashboard shell, and three preserved
            workspace tools.
          </p>
          <div className="flex flex-wrap gap-4 font-label text-xs font-bold uppercase tracking-[0.18em]">
            <span>Landing</span>
            <span>Dashboard</span>
            <span>Editor</span>
            <span>ATS</span>
            <span>JD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

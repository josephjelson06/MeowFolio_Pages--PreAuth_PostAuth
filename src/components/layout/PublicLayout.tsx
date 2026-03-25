import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { TopNav } from "./TopNav";

interface PublicLayoutProps {
  children: ReactNode;
  footer?: ReactNode;
}

export function PublicLayout({ children, footer }: PublicLayoutProps) {
  const defaultFooter = (
    <footer className="border-t-2 border-charcoal bg-white/60 px-6 py-10">
      <div className="mx-auto grid max-w-7xl gap-8 text-sm text-on-surface-variant md:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <div>
          <p className="max-w-xl font-medium">
            MeowFolio now runs as one connected product surface: editable resume data, TeX-backed PDF output, and
            shared ATS/JD workspaces.
          </p>
        </div>
        <div className="space-y-3">
          <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Explore</p>
          <div className="flex flex-wrap gap-4 font-label text-xs font-bold uppercase tracking-[0.18em]">
            <Link to="/">Landing</Link>
            <Link to="/learn">Learn</Link>
            <Link to="/about">About</Link>
            <Link to="/learn/chapter-1">Chapter 1</Link>
            <Link to="/learn/chapter-7">Chapter 7</Link>
          </div>
        </div>
        <div className="space-y-3">
          <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Start Here</p>
          <div className="flex flex-wrap gap-4 font-label text-xs font-bold uppercase tracking-[0.18em]">
            <Link to="/choose-path">Choose Path</Link>
            <Link to="/templates">Templates</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/editor">Editor</Link>
          </div>
        </div>
      </div>
    </footer>
  );

  return (
    <div className="dotted-bg min-h-screen">
      <TopNav
        links={[
          { label: "Home", to: "/" },
          { label: "Learn", to: "/learn" },
          { label: "About", to: "/about" },
          { label: "Choose Path", to: "/choose-path" },
          { label: "Templates", to: "/templates" }
        ]}
        mode="public"
        primaryAction={{ label: "Start Resume", to: "/choose-path" }}
        secondaryAction={{ label: "Browse Templates", to: "/templates" }}
      />
      <main>{children}</main>
      {footer === undefined ? defaultFooter : footer}
    </div>
  );
}

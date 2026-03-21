import { NavLink } from "react-router-dom";
import { cx } from "../../lib/cx";
import { BrandMark } from "../ui/BrandMark";
import { Button } from "../ui/Button";

interface NavItem {
  label: string;
  to: string;
}

interface TopNavProps {
  links: NavItem[];
  mode?: "public" | "app";
  primaryAction?: {
    label: string;
    to: string;
  };
  secondaryAction?: {
    label: string;
    to: string;
  };
}

export function TopNav({
  links,
  mode = "public",
  primaryAction,
  secondaryAction
}: TopNavProps) {
  const isApp = mode === "app";

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-charcoal/10 bg-background/80 px-6 py-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6">
        <BrandMark to={isApp ? "/dashboard" : "/"} />

        <div className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              end={link.to === "/"}
              to={link.to}
              className={({ isActive }) =>
                cx(
                  "font-label text-sm font-bold transition-colors",
                  isActive
                    ? "border-b-2 border-primary pb-1 text-primary"
                    : "text-on-surface-variant hover:text-primary"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {secondaryAction ? <Button to={secondaryAction.to} variant="ghost">{secondaryAction.label}</Button> : null}
          {primaryAction ? <Button to={primaryAction.to}>{primaryAction.label}</Button> : null}
          {isApp ? (
            <>
              <button
                type="button"
                className="hidden h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container lg:flex"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border-2 border-charcoal px-2 py-1"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed font-label text-xs font-bold text-primary">
                  AT
                </div>
                <span className="material-symbols-outlined text-sm text-on-surface-variant">arrow_drop_down</span>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

import type { MouseEventHandler, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cx } from "../../lib/cx";

type Variant = "primary" | "secondary" | "surface" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string;
  icon?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  size?: Size;
  to?: string;
  type?: "button" | "submit" | "reset";
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary: "chunky-button bg-primary text-on-primary hover:bg-primary/95",
  secondary: "chunky-button bg-secondary-container text-on-secondary-container hover:bg-secondary-container/90",
  surface: "chunky-button bg-white text-charcoal hover:bg-surface-container-lowest",
  ghost: "border-2 border-transparent bg-transparent text-on-surface hover:bg-surface-container-high"
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base"
};

function ButtonInner({
  children,
  className,
  disabled,
  icon,
  size = "md",
  variant = "primary"
}: Omit<ButtonProps, "href" | "to" | "type">) {
  return (
    <span
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-label font-bold transition-all",
        variantClasses[variant],
        sizeClasses[size],
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {icon ? <span className="material-symbols-outlined text-[1.1em]">{icon}</span> : null}
      {children}
    </span>
  );
}

export function Button({ children, href, to, type = "button", disabled, onClick, ...props }: ButtonProps) {
  if (to) {
    return (
      <Link to={to}>
        <ButtonInner {...props} disabled={disabled}>
          {children}
        </ButtonInner>
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href}>
        <ButtonInner {...props} disabled={disabled}>
          {children}
        </ButtonInner>
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled}>
      <ButtonInner {...props}>{children}</ButtonInner>
    </button>
  );
}

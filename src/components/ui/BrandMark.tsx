import { Link } from "react-router-dom";
import { cx } from "../../lib/cx";

interface BrandMarkProps {
  className?: string;
  to?: string;
}

export function BrandMark({ className, to = "/" }: BrandMarkProps) {
  return (
    <Link to={to} className={cx("flex items-center gap-3", className)}>
      <div className="tactile-card flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container">
        <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: '"FILL" 1' }}>
          pets
        </span>
      </div>
      <span className="font-headline text-xl font-extrabold tracking-tight text-on-surface">MeowFolio</span>
    </Link>
  );
}

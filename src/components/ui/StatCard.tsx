import { cx } from "../../lib/cx";

interface StatCardProps {
  icon: string;
  label: string;
  tone: "primary" | "secondary" | "tertiary";
  trend: string;
  value: string;
}

const toneClasses = {
  primary: {
    shell: "bg-primary-fixed text-on-primary-fixed-variant",
    icon: "bg-white text-primary"
  },
  secondary: {
    shell: "bg-secondary-fixed text-on-secondary-fixed-variant",
    icon: "bg-white text-secondary"
  },
  tertiary: {
    shell: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
    icon: "bg-white text-tertiary"
  }
} as const;

export function StatCard({ icon, label, tone, trend, value }: StatCardProps) {
  const colors = toneClasses[tone];

  return (
    <div className={cx("tactile-card rounded-[1.5rem] p-6", colors.shell)}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className={cx("flex h-12 w-12 items-center justify-center rounded-xl border-2 border-charcoal", colors.icon)}>
          <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        <span className="rounded-full border border-charcoal/20 bg-white/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
          {trend}
        </span>
      </div>
      <p className="font-label text-sm font-bold">{label}</p>
      <p className="mt-2 font-headline text-4xl font-extrabold">{value}</p>
      <div className="mt-4 h-2 rounded-full bg-charcoal/10">
        <div className="h-full w-4/5 rounded-full bg-current/80" />
      </div>
    </div>
  );
}

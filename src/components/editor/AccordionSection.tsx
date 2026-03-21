import type { ReactNode } from "react";

interface AccordionSectionProps {
  children: ReactNode;
  icon: string;
  title: string;
}

export function AccordionSection({ children, icon, title }: AccordionSectionProps) {
  return (
    <details open className="overflow-hidden rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest">
      <summary className="flex cursor-default items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed">
            <span className="material-symbols-outlined text-primary">{icon}</span>
          </div>
          <h3 className="font-headline text-lg font-bold text-on-surface">{title}</h3>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
      </summary>
      <div className="px-6 pb-6">{children}</div>
    </details>
  );
}

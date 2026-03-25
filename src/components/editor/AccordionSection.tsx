import type { DragEventHandler, ReactNode } from "react";
import { cx } from "../../lib/cx";

interface AccordionSectionProps {
  active: boolean;
  children: ReactNode;
  dragActive?: boolean;
  draggable?: boolean;
  icon: string;
  onDragEnd?: DragEventHandler<HTMLElement>;
  onDragOver?: DragEventHandler<HTMLElement>;
  onDragStart?: DragEventHandler<HTMLElement>;
  onDrop?: DragEventHandler<HTMLElement>;
  onToggle: () => void;
  title: string;
}

export function AccordionSection({
  active,
  children,
  dragActive = false,
  draggable = false,
  icon,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onToggle,
  title
}: AccordionSectionProps) {
  return (
    <section
      className={cx(
        "overflow-hidden rounded-[1.5rem] border transition",
        draggable && "cursor-grab",
        dragActive && "border-primary/30 bg-primary-fixed/50 opacity-80",
        active
          ? "border-primary/20 bg-surface-container-lowest shadow-tactile-sm"
          : "border-outline-variant/20 bg-surface-container-lowest"
      )}
      draggable={draggable}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cx(
          "flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition",
          active ? "bg-primary-fixed/70" : "hover:bg-white/60"
        )}
        aria-expanded={active}
      >
        <span className="flex items-center gap-4">
          <span
            className={cx(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              active ? "bg-white shadow-tactile-sm" : "bg-surface-container-highest"
            )}
          >
            <span className="material-symbols-outlined text-primary">{icon}</span>
          </span>
          <span className="font-headline text-lg font-bold text-on-surface">{title}</span>
        </span>
        <span className="flex items-center gap-2">
          {draggable ? (
            <span className="material-symbols-outlined text-lg text-on-surface-variant" aria-hidden="true">
              drag_indicator
            </span>
          ) : null}
          <span className={cx("material-symbols-outlined text-xl transition", active ? "text-primary" : "text-on-surface-variant")}>
            {active ? "expand_less" : "expand_more"}
          </span>
        </span>
      </button>
      {active ? (
        <div className="border-t border-outline-variant/15 px-6 pb-6 pt-6">
          <div className="workspace-scroll max-h-[52vh] overflow-y-auto pr-1">{children}</div>
        </div>
      ) : null}
    </section>
  );
}

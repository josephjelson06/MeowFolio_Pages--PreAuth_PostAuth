import { Link } from "react-router-dom";
import { getTemplateDefinition, type TemplateDefinition } from "../../data/templates";
import type { RenderTemplateId } from "../../types/resume";
import { cx } from "../../lib/cx";
import { Button } from "./Button";
import { Chip } from "./Chip";

interface TemplateCardProps {
  actionLabel?: string;
  className?: string;
  compact?: boolean;
  onSelect?: (templateId: RenderTemplateId) => void;
  selected?: boolean;
  template: RenderTemplateId | TemplateDefinition;
  to?: string;
}

function PreviewFrame({ compact = false, template }: { compact?: boolean; template: TemplateDefinition }) {
  const previewToneClassName = "bg-primary-fixed/70";
  const headerClassName = template.headerLayout === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={cx("resume-paper rounded-[1.1rem] p-4", compact && "p-3")}>
      <div className={cx("rounded-[0.95rem] bg-white shadow-ambient", compact ? "p-3" : "p-4")}>
        <div className={cx("grid grid-cols-[1fr_1.15fr_1fr] items-start gap-3", headerClassName)}>
          <div className="space-y-2">
            <div className="h-2 w-20 rounded-full bg-outline-variant/40" />
            <div className="h-2 w-24 rounded-full bg-outline-variant/40" />
            <div className="h-2 w-28 rounded-full bg-outline-variant/40" />
          </div>
          <div className={cx("space-y-2", template.headerLayout === "center" && "mx-auto w-full max-w-[9rem]")}>
            <div className={cx(compact ? "h-2.5" : "h-3", "mx-auto rounded-full bg-primary/80 w-32")} />
            <div className="mx-auto h-2 w-24 rounded-full bg-outline-variant/50" />
          </div>
          <div className="space-y-2 justify-self-end">
            <div className="ml-auto h-2 w-28 rounded-full bg-outline-variant/40" />
            <div className="ml-auto h-2 w-24 rounded-full bg-outline-variant/40" />
          </div>
        </div>

        <div className="mt-3 h-px w-full bg-primary/40" />

        <div className={cx(compact ? "mt-3 gap-3" : "mt-4 gap-4", "grid grid-cols-1")}>
          <div className="space-y-2">
            <div className="space-y-1.5">
              <div className="h-2 w-16 rounded-full bg-primary/65" />
              <div className="h-2 w-full rounded-full bg-outline-variant/30" />
              <div className="h-2 w-11/12 rounded-full bg-outline-variant/30" />
            </div>
            <div className={cx(compact ? "pt-1" : "pt-2", "space-y-2")}>
              <div className="h-2 w-20 rounded-full bg-primary/65" />
              <div className={cx("h-8 rounded-xl", previewToneClassName)} />
              <div className="h-2 w-5/6 rounded-full bg-outline-variant/30" />
              <div className="h-2 w-4/5 rounded-full bg-outline-variant/30" />
            </div>
            <div className={cx(compact ? "pt-1" : "pt-2", "space-y-2")}>
              <div className="h-2 w-20 rounded-full bg-primary/65" />
              <div className="h-2 w-full rounded-full bg-outline-variant/30" />
              <div className="h-2 w-10/12 rounded-full bg-outline-variant/30" />
              <div className="h-2 w-9/12 rounded-full bg-outline-variant/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TemplateCard({
  actionLabel = "Use template",
  className,
  compact = false,
  onSelect,
  selected = false,
  template,
  to
}: TemplateCardProps) {
  const definition = typeof template === "string" ? getTemplateDefinition(template) : template;
  const content = (
    <>
      <div className="relative">
        <Chip className="absolute -right-2 -top-3 z-10" tone={definition.badgeTone}>
          {definition.badge}
        </Chip>
        <PreviewFrame compact={compact} template={definition} />
      </div>

      <div className={cx(compact ? "mt-4" : "mt-6")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className={cx("font-headline font-extrabold text-on-surface", compact ? "text-xl" : "text-2xl")}>
              {definition.label}
            </h3>
            <p
              className={cx(
                "mt-2 text-on-surface-variant",
                compact ? "max-h-10 overflow-hidden text-xs leading-5" : "text-sm leading-6"
              )}
            >
              {definition.description}
            </p>
          </div>
          {selected ? <Chip tone="mint">Selected</Chip> : null}
        </div>

        <div className={cx(compact ? "mt-3" : "mt-4", "flex flex-wrap gap-2")}>
          <Chip tone="soft">{compact ? definition.badge : definition.bestFor}</Chip>
          <Chip tone={definition.badgeTone}>{definition.density}</Chip>
        </div>
      </div>
    </>
  );

  return (
    <div
      className={cx(
        compact
          ? "rounded-[1.5rem] bg-white p-4 card-border shadow-tactile-sm transition-transform hover:-translate-y-0.5"
          : "rounded-[1.75rem] bg-white p-5 card-border shadow-tactile transition-transform hover:-translate-y-1",
        selected && "ring-4 ring-primary-fixed/80",
        className
      )}
    >
      {to ? <Link to={to}>{content}</Link> : content}

      {!to && onSelect ? (
        <div className={cx(compact ? "mt-4" : "mt-6")}>
          <Button
            icon={selected ? "check_circle" : "palette"}
            size={compact ? "sm" : "md"}
            variant={selected ? "secondary" : "primary"}
            onClick={() => onSelect(definition.id)}
          >
            {selected ? "Using This Template" : actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

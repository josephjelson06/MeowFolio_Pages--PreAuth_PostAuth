import { Link } from "react-router-dom";
import { getTemplateDefinition, type TemplateDefinition } from "../../data/templates";
import type { RenderTemplateId } from "../../types/resume";
import { cx } from "../../lib/cx";
import { Button } from "./Button";
import { Chip } from "./Chip";

interface TemplateCardProps {
  actionLabel?: string;
  className?: string;
  onSelect?: (templateId: RenderTemplateId) => void;
  selected?: boolean;
  template: RenderTemplateId | TemplateDefinition;
  to?: string;
}

function PreviewFrame({ template }: { template: TemplateDefinition }) {
  const previewToneClassName =
    template.id === "compact"
      ? "bg-secondary-fixed/70"
      : template.id === "editorial"
        ? "bg-tertiary-fixed/70"
        : "bg-primary-fixed/70";

  const headerClassName = template.headerLayout === "center" ? "items-center text-center" : "items-start text-left";
  const bodyGridClassName =
    template.id === "compact" ? "grid-cols-[1.35fr_0.65fr]" : template.id === "editorial" ? "grid-cols-1" : "grid-cols-[1.1fr_0.9fr]";

  return (
    <div className="resume-paper rounded-[1.1rem] p-4">
      <div className="rounded-[0.95rem] bg-white p-4 shadow-ambient">
        <div className={cx("flex gap-3", headerClassName)}>
          <div className={cx("space-y-2", template.headerLayout === "center" && "mx-auto")}>
            <div className={cx("h-3 rounded-full bg-primary/80", template.id === "compact" ? "w-24" : "w-32")} />
            <div className={cx("h-2 rounded-full bg-outline-variant/50", template.id === "editorial" ? "w-28" : "w-20")} />
          </div>
        </div>

        <div className={cx("mt-4 grid gap-4", bodyGridClassName)}>
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-outline-variant/30" />
            <div className="h-2 w-11/12 rounded-full bg-outline-variant/30" />
            <div className="h-2 w-4/5 rounded-full bg-outline-variant/30" />
            <div className="pt-3 space-y-2">
              <div className={cx("h-8 rounded-xl", previewToneClassName)} />
              <div className="h-2 w-5/6 rounded-full bg-outline-variant/30" />
              <div className="h-2 w-4/5 rounded-full bg-outline-variant/30" />
            </div>
          </div>

          {template.id === "editorial" ? null : (
            <div className="rounded-[0.9rem] bg-surface-container-low p-3">
              <div className="h-2 w-12 rounded-full bg-outline-variant/30" />
              <div className="mt-3 space-y-2">
                <div className="h-8 rounded-lg bg-white" />
                <div className="h-8 rounded-lg bg-white/80" />
                <div className="h-8 rounded-lg bg-white/70" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TemplateCard({
  actionLabel = "Use template",
  className,
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
        <PreviewFrame template={definition} />
      </div>

      <div className="mt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-headline text-2xl font-extrabold text-on-surface">{definition.label}</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{definition.description}</p>
          </div>
          {selected ? <Chip tone="mint">Selected</Chip> : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Chip tone="soft">{definition.bestFor}</Chip>
          <Chip tone={definition.badgeTone}>{definition.density}</Chip>
        </div>
      </div>
    </>
  );

  return (
    <div
      className={cx(
        "rounded-[1.75rem] bg-white p-5 card-border shadow-tactile transition-transform hover:-translate-y-1",
        selected && "ring-4 ring-primary-fixed/80",
        className
      )}
    >
      {to ? <Link to={to}>{content}</Link> : content}

      {!to && onSelect ? (
        <div className="mt-6">
          <Button
            icon={selected ? "check_circle" : "palette"}
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

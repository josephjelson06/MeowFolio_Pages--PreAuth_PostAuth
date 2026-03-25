import { PublicLayout } from "../../components/layout/PublicLayout";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { TemplateCard } from "../../components/ui/TemplateCard";
import { templateCatalog } from "../../data/templates";

export function TemplatesPage() {
  return (
    <PublicLayout>
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <Chip tone="mint">Template selection</Chip>
          <h1 className="mt-6 font-headline text-5xl font-extrabold tracking-[-0.03em] text-on-surface md:text-7xl">
            Pick the resume vibe first.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-9 text-on-surface-variant">
            These are the static template surfaces that lead into the editor. Each one keeps the same canonical schema
            underneath while changing the presentation style.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
          {templateCatalog.map((template, index) => (
            <TemplateCard
              key={template.id}
              actionLabel="Open in editor"
              className={index === 1 ? "md:-translate-y-6" : ""}
              template={template}
              to={`/editor?tab=templates&template=${template.id}`}
            />
          ))}
        </div>
      </section>

      <section className="border-y-2 border-charcoal bg-white/40 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="How to use this page"
            title="Choose the structure that matches the application."
            description="The template page is intentionally simple: browse, compare, then jump into the editor with a clearer sense of how the resume should feel."
          />
          <div className="mt-10 flex flex-wrap gap-4">
            <Button to="/choose-path" size="lg" variant="surface" icon="west">
              Back to choose path
            </Button>
            <Button to="/editor?tab=templates" size="lg" icon="arrow_forward">
              Open template tab
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

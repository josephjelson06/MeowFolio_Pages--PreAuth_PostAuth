import { PublicLayout } from "../../components/layout/PublicLayout";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { SectionHeading } from "../../components/ui/SectionHeading";

const paths = [
  {
    copy: "Bring an existing resume into the editor, then clean it up, strengthen bullets, and move toward a better TeX-backed output.",
    cta: "Upload and refine",
    icon: "upload_file",
    title: "Start from an existing resume",
    to: "/editor"
  },
  {
    copy: "Begin with an empty workspace, choose a template, and build your resume from the canonical schema step by step.",
    cta: "Create new resume",
    icon: "edit_square",
    title: "Start from scratch",
    to: "/editor"
  }
] as const;

export function ChoosePathPage() {
  return (
    <PublicLayout>
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <Chip tone="lavender">Choose your path</Chip>
          <h1 className="mt-6 font-headline text-5xl font-extrabold tracking-[-0.03em] text-on-surface md:text-7xl">
            Start the resume your way.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-9 text-on-surface-variant">
            This page keeps the first decision simple: bring a draft you already have, or open a new resume workspace
            and start fresh.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          {paths.map((path, index) => (
            <Card key={path.title} className={index === 0 ? "rounded-[2rem] p-8 shadow-tactile-lg" : "rounded-[2rem] p-8"}>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low card-border">
                <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>
                  {path.icon}
                </span>
              </div>
              <h2 className="mt-8 font-headline text-3xl font-extrabold text-on-surface">{path.title}</h2>
              <p className="mt-4 text-lg leading-8 text-on-surface-variant">{path.copy}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button to={path.to} size="lg" icon="arrow_forward">
                  {path.cta}
                </Button>
                <Button to="/templates" size="lg" variant="surface" icon="palette">
                  Browse templates
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y-2 border-charcoal bg-white/40 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Why this page exists"
            title="Two clean starting points are easier than one overloaded first step."
            description="The choice page keeps the public product flow understandable before someone lands in the deeper editor workspace."
          />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Card className="rounded-[1.5rem] p-8">
              <h3 className="font-headline text-2xl font-extrabold text-on-surface">Upload first</h3>
              <p className="mt-4 text-base leading-7 text-on-surface-variant">Best when you already have material and want the editor to become a cleanup and refinement tool.</p>
            </Card>
            <Card className="rounded-[1.5rem] p-8">
              <h3 className="font-headline text-2xl font-extrabold text-on-surface">Build new</h3>
              <p className="mt-4 text-base leading-7 text-on-surface-variant">Best when you want the structure, templates, and guidance to shape the resume from the beginning.</p>
            </Card>
            <Card className="rounded-[1.5rem] p-8">
              <h3 className="font-headline text-2xl font-extrabold text-on-surface">Template first</h3>
              <p className="mt-4 text-base leading-7 text-on-surface-variant">Best when seeing the visual options helps you decide what kind of application style you want to lead with.</p>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

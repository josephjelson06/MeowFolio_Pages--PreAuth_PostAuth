import { Link } from "react-router-dom";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { learningChapters } from "../../data/learning";

export function LearnPage() {
  return (
    <PublicLayout>
      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <Chip tone="lavender">Mochii&apos;s Resume School</Chip>
            <div className="space-y-5">
              <h1 className="font-headline text-5xl font-extrabold leading-[1.06] tracking-[-0.03em] text-on-surface md:text-7xl">
                Learn the thinking
                <br />
                behind a stronger resume.
              </h1>
              <p className="max-w-2xl text-xl leading-9 text-on-surface-variant">
                This is the extra learning layer of the product: short chapters that explain layout, wording, ATS
                structure, and application strategy in a friendlier voice.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Chip tone="mint">7 chapters</Chip>
              <Chip tone="soft">Resume writing fundamentals</Chip>
              <Chip tone="coral">ATS + workflow focused</Chip>
            </div>
          </div>

          <Card className="rounded-[1.75rem] p-8 shadow-tactile-lg">
            <p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-primary">Course snapshot</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {learningChapters.slice(0, 4).map((chapter) => (
                <div key={chapter.id} className="rounded-[1.25rem] bg-surface-container-low p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="material-symbols-outlined text-coral">{chapter.icon}</span>
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">{chapter.duration}</span>
                  </div>
                  <h2 className="mt-3 font-headline text-xl font-bold text-on-surface">{chapter.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{chapter.focus}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="border-y-2 border-charcoal bg-white/40 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Curriculum"
            title="The learning track"
            description="Each chapter keeps the idea small and practical so users can understand why the tool is nudging them in certain directions."
          />
          <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {learningChapters.map((chapter, index) => (
              <Card key={chapter.id} className="rounded-[1.5rem] p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-low card-border">
                    <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>
                      {chapter.icon}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-headline text-4xl font-black text-outline-variant/35">{String(index + 1).padStart(2, "0")}</p>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">{chapter.duration}</p>
                  </div>
                </div>
                <h3 className="mt-6 font-headline text-2xl font-extrabold text-on-surface">{chapter.title}</h3>
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary">{chapter.focus}</p>
                <p className="mt-4 text-base leading-7 text-on-surface-variant">{chapter.summary}</p>
                <Link to={`/learn/${chapter.id}`} className="mt-6 inline-flex items-center gap-2 font-label text-sm font-bold text-coral no-underline">
                  Open chapter
                  <span className="material-symbols-outlined text-sm">south_east</span>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl space-y-8">
          <SectionHeading
            eyebrow="Lessons"
            title="Short notes for each chapter"
            description="These are not full textbook lessons. They are fast, product-adjacent guides that give context to the structure and scoring built into the app."
          />
          <div className="space-y-6">
            {learningChapters.map((chapter) => (
              <Card key={chapter.id} className="rounded-[1.5rem] p-8">
                <div id={chapter.id} className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <Chip tone="soft">{chapter.duration}</Chip>
                      <Chip tone="lavender">{chapter.focus}</Chip>
                    </div>
                    <h3 className="mt-5 font-headline text-3xl font-extrabold text-on-surface">{chapter.title}</h3>
                    <p className="mt-4 text-lg leading-8 text-on-surface-variant">{chapter.summary}</p>
                    <p className="mt-4 text-base leading-7 text-on-surface">
                      <span className="font-semibold text-primary">Key takeaway:</span> {chapter.takeaway}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-surface-container-low p-6 lg:w-[280px]">
                    <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Use this in product</p>
                    <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                      Use the chapter page to go deeper, then move into choose-path or templates once you know how you
                      want to start.
                    </p>
                    <div className="mt-5">
                      <Button to={`/learn/${chapter.id}`} variant="surface" size="sm" icon="menu_book">
                        Read chapter
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low px-6 py-24">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-10 text-center card-border shadow-tactile lg:p-14">
          <SectionHeading
            eyebrow="Next Step"
            title="Learn it, then apply it."
            description="The point of the learning pages is to make the next step clearer before you enter the deeper workspace."
          />
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button to="/choose-path" size="lg" icon="fork_right">
              Choose your path
            </Button>
            <Button to="/templates" size="lg" variant="surface" icon="palette">
              Browse templates
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

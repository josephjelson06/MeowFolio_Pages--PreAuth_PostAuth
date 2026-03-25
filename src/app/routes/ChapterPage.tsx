import { useParams } from "react-router-dom";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { NotFoundPage } from "./NotFoundPage";
import { getLearningChapterById, learningChapters } from "../../data/learning";

const accentToneByOrder = ["coral", "lavender", "mint"] as const;

export function ChapterPage() {
  const { chapterId = "" } = useParams();
  const chapter = getLearningChapterById(chapterId);

  if (!chapter) {
    return <NotFoundPage />;
  }

  const chapterIndex = learningChapters.findIndex((item) => item.id === chapter.id);
  const previousChapter = chapterIndex > 0 ? learningChapters[chapterIndex - 1] : null;
  const nextChapter = chapterIndex < learningChapters.length - 1 ? learningChapters[chapterIndex + 1] : null;
  const accentTone = accentToneByOrder[(chapter.order - 1) % accentToneByOrder.length];

  return (
    <PublicLayout>
      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <div className="flex flex-wrap gap-3">
              <Chip tone={accentTone}>Chapter {String(chapter.order).padStart(2, "0")}</Chip>
              <Chip tone="soft">{chapter.duration}</Chip>
              <Chip tone="mint">{chapter.focus}</Chip>
            </div>
            <div className="space-y-5">
              <h1 className="font-headline text-5xl font-extrabold leading-[1.04] tracking-[-0.03em] text-on-surface md:text-7xl">
                {chapter.heroTitle}
              </h1>
              <p className="max-w-2xl text-xl leading-9 text-on-surface-variant">{chapter.summary}</p>
            </div>
            <div className="rounded-[1.5rem] bg-primary-fixed p-6 card-border">
              <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Mochii note</p>
              <p className="mt-3 text-lg leading-8 text-on-primary-fixed-variant">{chapter.tip}</p>
            </div>
          </div>

          <Card className="rounded-[2rem] p-5 shadow-tactile-lg">
            <div className="rounded-[1.5rem] bg-surface-container-low p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Chapter takeaway</p>
                  <h2 className="mt-3 font-headline text-3xl font-extrabold text-on-surface">{chapter.title}</h2>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white card-border">
                  <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>
                    {chapter.icon}
                  </span>
                </div>
              </div>
              <p className="mt-6 text-lg leading-8 text-on-surface-variant">{chapter.takeaway}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button to="/choose-path" icon="arrow_forward">
                  Start your resume
                </Button>
                <Button to="/learn" variant="surface" icon="menu_book">
                  Back to learn hub
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="border-y-2 border-charcoal bg-white/40 px-6 py-24">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {chapter.sections.map((section) => (
            <Card key={section.title} className="rounded-[1.5rem] p-8">
              <h2 className="font-headline text-2xl font-extrabold text-on-surface">{section.title}</h2>
              <p className="mt-4 text-base leading-7 text-on-surface-variant">{section.copy}</p>
              {section.bullets ? (
                <ul className="mt-5 space-y-3 text-sm leading-6 text-on-surface-variant">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3">
                      <span className="material-symbols-outlined mt-0.5 text-base text-primary">check_circle</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          ))}
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-10 card-border shadow-tactile lg:p-14">
          <div className="flex flex-wrap items-center gap-3">
            <Chip tone="lavender">Mochii challenge</Chip>
            <Chip tone="soft">{chapter.focus}</Chip>
          </div>
          <h2 className="mt-5 font-headline text-4xl font-extrabold text-on-surface">{chapter.challenge.title}</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-on-surface-variant">{chapter.challenge.copy}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {chapter.challenge.prompts.map((prompt, index) => (
              <div key={prompt} className="rounded-[1.5rem] bg-surface-container-low p-6">
                <p className="font-headline text-3xl font-black text-outline-variant/50">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-3 text-sm leading-6 text-on-surface">{prompt}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 border-t border-outline-variant/20 pt-10 md:flex-row md:items-center md:justify-between">
          <div>
            {previousChapter ? (
              <Button to={`/learn/${previousChapter.id}`} variant="surface" icon="west">
                {previousChapter.title}
              </Button>
            ) : (
              <Button to="/learn" variant="surface" icon="west">
                Learn hub
              </Button>
            )}
          </div>
          <div>
            {nextChapter ? (
              <Button to={`/learn/${nextChapter.id}`} icon="east">
                {nextChapter.title}
              </Button>
            ) : (
              <Button to="/choose-path" icon="east">
                Start building
              </Button>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

import { PublicLayout } from "../../components/layout/PublicLayout";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";

const features = [
  {
    title: "Build from scratch",
    description: "Guided resume UI with expressive tactile cards and big editorial hierarchy.",
    icon: "edit_square",
    tone: "bg-coral/15 text-coral"
  },
  {
    title: "Refine the structure",
    description: "Mock flows are enough to preview the shell without carrying old behavior into React.",
    icon: "category",
    tone: "bg-mint/20 text-tertiary"
  },
  {
    title: "Review the workspaces",
    description: "The editor, ATS, and JD screens stay split and visually productive.",
    icon: "analytics",
    tone: "bg-lavender/25 text-secondary"
  }
] as const;

const templates = [
  { title: "The Minimalist", badge: "Mint", badgeTone: "mint" as const },
  { title: "The Compact", badge: "Most Popular", badgeTone: "coral" as const },
  { title: "The Two-Column", badge: "Lavender", badgeTone: "lavender" as const }
] as const;

export function LandingPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden px-6 pb-28 pt-20">
        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-fixed/50 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div className="relative z-10 space-y-8">
            <Chip tone="lavender">Free forever. No watermarks.</Chip>
            <div className="space-y-6">
              <h1 className="font-headline text-6xl font-extrabold leading-[1.04] tracking-[-0.03em] text-on-surface md:text-7xl">
                Build resumes that <span className="text-coral underline decoration-4 underline-offset-8">actually</span>{" "}
                get read.
              </h1>
              <p className="max-w-xl text-xl font-medium leading-9 text-on-surface-variant">
                The React rebuild keeps the playful editorial shell, the tactile cards, and the bold page rhythm while
                dropping the legacy static-site behavior.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button to="/dashboard" size="lg" icon="arrow_forward">
                Explore dashboard
              </Button>
              <Button to="/editor" size="lg" variant="surface">
                Preview editor
              </Button>
            </div>
          </div>

          <div className="relative z-10">
            <div className="tactile-card rotate-2 rounded-[1.75rem] bg-white p-5 shadow-tactile-lg">
              <div className="resume-paper rounded-[1.25rem] p-6">
                <div className="space-y-4 rounded-[1.1rem] bg-white p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="h-3 w-40 rounded-full bg-primary/80" />
                      <div className="mt-3 h-2 w-28 rounded-full bg-outline-variant/60" />
                    </div>
                    <div className="rounded-full bg-tertiary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-tertiary-fixed-variant">
                      ATS ready
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-outline-variant/30" />
                    <div className="h-2 w-11/12 rounded-full bg-outline-variant/30" />
                    <div className="h-2 w-4/5 rounded-full bg-outline-variant/30" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
                    <div className="space-y-2">
                      <div className="h-2 w-full rounded-full bg-outline-variant/25" />
                      <div className="h-2 w-5/6 rounded-full bg-outline-variant/25" />
                      <div className="h-2 w-4/5 rounded-full bg-outline-variant/25" />
                      <div className="h-2 w-3/4 rounded-full bg-outline-variant/25" />
                    </div>
                    <div className="rounded-[1rem] bg-surface-container-low p-4">
                      <div className="h-2 w-16 rounded-full bg-outline-variant/30" />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-primary-fixed px-3 py-1 text-[10px] font-bold">Figma</span>
                        <span className="rounded-full bg-secondary-fixed px-3 py-1 text-[10px] font-bold">UX</span>
                        <span className="rounded-full bg-tertiary-fixed px-3 py-1 text-[10px] font-bold">Systems</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y-2 border-charcoal bg-white/50 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
              The rebuild keeps the best parts.
            </h2>
            <p className="max-w-lg text-base font-bold text-on-surface-variant">
              Landing and dashboard define the brand. Editor, ATS, and JD define the productive split-screen structure.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="rounded-[1.75rem] p-8">
                <div className={`mb-8 flex h-16 w-16 items-center justify-center rounded-2xl card-border ${feature.tone}`}>
                  <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
                </div>
                <h3 className="font-headline text-2xl font-extrabold text-on-surface">{feature.title}</h3>
                <p className="mt-4 leading-7 text-on-surface-variant">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="font-headline text-5xl font-extrabold tracking-tight text-on-surface">Pick your vibe.</h2>
            <p className="mt-4 text-lg font-semibold text-on-surface-variant">
              The React version keeps the card language while letting the palette evolve later.
            </p>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            {templates.map((template, index) => (
              <div key={template.title} className={index === 1 ? "md:-translate-y-6" : ""}>
                <div className="relative">
                  <Chip className="absolute -right-2 -top-3 z-10" tone={template.badgeTone}>
                    {template.badge}
                  </Chip>
                  <Card className="rounded-[1.75rem] p-4">
                    <div className="resume-paper rounded-[1.25rem] p-4">
                      <div className="h-full rounded-[1rem] bg-white p-4">
                        <div className="h-3 w-24 rounded-full bg-primary/70" />
                        <div className="mt-4 grid h-[18rem] gap-4 rounded-[1rem] bg-surface-container-low p-4">
                          <div className="space-y-2">
                            <div className="h-2 w-full rounded-full bg-outline-variant/30" />
                            <div className="h-2 w-5/6 rounded-full bg-outline-variant/30" />
                            <div className="h-2 w-4/5 rounded-full bg-outline-variant/30" />
                          </div>
                          <div className="space-y-2">
                            <div className="h-2 w-full rounded-full bg-outline-variant/30" />
                            <div className="h-2 w-11/12 rounded-full bg-outline-variant/30" />
                            <div className="h-2 w-3/4 rounded-full bg-outline-variant/30" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
                <h3 className="mt-8 text-center font-headline text-2xl font-extrabold text-on-surface">{template.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

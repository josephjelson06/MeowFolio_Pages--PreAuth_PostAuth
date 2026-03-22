import { Link } from "react-router-dom";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";

const storyCards = [
  {
    title: "Mochii starts the job search journey.",
    icon: "laptop_mac",
    shell: "bg-cream",
    iconTone: "text-coral"
  },
  {
    title: "Sent 47 resumes to top tech companies.",
    icon: "mail",
    shell: "bg-lavender/35",
    iconTone: "text-secondary"
  },
  {
    title: "47 rejections. Not enough experience in napping.",
    icon: "error",
    shell: "bg-cream",
    iconTone: "text-primary"
  },
  {
    title: "Discovers MeowFolio. A glimmer of hope.",
    icon: "pets",
    shell: "bg-coral/20",
    iconTone: "text-coral"
  },
  {
    title: "Builds a professional resume in 20 minutes.",
    icon: "bolt",
    shell: "bg-mint/35",
    iconTone: "text-tertiary"
  },
  {
    title: "Hired. Senior Treat Officer at Global Meow Inc.",
    icon: "celebration",
    shell: "bg-cream",
    iconTone: "text-secondary"
  }
] as const;

const features = [
  {
    title: "Build from Scratch",
    description: "A guided builder that keeps the editorial shell bold, playful, and actually useful.",
    icon: "edit_square",
    tone: "bg-coral/20 text-coral"
  },
  {
    title: "Upload & Refine",
    description: "The future structure is already ready for a refinement workflow, even though behavior is intentionally off for now.",
    icon: "upload_file",
    tone: "bg-mint/25 text-tertiary"
  },
  {
    title: "Match & Score",
    description: "The ATS and JD workspaces remain split so the product still feels like a serious review tool.",
    icon: "analytics",
    tone: "bg-lavender/30 text-secondary"
  }
] as const;

const templates = [
  { title: "The Minimalist", badge: "Mint", badgeTone: "mint" as const },
  { title: "The Compact", badge: "Most popular", badgeTone: "coral" as const },
  { title: "The Two-Column", badge: "Lavender", badgeTone: "lavender" as const }
] as const;

const faqs = [
  {
    question: "Is it really free?",
    answer: "Yes. The rebuilt React version is UI-only for now, but the original spirit stays the same: low-friction, student-friendly, and not buried in paywall energy."
  },
  {
    question: "Can I create multiple resumes?",
    answer: "The present build uses mock content only, but the visual structure already supports multi-resume flows and derivative workspaces."
  },
  {
    question: "Why keep the split workspace?",
    answer: "Because the editor, ATS, and JD pages feel stronger as tool screens. The left-right structure is one of the most valuable things in the current product."
  },
  {
    question: "Will the palette stay exactly the same?",
    answer: "Not necessarily. The design system now preserves the layout language, tactile surfaces, and hierarchy even if the accent colors evolve later."
  }
] as const;

function LandingFooter() {
  return (
    <footer className="border-t-4 border-coral bg-charcoal px-6 pb-12 pt-24 text-white">
      <div className="mx-auto mb-20 grid max-w-7xl gap-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mb-8 flex items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-coral" style={{ fontVariationSettings: '"FILL" 1' }}>
              pets
            </span>
            <span className="font-headline text-2xl font-extrabold tracking-tight text-white">MeowFolio</span>
          </div>
          <p className="mb-8 max-w-sm text-lg font-medium leading-relaxed text-white/70">
            Helping you land your dream job with tactile layouts, editorial spacing, and a friendlier visual language
            than the usual sterile job-tech UI.
          </p>
          <div className="flex gap-4">
            <Link to="/" className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-charcoal bg-white/10 transition-all hover:bg-coral">
              <span className="material-symbols-outlined text-xl">share</span>
            </Link>
            <Link to="/dashboard" className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-charcoal bg-white/10 transition-all hover:bg-mint hover:text-charcoal">
              <span className="material-symbols-outlined text-xl">public</span>
            </Link>
          </div>
        </div>

        <div>
          <h4 className="mb-8 text-lg font-black uppercase tracking-[0.16em] text-white">Platform</h4>
          <ul className="space-y-4 font-bold text-white/60">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/editor">Editor</Link></li>
            <li><Link to="/ats">ATS Review</Link></li>
            <li><Link to="/jd">JD Review</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-8 text-lg font-black uppercase tracking-[0.16em] text-white">Support</h4>
          <ul className="space-y-4 font-bold text-white/60">
            <li><a href="#faq">FAQ</a></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/editor">Preview UI</Link></li>
            <li><Link to="/ats">Workspace Tour</Link></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 border-t border-white/10 pt-10 text-sm md:flex-row">
        <p className="font-bold text-white/40">© 2026 MeowFolio. UI migration in progress.</p>
        <div className="flex items-center gap-2 font-bold text-white/40">
          Made with
          <span className="material-symbols-outlined text-sm text-coral" style={{ fontVariationSettings: '"FILL" 1' }}>
            pets
          </span>
          for thoughtful job tools
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <PublicLayout footer={<LandingFooter />}>
      <section className="relative overflow-hidden px-6 pb-32 pt-24">
        <div className="absolute left-20 top-12 h-40 w-40 rounded-full bg-coral/20 blur-3xl" />
        <div className="absolute bottom-8 right-16 h-48 w-48 rounded-full bg-lavender/25 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <div className="relative z-10 space-y-8">
            <Chip tone="lavender">Free forever. No watermarks.</Chip>
            <div className="space-y-6">
              <h1 className="font-headline text-6xl font-extrabold leading-[1.08] tracking-[-0.03em] text-on-surface md:text-7xl">
                Build resumes that <span className="text-coral underline decoration-4 underline-offset-8">actually</span>{" "}
                get read.
              </h1>
              <p className="max-w-lg text-xl font-medium leading-9 text-on-surface-variant md:text-2xl">
                Even a cat got hired. You&apos;re next.
              </p>
              <p className="max-w-xl text-lg leading-8 text-on-surface-variant">
                The React version keeps the big editorial hero, tactile cards, and premium breathing room, while
                simplifying the product into the 5 screens that matter most right now.
              </p>
            </div>
            <div className="flex flex-col gap-6 pt-4 sm:flex-row">
              <Button to="/dashboard" size="lg" icon="arrow_forward" className="rounded-2xl px-10 py-5 text-lg">
                Build my resume
              </Button>
              <Button to="/editor" size="lg" variant="surface" className="rounded-2xl px-10 py-5 text-lg">
                Upload my resume
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-4 top-10 hidden h-[85%] w-[88%] rounded-[2rem] bg-primary-fixed/40 lg:block" />
            <div className="relative z-10 rotate-2 rounded-[1.5rem] bg-white p-4 card-border shadow-tactile-lg">
              <div className="resume-paper rounded-[1rem] p-5">
                <div className="rounded-[1rem] bg-white p-5">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <div className="h-4 w-44 rounded-full bg-primary/80" />
                      <div className="mt-3 h-2 w-28 rounded-full bg-outline-variant/60" />
                    </div>
                    <div className="rounded-full bg-tertiary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-tertiary-fixed-variant">
                      ATS ready
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-[1.35fr_0.65fr]">
                    <div className="space-y-3">
                      <div className="h-2 w-full rounded-full bg-outline-variant/30" />
                      <div className="h-2 w-11/12 rounded-full bg-outline-variant/30" />
                      <div className="h-2 w-4/5 rounded-full bg-outline-variant/30" />
                      <div className="mt-5 space-y-2">
                        <div className="h-2 w-full rounded-full bg-outline-variant/25" />
                        <div className="h-2 w-5/6 rounded-full bg-outline-variant/25" />
                        <div className="h-2 w-4/5 rounded-full bg-outline-variant/25" />
                        <div className="h-2 w-3/4 rounded-full bg-outline-variant/25" />
                      </div>
                    </div>

                    <div className="space-y-4 rounded-[1rem] bg-surface-container-low p-4">
                      <div className="h-2 w-16 rounded-full bg-outline-variant/30" />
                      <div className="space-y-2">
                        <div className="h-10 rounded-xl bg-primary-fixed/70" />
                        <div className="h-10 rounded-xl bg-secondary-fixed/70" />
                        <div className="h-10 rounded-xl bg-tertiary-fixed/70" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y-2 border-charcoal bg-white/50 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
              How one cat changed everything.
            </h2>
            <p className="flex items-center gap-2 font-bold text-on-surface-variant">
              Swipe through Mochii&apos;s journey <span className="material-symbols-outlined">east</span>
            </p>
          </div>
          <div className="hide-scrollbar flex snap-x snap-mandatory gap-8 overflow-x-auto pb-4">
            {storyCards.map((card, index) => (
              <div key={card.title} className="w-80 flex-none snap-center">
                <Card
                  className={
                    index === 3
                      ? "rounded-[1.5rem] border-coral p-6 shadow-tactile-lg"
                      : "rounded-[1.5rem] p-6"
                  }
                >
                  <div className={`mb-6 flex aspect-square items-center justify-center rounded-[1rem] card-border ${card.shell}`}>
                    <span className={`material-symbols-outlined text-8xl ${card.iconTone}`} style={{ fontVariationSettings: index === 3 ? '"FILL" 1' : undefined }}>
                      {card.icon}
                    </span>
                  </div>
                  <p className="text-lg font-bold leading-snug text-on-surface">{card.title}</p>
                </Card>
              </div>
            ))}
            <div className="w-80 flex-none snap-center rounded-[1.5rem] bg-coral p-8 text-center card-border shadow-tactile-lg">
              <h3 className="font-headline text-3xl font-extrabold text-white">Write your story</h3>
              <div className="mt-6">
                <Button to="/dashboard" variant="surface" size="lg">
                  Get Started Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-32">
        <div className="mx-auto mb-20 max-w-7xl text-center">
          <h2 className="font-headline text-5xl font-extrabold tracking-tight text-on-surface">Everything you need.</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Chip tone="lavender">Free forever</Chip>
            <Chip tone="mint">No watermarks</Chip>
            <Chip tone="coral">ATS-ready</Chip>
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="rounded-[1.5rem] p-10 transition-transform hover:-translate-y-1">
              <div className={`mb-8 flex h-16 w-16 items-center justify-center rounded-2xl card-border ${feature.tone}`}>
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: '"FILL" 1' }}>
                  {feature.icon}
                </span>
              </div>
              <h3 className="font-headline text-2xl font-extrabold text-on-surface">{feature.title}</h3>
              <p className="mt-4 font-medium leading-7 text-on-surface-variant">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y-2 border-charcoal bg-white/30 px-6 py-32">
        <div className="mx-auto mb-20 max-w-7xl text-center">
          <h2 className="font-headline text-5xl font-extrabold tracking-tight text-on-surface">Pick your vibe.</h2>
          <p className="mt-4 text-lg font-bold text-on-surface-variant">Curated layouts for every industry.</p>
        </div>
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-3">
          {templates.map((template, index) => (
            <div key={template.title} className={index === 1 ? "md:-translate-y-8" : ""}>
              <div className="relative">
                <Chip className="absolute -right-2 -top-3 z-20" tone={template.badgeTone}>
                  {template.badge}
                </Chip>
                <Card className={index === 1 ? "rounded-[1.5rem] p-3 shadow-tactile-lg" : "rounded-[1.5rem] p-3"}>
                  <div className="resume-paper rounded-[1rem] p-4">
                    <div className="h-full rounded-[0.9rem] bg-white p-4">
                      <div className="h-3 w-1/3 rounded-full bg-primary/70" />
                      <div className="mt-4 grid h-[18rem] gap-4 rounded-[1rem] bg-surface-container-low p-4">
                        <div className="space-y-2">
                          <div className="h-2 w-full rounded-full bg-outline-variant/30" />
                          <div className="h-2 w-5/6 rounded-full bg-outline-variant/30" />
                          <div className="h-2 w-4/5 rounded-full bg-outline-variant/30" />
                        </div>
                        <div className="grid gap-4 md:grid-cols-[1.1fr_0.7fr]">
                          <div className="space-y-2">
                            <div className="h-2 w-full rounded-full bg-outline-variant/30" />
                            <div className="h-2 w-11/12 rounded-full bg-outline-variant/30" />
                            <div className="h-2 w-3/4 rounded-full bg-outline-variant/30" />
                          </div>
                          <div className="rounded-[0.9rem] bg-white/90 p-3">
                            <div className="h-2 w-12 rounded-full bg-outline-variant/30" />
                            <div className="mt-3 h-8 rounded-lg bg-secondary-fixed/60" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              <h4 className="mt-8 text-center font-headline text-xl font-extrabold text-on-surface">{template.title}</h4>
            </div>
          ))}
        </div>
      </section>

      <div id="faq" />
      <section className="px-6 py-32">
        <div className="mx-auto grid max-w-7xl gap-20 lg:grid-cols-2">
          <div className="hidden lg:block">
            <div className="sticky top-32">
              <div className="relative rounded-[1.75rem] bg-white p-3 card-border shadow-tactile-lg">
                <div className="flex h-[500px] items-center justify-center rounded-[1.25rem] bg-surface-container-low">
                  <div className="flex h-60 w-60 items-center justify-center rounded-full bg-primary-fixed">
                    <span className="material-symbols-outlined text-[8rem] text-primary">psychology</span>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-6 -right-6 rounded-[1.25rem] bg-coral p-6 card-border shadow-tactile">
                  <p className="font-headline text-xl font-extrabold italic text-white">
                    &quot;Curious about something? I&apos;ve got the answers right here, human.&quot;
                  </p>
                  <p className="mt-2 text-sm font-black text-white">- Professor Mochii</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-12 font-headline text-5xl font-extrabold tracking-tight text-on-surface">Got questions?</h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <Card key={faq.question} className="rounded-[1.5rem] p-8">
                  <h3 className="text-xl font-black text-on-surface">{faq.question}</h3>
                  <p className="mt-4 font-medium leading-7 text-on-surface-variant">{faq.answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

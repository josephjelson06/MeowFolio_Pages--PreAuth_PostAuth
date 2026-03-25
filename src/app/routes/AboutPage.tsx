import { PublicLayout } from "../../components/layout/PublicLayout";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { SectionHeading } from "../../components/ui/SectionHeading";

const values = [
  {
    copy: "The product stays focused on low-friction resume building instead of pushing people through paywall anxiety.",
    icon: "redeem",
    title: "Always free"
  },
  {
    copy: "The writing guidance, structure, and workflows are built with early-career users in mind.",
    icon: "school",
    title: "Student-first"
  },
  {
    copy: "The product tries to make resumes clearer and stronger without encouraging fake experience or keyword spam.",
    icon: "verified_user",
    title: "Honest by default"
  }
] as const;

const principles = [
  {
    copy: "TeX gives us reliable typography, consistent margins, and fewer layout surprises than ad hoc document editing.",
    icon: "grid_view",
    title: "Pixel-stable output"
  },
  {
    copy: "The app keeps resume content in a canonical schema so analysis and PDF generation stay aligned.",
    icon: "search_check_2",
    title: "ATS-safe structure"
  },
  {
    copy: "The same resume flows through editor, ATS, and JD instead of fragmenting into separate tools.",
    icon: "language",
    title: "Shared product loop"
  }
] as const;

export function AboutPage() {
  return (
    <PublicLayout>
      <section className="overflow-hidden px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <Chip tone="lavender">The Story Behind MeowFolio</Chip>
            <div className="space-y-5">
              <h1 className="font-headline text-5xl font-extrabold leading-[1.05] tracking-[-0.03em] text-on-surface md:text-7xl">
                Built by a student.
                <br />
                For students.
              </h1>
              <p className="max-w-2xl text-xl leading-9 text-on-surface-variant">
                MeowFolio started from the same frustration most early-career people know well: good experience trapped
                inside bad tooling, ugly documents, and confusing workflows.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Chip tone="mint">TeX-first output</Chip>
              <Chip tone="coral">Student-friendly workflow</Chip>
              <Chip tone="soft">Shared editor + ATS + JD</Chip>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-6 h-40 w-40 rounded-full bg-coral/20 blur-3xl" />
            <Card className="relative rotate-2 rounded-[1.75rem] p-5 shadow-tactile-lg">
              <div className="rounded-[1.3rem] bg-surface-container-low p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-primary">Origin story</p>
                    <h2 className="mt-3 font-headline text-3xl font-extrabold text-on-surface">Mochii got tired of bad resumes.</h2>
                  </div>
                  <span className="material-symbols-outlined text-5xl text-coral" style={{ fontVariationSettings: '"FILL" 1' }}>
                    pets
                  </span>
                </div>
                <p className="mt-6 text-lg leading-8 text-on-surface-variant">
                  The original idea was simple: use the power of TeX without making users touch raw TeX, and wrap it in
                  a visual language that feels encouraging instead of sterile.
                </p>
                <div className="mt-8 rounded-[1.2rem] bg-white p-5 card-border">
                  <p className="font-headline text-xl font-bold italic text-on-surface">
                    "Resume building should not require a design degree or a broken Word doc."
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-y-2 border-charcoal bg-white/40 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Mission"
            title="Make powerful resume tooling feel approachable."
            description="The product tries to keep the serious parts serious and the intimidating parts softer. That means real structure, real output quality, and a friendlier surface."
          />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {values.map((value) => (
              <Card key={value.title} className="rounded-[1.5rem] p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed card-border">
                  <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>
                    {value.icon}
                  </span>
                </div>
                <h3 className="mt-6 font-headline text-2xl font-extrabold text-on-surface">{value.title}</h3>
                <p className="mt-4 text-base leading-7 text-on-surface-variant">{value.copy}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Why TeX"
            title="Serious output without making users think like typesetters."
            description="TeX stays under the hood. The user works with structured resume data, templates, and output controls instead of wrestling a document editor."
          />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {principles.map((item) => (
              <Card key={item.title} className="rounded-[1.5rem] p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-fixed card-border">
                  <span className="material-symbols-outlined text-2xl text-secondary" style={{ fontVariationSettings: '"FILL" 1' }}>
                    {item.icon}
                  </span>
                </div>
                <h3 className="mt-6 font-headline text-2xl font-extrabold text-on-surface">{item.title}</h3>
                <p className="mt-4 text-base leading-7 text-on-surface-variant">{item.copy}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low px-6 py-24">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-10 card-border shadow-tactile lg:p-14">
          <SectionHeading
            eyebrow="Builder"
            title="The human behind the cat"
            description="This project is being built with a student mindset: keep the product sharp, honest, and useful without overcomplicating the experience."
          />
          <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.5rem] bg-primary-fixed p-8 card-border">
              <p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-primary">Profile</p>
              <p className="mt-4 font-headline text-3xl font-extrabold text-on-primary-fixed-variant">Solo builder, product-first mindset.</p>
              <p className="mt-4 text-base leading-7 text-on-primary-fixed-variant/80">
                The product direction is intentionally pragmatic: build the real resume loop first, then grow the
                surrounding site and account features.
              </p>
            </div>
            <div className="space-y-5 text-lg leading-8 text-on-surface-variant">
              <p>
                MeowFolio is not trying to be every job tool at once. It is trying to make one important workflow feel
                coherent: write a better resume, render it well, and understand how it performs.
              </p>
              <p>
                That is why the editor, ATS, and JD tools stay connected through the same schema and workspace instead
                of turning into disconnected screens with different data shapes.
              </p>
              <div className="pt-4">
                <Button to="/choose-path" size="lg" icon="arrow_forward">
                  Start your resume
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

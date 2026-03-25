import { PublicLayout } from "../../components/layout/PublicLayout";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";

export function NotFoundPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden px-6 py-24 md:py-32">
        <div className="absolute left-12 top-16 h-40 w-40 rounded-full bg-coral/15 blur-3xl" />
        <div className="absolute bottom-12 right-12 h-56 w-56 rounded-full bg-lavender/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-8">
            <Chip tone="coral">404</Chip>
            <div className="space-y-5">
              <h1 className="font-headline text-5xl font-extrabold leading-[1.02] tracking-[-0.04em] text-on-surface md:text-7xl">
                Mochii looked everywhere.
              </h1>
              <p className="max-w-2xl text-xl leading-9 text-on-surface-variant">
                This page is not here, which means you have probably wandered off the planned product paths.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button to="/" size="lg" icon="home">
                Back home
              </Button>
              <Button to="/dashboard" size="lg" variant="surface" icon="dashboard">
                Open dashboard
              </Button>
            </div>
          </div>

          <Card className="relative rounded-[2rem] p-6 text-center shadow-tactile-lg">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="select-none font-headline text-[12rem] font-black text-outline-variant/25 md:text-[16rem]">404</span>
            </div>
            <div className="relative rounded-[1.6rem] bg-surface-container-low p-10">
              <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-primary-fixed">
                <span className="material-symbols-outlined text-[6rem] text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>
                  pets
                </span>
              </div>
              <p className="mt-6 font-headline text-3xl font-extrabold text-on-surface">Wrong doorway.</p>
              <p className="mt-4 text-base leading-7 text-on-surface-variant">
                Try the editor, learn pages, or dashboard instead. Those are the routes with actual product work behind
                them.
              </p>
              <div className="mt-8 rounded-[1.25rem] bg-white p-5 card-border">
                <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Quick links</p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <Button to="/editor" variant="ghost" size="sm">
                    Editor
                  </Button>
                  <Button to="/ats" variant="ghost" size="sm">
                    ATS
                  </Button>
                  <Button to="/jd" variant="ghost" size="sm">
                    JD
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}

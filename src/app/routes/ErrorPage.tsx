import { PublicLayout } from "../../components/layout/PublicLayout";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";

export function ErrorPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden px-6 py-24 md:py-32">
        <div className="absolute left-12 top-16 h-40 w-40 rounded-full bg-coral/15 blur-3xl" />
        <div className="absolute bottom-12 right-12 h-56 w-56 rounded-full bg-mint/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-8">
            <Chip tone="coral">Error page</Chip>
            <div className="space-y-5">
              <h1 className="font-headline text-5xl font-extrabold leading-[1.02] tracking-[-0.04em] text-on-surface md:text-7xl">
                Something went sideways.
              </h1>
              <p className="max-w-2xl text-xl leading-9 text-on-surface-variant">
                This is the general error surface for moments when the product hits a rough edge and needs to guide the
                user back to a stable starting point.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button to="/" size="lg" icon="home">
                Back home
              </Button>
              <Button to="/choose-path" size="lg" variant="surface" icon="fork_right">
                Choose a path
              </Button>
            </div>
          </div>

          <Card className="rounded-[2rem] p-6 shadow-tactile-lg">
            <div className="rounded-[1.6rem] bg-surface-container-low p-10 text-center">
              <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-secondary-fixed">
                <span className="material-symbols-outlined text-[6rem] text-secondary" style={{ fontVariationSettings: '"FILL" 1' }}>
                  error
                </span>
              </div>
              <h2 className="mt-6 font-headline text-3xl font-extrabold text-on-surface">Static recovery screen</h2>
              <p className="mt-4 text-base leading-7 text-on-surface-variant">
                Keep the message calm, keep the route obvious, and offer one or two clean next steps. That is all this
                page needs to do.
              </p>
            </div>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}

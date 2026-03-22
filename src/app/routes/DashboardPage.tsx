import { Link } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { MetricRing } from "../../components/ui/MetricRing";
import { StatCard } from "../../components/ui/StatCard";
import { activeResumes, dashboardMetrics, quickActions } from "../../data/dashboard";

export function DashboardPage() {
  const featuredResume = activeResumes[0];

  return (
    <AppLayout contentClassName="px-6 py-10 md:px-8 lg:px-16">
      <div className="w-full">
        <header className="mb-12">
          <p className="mb-2 font-label text-sm font-bold uppercase tracking-[0.24em] text-primary">Welcome back</p>
          <h1 className="font-headline text-4xl font-extrabold leading-tight text-on-surface md:text-5xl">
            Good morning,
            <br className="md:hidden" /> Alexander Thompson!
          </h1>
        </header>

        <section className="mb-12 grid gap-6 md:grid-cols-3">
          {dashboardMetrics.map((metric) => (
            <StatCard key={metric.label} {...metric} />
          ))}
        </section>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section>
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="font-headline text-2xl font-bold text-on-surface">Active Resumes</h2>
                <Link to="/editor" className="flex items-center gap-1 font-label text-sm font-bold text-primary">
                  View all
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="tactile-card group overflow-hidden rounded-[1.5rem] bg-white">
                  <div className="relative h-48 overflow-hidden bg-surface-container-highest">
                    <div className="soft-grid absolute inset-0 opacity-70" />
                    <div className="absolute inset-x-10 bottom-6 top-6 rounded-[1rem] bg-white/95 p-5 shadow-ambient">
                      <div className="h-3 w-1/2 rounded-full bg-primary/80" />
                      <div className="mt-3 h-2 w-1/3 rounded-full bg-outline-variant/60" />
                      <div className="mt-6 space-y-2">
                        <div className="h-2 w-full rounded-full bg-outline-variant/30" />
                        <div className="h-2 w-5/6 rounded-full bg-outline-variant/30" />
                        <div className="h-2 w-3/4 rounded-full bg-outline-variant/30" />
                      </div>
                    </div>
                    <div className="absolute right-4 top-4 rounded-full border border-charcoal bg-tertiary-fixed px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-on-tertiary-fixed">
                      Match {featuredResume.match}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 p-5">
                    <div>
                      <h3 className="font-headline text-lg font-bold text-on-surface">{featuredResume.title}</h3>
                      <p className="flex items-center gap-1 text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {featuredResume.subtitle}
                      </p>
                    </div>
                    <Link
                      to="/editor"
                      className="chunky-button block rounded-xl bg-primary py-3 text-center font-label text-sm font-bold text-on-primary"
                    >
                      Continue Editing
                    </Link>
                  </div>
                </div>

                <Link
                  to="/editor"
                  className="flex flex-col items-center justify-center gap-4 rounded-[1.5rem] border-2 border-dashed border-outline-variant bg-transparent p-8 transition-colors hover:bg-surface-container-low"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-outline-variant bg-surface-container transition-all hover:border-primary hover:bg-primary-fixed">
                    <span className="material-symbols-outlined text-3xl text-outline hover:text-primary">add</span>
                  </div>
                  <p className="font-label font-bold text-on-surface-variant">Create New Resume</p>
                </Link>
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[2rem] border-2 border-charcoal bg-surface-container-highest p-8">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-primary-container/15" />
              <div className="flex items-center gap-8">
                <div className="flex h-24 w-24 shrink-0 rotate-[-4deg] items-center justify-center overflow-hidden rounded-[1.25rem] border-2 border-charcoal bg-white p-2">
                  <div className="flex h-full w-full items-center justify-center rounded-[1rem] bg-primary-fixed">
                    <span className="material-symbols-outlined text-5xl text-primary">pets</span>
                  </div>
                </div>
                <div className="relative z-10 space-y-2">
                  <h3 className="font-headline text-xl font-extrabold text-on-surface">Mochii&apos;s Tip</h3>
                  <p className="leading-7 text-on-surface-variant">
                    Alexander, adding your GitHub link could boost your score by another{" "}
                    <span className="font-bold text-primary">8%</span>.
                  </p>
                  <button
                    type="button"
                    className="font-label text-sm font-bold text-primary underline decoration-2 underline-offset-4"
                  >
                    Add link now
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="mb-6 font-headline text-2xl font-bold text-on-surface">Quick Actions</h2>
              <div className="flex flex-col gap-4">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    to={action.to}
                    className="tactile-card flex w-full items-center gap-4 rounded-[1.25rem] bg-white p-4 text-left"
                  >
                    <div
                      className={
                        action.tone === "primary"
                          ? "flex h-12 w-12 items-center justify-center rounded-xl border-2 border-charcoal bg-primary-fixed text-primary"
                          : action.tone === "secondary"
                            ? "flex h-12 w-12 items-center justify-center rounded-xl border-2 border-charcoal bg-secondary-fixed text-secondary"
                            : "flex h-12 w-12 items-center justify-center rounded-xl border-2 border-charcoal bg-tertiary-fixed text-tertiary"
                      }
                    >
                      <span className="material-symbols-outlined">{action.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-label text-sm font-bold text-on-surface">{action.title}</p>
                      <p className="text-xs text-on-surface-variant">{action.subtitle}</p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="tactile-card rounded-[1.5rem] bg-surface-container-lowest p-6">
              <h3 className="mb-4 font-headline font-bold text-on-surface">Profile Completeness</h3>
              <div className="mb-6 flex items-center gap-4">
                <MetricRing accentColor="#9d4223" label="Complete" score={90} size={88} />
                <p className="text-xs leading-6 text-on-surface-variant">
                  Almost there. Your profile is highly visible, but there&apos;s still room to make it sharper.
                </p>
              </div>
              <ul className="space-y-3 text-xs">
                <li className="flex items-center gap-2 font-label text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm text-tertiary" style={{ fontVariationSettings: '"FILL" 1' }}>
                    check_circle
                  </span>
                  Contact information added
                </li>
                <li className="flex items-center gap-2 font-label text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm text-tertiary" style={{ fontVariationSettings: '"FILL" 1' }}>
                    check_circle
                  </span>
                  Work experience detailed
                </li>
                <li className="flex items-center gap-2 font-label text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm text-outline">circle</span>
                  Link social portfolios (GitHub / Dribbble)
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

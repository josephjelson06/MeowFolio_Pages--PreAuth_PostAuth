import { Link } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { Card } from "../../components/ui/Card";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { StatCard } from "../../components/ui/StatCard";
import { activeResumes, dashboardMetrics, quickActions } from "../../data/dashboard";

export function DashboardPage() {
  return (
    <AppLayout contentClassName="px-6 py-10">
      <div className="w-full">
        <SectionHeading
          eyebrow="Welcome back"
          title="Good morning, Alexander Thompson!"
          description="The dashboard becomes the second visual anchor of the React app, alongside landing."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {dashboardMetrics.map((metric) => (
            <StatCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="mt-10 grid gap-8 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-8">
            <Card className="rounded-[2rem] bg-surface-container-lowest p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="font-headline text-2xl font-extrabold text-on-surface">Active Resumes</h2>
                <Link to="/editor" className="font-label text-sm font-bold text-primary">
                  Open editor
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {activeResumes.map((resume) => (
                  <div key={resume.title} className="overflow-hidden rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-low">
                    <div className="soft-grid flex h-52 items-center justify-center bg-surface-container-high p-6">
                      <div className="resume-paper w-full max-w-[16rem] rounded-[1rem] bg-white p-4">
                        <div className="space-y-2">
                          <div className="h-3 w-1/2 rounded-full bg-primary/70" />
                          <div className="h-2 w-full rounded-full bg-outline-variant/30" />
                          <div className="h-2 w-5/6 rounded-full bg-outline-variant/30" />
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-headline text-lg font-bold text-on-surface">{resume.title}</h3>
                          <p className="text-sm text-on-surface-variant">{resume.subtitle}</p>
                        </div>
                        <span className="rounded-full bg-tertiary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-on-tertiary-fixed-variant">
                          Match {resume.match}
                        </span>
                      </div>
                      <Link to="/editor" className="chunky-button block rounded-full bg-primary px-6 py-3 text-center font-label text-sm font-bold text-on-primary">
                        Continue editing
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[2rem] bg-surface-container-high p-8">
              <div className="flex items-start gap-6">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.5rem] bg-white card-border">
                  <span className="material-symbols-outlined text-5xl text-primary">pets</span>
                </div>
                <div>
                  <h3 className="font-headline text-2xl font-extrabold text-on-surface">Mochii&apos;s Tip</h3>
                  <p className="mt-3 max-w-2xl leading-7 text-on-surface-variant">
                    This card is a good example of what the rebuild should preserve: soft layering, playful utility,
                    strong type hierarchy, and enough breathing room to feel curated.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="rounded-[2rem] bg-surface-container-lowest p-8">
            <h2 className="font-headline text-2xl font-extrabold text-on-surface">Quick Actions</h2>
            <div className="mt-6 space-y-4">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.to}
                  className="tactile-card flex items-center gap-4 rounded-[1.5rem] bg-white p-4"
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

            <div className="mt-8 rounded-[1.5rem] bg-surface-container-low p-6">
              <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-primary">Profile Completeness</p>
              <p className="mt-3 font-headline text-4xl font-extrabold text-on-surface">90%</p>
              <div className="mt-4 h-3 rounded-full bg-outline-variant/30">
                <div className="h-full w-[90%] rounded-full bg-primary" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

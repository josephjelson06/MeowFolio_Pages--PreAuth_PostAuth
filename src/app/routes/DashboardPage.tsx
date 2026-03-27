import { Link } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { ResumeGalleryCard } from "../../components/resume/ResumeGalleryCard";
import { MetricRing } from "../../components/ui/MetricRing";
import { StatCard } from "../../components/ui/StatCard";
import { createAnalysisResumeDeck } from "../../data/analysis-resumes";
import { quickActions } from "../../data/dashboard";
import { getTemplateDefinition } from "../../data/templates";
import { analyzeResumeAgainstJobDescription, analyzeResumeForAts } from "../../lib/analysis";
import { flattenSkills } from "../../lib/resume";
import { useWorkspace } from "../workspace/WorkspaceContext";

export function DashboardPage() {
  const { jobDescription, renderOptions, resume } = useWorkspace();
  const template = getTemplateDefinition(renderOptions.templateId);
  const atsAnalysis = analyzeResumeForAts(resume, renderOptions);
  const jdAnalysis = analyzeResumeAgainstJobDescription(resume, jobDescription);
  const resumeDeck = createAnalysisResumeDeck(resume).slice(0, 2);
  const skillsCount = flattenSkills(resume.skills).length;
  const filledSections = [
    resume.summary?.trim(),
    skillsCount > 0,
    resume.education.length > 0,
    resume.experience.length > 0,
    resume.projects.length > 0,
    resume.certifications.length > 0,
    resume.awards.length > 0,
    resume.leadership.length > 0,
    resume.extracurricular.length > 0
  ].filter(Boolean).length;

  const metrics = [
    {
      icon: "verified",
      label: "Average ATS Score",
      tone: "tertiary" as const,
      trend: "+5% this week",
      value: `${atsAnalysis.score}%`
    },
    {
      icon: "auto_fix_high",
      label: "Resume Strength",
      tone: "primary" as const,
      trend: "+2% this week",
      value: `${Math.max(85, filledSections * 10)}%`
    },
    {
      icon: "handshake",
      label: "JD Match Success",
      tone: "secondary" as const,
      trend: "-1% this week",
      value: `${jdAnalysis.score}%`
    }
  ];

  const profileCompleteness = Math.min(96, 42 + filledSections * 6);
  const primarySuggestion =
    atsAnalysis.issues[0]?.detail ||
    jdAnalysis.suggestions[0]?.detail ||
    "Adding one stronger quantified bullet can make this resume read as more credible to both ATS checks and humans.";

  return (
    <AppLayout contentClassName="px-6 py-10 md:px-8 lg:px-16">
      <div className="w-full">
        <header className="mb-12">
          <p className="mb-2 font-label text-sm font-bold uppercase tracking-[0.24em] text-primary">Welcome Back</p>
          <h1 className="font-headline text-4xl font-extrabold leading-tight text-on-surface md:text-5xl">
            Good morning,
            <br className="md:hidden" /> {resume.header.name?.trim() || "Alexander Thompson"}!
          </h1>
        </header>

        <section className="mb-12 grid gap-6 md:grid-cols-3">
          {metrics.map((metric) => (
            <StatCard key={metric.label} {...metric} />
          ))}
        </section>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-headline text-2xl font-bold text-on-surface">Active Resumes</h2>
                <Link to="/resumes" className="flex items-center gap-1 font-label text-sm font-bold text-primary">
                  View all
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {resumeDeck.map((item, index) => (
                  <ResumeGalleryCard
                    key={item.id}
                    resume={item.resume}
                    title={item.resume.header.title?.trim() || item.tag}
                    subtitle={index === 0 ? "Last edited 2 hours ago" : "Updated yesterday"}
                    badge={`MATCH ${index === 0 ? 94 : 88}%`}
                    badgeTone={index === 0 ? "mint" : item.accentTone}
                    to="/editor"
                  />
                ))}

                <Link
                  to="/choose-path"
                  className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-[1.75rem] border-2 border-dashed border-outline-variant bg-surface-container-low/30 p-8 text-center transition-colors hover:bg-surface-container-low"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-outline-variant bg-surface-container">
                    <span className="material-symbols-outlined text-3xl text-primary">add</span>
                  </div>
                  <p className="font-label font-bold text-on-surface-variant">Create New Resume</p>
                </Link>
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[2rem] border-2 border-charcoal bg-surface-container-highest p-8">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-primary-container/15" />
              <div className="flex items-center gap-8">
                <div className="flex h-24 w-24 shrink-0 rotate-[-4deg] items-center justify-center rounded-[1.5rem] border-2 border-charcoal bg-white p-2">
                  <div className="flex h-full w-full items-center justify-center rounded-[1rem] bg-primary-fixed">
                    <span className="material-symbols-outlined text-5xl text-primary">pets</span>
                  </div>
                </div>
                <div className="relative z-10 space-y-2">
                  <h3 className="font-headline text-xl font-extrabold text-on-surface">Mochii&apos;s Tip</h3>
                  <p className="leading-7 text-on-surface-variant">
                    {primarySuggestion}
                  </p>
                  <button type="button" className="font-label text-sm font-bold text-primary underline decoration-2 underline-offset-4">
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
                <MetricRing accentColor="var(--color-primary)" label="Ready" score={profileCompleteness} size={88} />
                <p className="text-xs leading-6 text-on-surface-variant">
                  Almost there. {template.label} is active, and your profile is visible enough for recruiters to get a strong first impression.
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
                  {resume.header.github?.trim() ? "Social portfolio connected" : "Link social portfolios (GitHub/Portfolio)"}
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

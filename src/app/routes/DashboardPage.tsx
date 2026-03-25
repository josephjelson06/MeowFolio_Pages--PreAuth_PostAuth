import { Link } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { MetricRing } from "../../components/ui/MetricRing";
import { StatCard } from "../../components/ui/StatCard";
import { getTemplateDefinition } from "../../data/templates";
import { quickActions } from "../../data/dashboard";
import { analyzeResumeAgainstJobDescription, analyzeResumeForAts } from "../../lib/analysis";
import { flattenSkills } from "../../lib/resume";
import { useWorkspace } from "../workspace/WorkspaceContext";

function getSectionCount() {
  return 9;
}

export function DashboardPage() {
  const { jobDescription, renderOptions, resume } = useWorkspace();
  const template = getTemplateDefinition(renderOptions.templateId);
  const atsAnalysis = analyzeResumeForAts(resume, renderOptions);
  const jdAnalysis = analyzeResumeAgainstJobDescription(resume, jobDescription);
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
      trend: atsAnalysis.rating,
      value: `${atsAnalysis.score}%`
    },
    {
      icon: "auto_fix_high",
      label: "Resume Strength",
      tone: "primary" as const,
      trend: template.label,
      value: `${filledSections}/${getSectionCount()}`
    },
    {
      icon: "match_word",
      label: "JD Match Success",
      tone: "secondary" as const,
      trend: jdAnalysis.summaryTitle,
      value: `${jdAnalysis.score}%`
    }
  ];
  const primarySuggestion =
    atsAnalysis.issues[0]?.detail ||
    jdAnalysis.suggestions[0]?.detail ||
    "Your workspace is in good shape. Keep refining quantified impact and role-specific wording.";
  const resumeTitle = resume.header.title?.trim() || "Untitled Resume";
  const resumeOwner = resume.header.name?.trim() || "Your Name";
  const updatedAt = new Date(resume.meta.updatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <AppLayout contentClassName="px-6 py-10 md:px-8 lg:px-16">
      <div className="w-full">
        <header className="mb-12">
          <p className="mb-2 font-label text-sm font-bold uppercase tracking-[0.24em] text-primary">Workspace dashboard</p>
          <h1 className="font-headline text-4xl font-extrabold leading-tight text-on-surface md:text-5xl">
            Current resume,
            <br className="md:hidden" /> real output, live checks.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-on-surface-variant">
            Everything below is driven by the shared workspace: your current resume, selected template, render settings, ATS score, and job-description match.
          </p>
        </header>

        <section className="mb-12 grid gap-6 md:grid-cols-3">
          {metrics.map((metric) => (
            <StatCard key={metric.label} {...metric} />
          ))}
        </section>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section className="tactile-card overflow-hidden rounded-[1.5rem] bg-white">
              <div className="relative h-52 overflow-hidden bg-surface-container-highest">
                <div className="soft-grid absolute inset-0 opacity-70" />
                <div className="absolute inset-x-10 bottom-6 top-6 rounded-[1rem] bg-white/95 p-5 shadow-ambient">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{resumeOwner}</p>
                      <h2 className="mt-2 font-headline text-2xl font-extrabold text-on-surface">{resumeTitle}</h2>
                      <p className="mt-2 text-sm text-on-surface-variant">Last updated {updatedAt}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <span className="rounded-full border border-charcoal bg-tertiary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-on-tertiary-fixed">
                        ATS {atsAnalysis.score}%
                      </span>
                      <span className="rounded-full border border-charcoal bg-secondary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-on-secondary-fixed">
                        {template.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface">
                          {resume.experience.length} experience
                        </span>
                        <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface">
                          {resume.projects.length} projects
                        </span>
                        <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface">
                          {skillsCount} skills
                        </span>
                      </div>
                      <p className="text-sm leading-7 text-on-surface-variant">
                        {template.description}
                      </p>
                    </div>

                    <div className="rounded-[1rem] bg-surface-container-low p-4">
                      <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Template fit</p>
                      <p className="mt-3 text-sm font-semibold text-on-surface">{template.bestFor}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          to="/editor"
                          className="chunky-button rounded-xl bg-primary px-4 py-3 text-center font-label text-sm font-bold text-on-primary"
                        >
                          Continue Editing
                        </Link>
                        <Link
                          to="/resumes"
                          className="rounded-xl border border-outline-variant/20 bg-white px-4 py-3 text-center font-label text-sm font-bold text-on-surface"
                        >
                          Open Resumes
                        </Link>
                        <Link
                          to="/editor?tab=templates"
                          className="rounded-xl border border-outline-variant/20 bg-white px-4 py-3 text-center font-label text-sm font-bold text-on-surface"
                        >
                          Change Template
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
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
                  <h3 className="font-headline text-xl font-extrabold text-on-surface">Mochii&apos;s Next Move</h3>
                  <p className="leading-7 text-on-surface-variant">{primarySuggestion}</p>
                  <p className="font-label text-sm font-bold text-primary">Current workspace is using the {template.label.toLowerCase()} template.</p>
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
              <h3 className="mb-4 font-headline font-bold text-on-surface">Workspace Readiness</h3>
              <div className="mb-6 flex items-center gap-4">
                <MetricRing accentColor="var(--color-primary)" label="Ready" score={atsAnalysis.score} size={88} />
                <p className="text-xs leading-6 text-on-surface-variant">
                  ATS readiness is based on the current content and render settings. JD alignment uses the same workspace resume and active job description.
                </p>
              </div>
              <ul className="space-y-3 text-xs">
                <li className="flex items-center gap-2 font-label text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm text-tertiary" style={{ fontVariationSettings: '"FILL" 1' }}>
                    check_circle
                  </span>
                  Shared workspace persistence is on
                </li>
                <li className="flex items-center gap-2 font-label text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm text-tertiary" style={{ fontVariationSettings: '"FILL" 1' }}>
                    check_circle
                  </span>
                  Selected template: {template.label}
                </li>
                <li className="flex items-center gap-2 font-label text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm text-outline">circle</span>
                  {jdAnalysis.missing > 0 ? `${jdAnalysis.missing} JD keywords still need work` : "JD keywords are in strong shape"}
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

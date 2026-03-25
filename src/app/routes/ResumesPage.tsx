import { Link } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { MetricRing } from "../../components/ui/MetricRing";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { getTemplateDefinition, templateCatalog } from "../../data/templates";
import { analyzeResumeAgainstJobDescription, analyzeResumeForAts } from "../../lib/analysis";
import { flattenSkills } from "../../lib/resume";
import { useWorkspace } from "../workspace/WorkspaceContext";

export function ResumesPage() {
  const { jobDescription, renderOptions, resume } = useWorkspace();
  const selectedTemplate = getTemplateDefinition(renderOptions.templateId);
  const ats = analyzeResumeForAts(resume, renderOptions);
  const jd = analyzeResumeAgainstJobDescription(resume, jobDescription);
  const skillsCount = flattenSkills(resume.skills).length;
  const sectionCount = [
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
  const updatedAt = new Date(resume.meta.updatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <AppLayout contentClassName="px-6 py-10 md:px-8 lg:px-16">
      <div className="w-full space-y-12">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="font-label text-sm font-bold uppercase tracking-[0.22em] text-primary">Resume library</p>
            <h1 className="font-headline text-4xl font-extrabold leading-tight text-on-surface md:text-5xl">
              Manage the resume
              <br className="md:hidden" /> surfaces around your workspace.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-on-surface-variant">
              This page centers the live workspace resume first, then offers template-driven starter paths. It is the
              product-facing "resume list" layer until multi-resume persistence arrives later.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button to="/editor" icon="edit_note">
              Open current resume
            </Button>
            <Button to="/editor?tab=templates" variant="surface" icon="dashboard">
              Browse templates
            </Button>
          </div>
        </header>

        <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-[1.75rem] p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Current workspace resume</p>
                <h2 className="mt-3 font-headline text-3xl font-extrabold text-on-surface">
                  {resume.header.title?.trim() || "Untitled Resume"}
                </h2>
                <p className="mt-2 text-base text-on-surface-variant">
                  {resume.header.name?.trim() || "No name set yet"} • updated {updatedAt}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip tone={selectedTemplate.badgeTone}>{selectedTemplate.label}</Chip>
                <Chip tone="mint">{ats.score}% ATS</Chip>
                <Chip tone="lavender">{jd.score}% JD</Chip>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-[1.25rem] bg-surface-container-low p-4">
                <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">Sections</p>
                <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">{sectionCount}/9</p>
              </div>
              <div className="rounded-[1.25rem] bg-surface-container-low p-4">
                <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">Experience</p>
                <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">{resume.experience.length}</p>
              </div>
              <div className="rounded-[1.25rem] bg-surface-container-low p-4">
                <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">Projects</p>
                <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">{resume.projects.length}</p>
              </div>
              <div className="rounded-[1.25rem] bg-surface-container-low p-4">
                <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">Skills</p>
                <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">{skillsCount}</p>
              </div>
            </div>

            <div className="mt-8 rounded-[1.5rem] bg-surface-container-low p-6">
              <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Status note</p>
              <p className="mt-3 text-base leading-7 text-on-surface-variant">
                Multi-resume persistence is still a later phase. For now this page is centered around the single shared
                workspace resume, plus starter directions for new variants.
              </p>
            </div>
          </Card>

          <Card className="rounded-[1.75rem] p-8">
            <SectionHeading
              eyebrow="Workspace score"
              title="Current readiness"
              description="These signals are derived from the same resume and render settings that drive the editor, ATS, and JD tools."
            />
            <div className="mt-8 flex items-center justify-center">
              <MetricRing accentColor="var(--color-primary)" label="ATS" score={ats.score} size={156} />
            </div>
            <div className="mt-8 space-y-4">
              <div className="rounded-[1.25rem] bg-surface-container-low p-4">
                <p className="font-semibold text-on-surface">Selected template</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{selectedTemplate.description}</p>
              </div>
              <div className="rounded-[1.25rem] bg-surface-container-low p-4">
                <p className="font-semibold text-on-surface">Top ATS signal</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  {ats.issues[0]?.detail ||
                    "The current resume is structurally healthy. Keep sharpening quantified impact and role-specific language."}
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <SectionHeading
            eyebrow="Starter directions"
            title="Begin a new version from a different template angle"
            description="These cards give the product a real resume-list feel now, while full multi-resume storage stays as a later backend phase."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {templateCatalog.map((template) => (
              <Card key={template.id} className="rounded-[1.5rem] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-headline text-2xl font-extrabold text-on-surface">{template.label}</h2>
                    <p className="mt-3 text-sm leading-6 text-on-surface-variant">{template.description}</p>
                  </div>
                  <Chip tone={template.badgeTone}>{template.badge}</Chip>
                </div>
                <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-primary">{template.bestFor}</p>
                <div className="mt-6">
                  <Button to={`/editor?tab=templates&template=${template.id}`} icon="arrow_forward">
                    Use {template.label}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-[1.5rem] p-8">
            <SectionHeading
              eyebrow="Analysis handoff"
              title="Jump from library to review"
              description="This keeps the resumes surface connected to the analysis tools instead of turning it into a dead holding page."
            />
            <div className="mt-6 flex flex-wrap gap-4">
              <Button to="/ats" icon="analytics">
                Open ATS scorer
              </Button>
              <Button to="/jd" variant="surface" icon="query_stats">
                Open JD analyzer
              </Button>
            </div>
          </Card>

          <Card className="rounded-[1.5rem] p-8">
            <SectionHeading
              eyebrow="Job match"
              title="Current JD signal"
              description="The active job description is already connected to this workspace, so you can see whether the current resume direction is landing."
            />
            <div className="mt-6 flex items-center justify-between gap-6">
              <div>
                <p className="font-headline text-4xl font-extrabold text-on-surface">{jd.score}%</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{jd.summaryTitle}</p>
              </div>
              <Link to="/jd" className="font-label text-sm font-bold text-primary no-underline">
                Inspect evidence
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}

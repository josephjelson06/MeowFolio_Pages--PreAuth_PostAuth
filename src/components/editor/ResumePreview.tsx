import type { CompactItem, ResumeData } from "../../types/resume";
import { flattenSkills, formatDateRange, getResumeContactLines } from "../../lib/resume";
import { Chip } from "../ui/Chip";
import { Panel } from "../ui/Panel";

interface ResumePreviewProps {
  resume: ResumeData;
}

function CompactSection({
  items,
  title
}: {
  items: CompactItem[];
  title: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <h2 className="font-label text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">{title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-6 text-on-surface">
        {items.map((item, index) => (
          <div key={`${title}-${item.description}-${index}`} className="flex items-start justify-between gap-4">
            <p className="font-medium text-on-surface">{item.description || "Untitled item"}</p>
            {item.date ? (
              <span className="shrink-0 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                {item.date}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ResumePreview({ resume }: ResumePreviewProps) {
  const contactLines = getResumeContactLines(resume);
  const flatSkills = flattenSkills(resume.skills);
  const displayName = resume.header.name?.trim() || "Your Name";
  const displayTitle = resume.header.title?.trim() || "Professional Title";
  const hasSummary = Boolean(resume.summary?.trim());
  const hasExperience = resume.experience.length > 0;
  const hasEducation = resume.education.length > 0;
  const hasProjects = resume.projects.length > 0;
  const hasSkills = flatSkills.length > 0;

  return (
    <Panel className="h-full p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-primary">Preview</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold text-on-surface">Resume Canvas</h2>
        </div>
        <Chip tone="mint">Live structure</Chip>
      </div>

      <div className="resume-paper mx-auto max-w-[720px] rounded-[1.75rem] p-10">
        <header className="border-b border-outline-variant/30 pb-6">
          <h1 className="font-headline text-4xl font-black uppercase tracking-[0.04em] text-on-surface">
            {displayName}
          </h1>
          <p className="mt-2 text-lg font-semibold text-primary">{displayTitle}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-on-surface-variant">
            {contactLines.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </header>

        {hasSummary ? (
          <section className="mt-6">
            <h2 className="font-label text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">Summary</h2>
            <p className="mt-3 text-sm leading-7 text-on-surface">{resume.summary}</p>
          </section>
        ) : null}

        {hasExperience ? (
          <section className="mt-8">
            <h2 className="font-label text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">Experience</h2>
            <div className="mt-4 space-y-5">
              {resume.experience.map((job) => (
                <article key={job.id ?? `${job.role}-${job.company}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-headline text-lg font-bold text-on-surface">{job.role || "Untitled role"}</h3>
                      <p className="text-sm font-semibold text-primary">{job.company}</p>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      {formatDateRange(job.startDate, job.endDate, job.current)}
                    </span>
                  </div>
                  {job.description ? <p className="mt-3 text-sm leading-6 text-on-surface">{job.description}</p> : null}
                  {job.bullets.length > 0 ? (
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-on-surface">
                      {job.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {hasProjects ? (
          <section className="mt-8">
            <h2 className="font-label text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">Projects</h2>
            <div className="mt-4 space-y-5">
              {resume.projects.map((project, index) => (
                <article key={`${project.title}-${index}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-headline text-lg font-bold text-on-surface">{project.title || "Untitled project"}</h3>
                      {project.link ? <p className="text-sm font-semibold text-primary">{project.link}</p> : null}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      {formatDateRange(project.startDate, project.endDate)}
                    </span>
                  </div>
                  {project.description ? (
                    <p className="mt-3 text-sm leading-6 text-on-surface">{project.description}</p>
                  ) : null}
                  {project.bullets.length > 0 ? (
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-on-surface">
                      {project.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                  {project.technologies.length > 0 ? (
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      {project.technologies.join(" / ")}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {(hasEducation || hasSkills) && (
          <section className="mt-8 grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              {hasEducation ? (
                <>
                  <h2 className="font-label text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                    Education
                  </h2>
                  <div className="mt-3 space-y-3 text-sm">
                    {resume.education.map((item, index) => (
                      <div key={`${item.institution}-${item.degree}-${index}`}>
                        <p className="font-semibold text-on-surface">{item.degree || "Education entry"}</p>
                        <p className="text-on-surface-variant">
                          {[item.institution, [item.startYear, item.endYear].filter(Boolean).join(" - ")]
                            .filter(Boolean)
                            .join(" - ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
            <div>
              {hasSkills ? (
                <>
                  <h2 className="font-label text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">Skills</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {flatSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </section>
        )}

        <CompactSection items={resume.certifications} title="Certifications" />
        <CompactSection items={resume.awards} title="Awards" />
        <CompactSection items={resume.leadership} title="Leadership" />
        <CompactSection items={resume.extracurricular} title="Extracurricular" />
      </div>
    </Panel>
  );
}

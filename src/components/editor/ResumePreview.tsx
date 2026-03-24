import { useEffect, useMemo, useState } from "react";
import type { CompactItem, RenderOptions, ResumeData } from "../../types/resume";
import type { CompilerHealthResponse } from "../../types/render";
import { flattenSkills, formatDateRange, getResumeContactLines } from "../../lib/resume";
import { fetchCompilerHealth, requestCompiledPdf } from "../../lib/render-client";
import { renderResumeToTex } from "../../lib/tex";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { Panel } from "../ui/Panel";

interface ResumePreviewProps {
  renderOptions: RenderOptions;
  resume: ResumeData;
}

type CompileState = "idle" | "compiling" | "success" | "error";

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

function StatusBanner({
  health,
  message,
  state
}: {
  health: CompilerHealthResponse | null;
  message: string | null;
  state: CompileState;
}) {
  const toneClassName =
    state === "error" || health?.engineAvailable === false
      ? "border-error-container bg-error-container/40 text-on-surface"
      : "border-outline-variant/20 bg-surface-container-lowest text-on-surface";

  return (
    <div className={`rounded-[1.5rem] border px-5 py-4 ${toneClassName}`}>
      <div className="flex flex-wrap items-center gap-3">
        <Chip tone={health?.engineAvailable ? "mint" : "coral"}>
          {health?.engineAvailable ? "Compiler Ready" : "Compiler Missing"}
        </Chip>
        {state === "success" ? <Chip tone="lavender">PDF Ready</Chip> : null}
        {state === "compiling" ? <Chip tone="soft">Compiling</Chip> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-on-surface">
        {message ||
          (health?.engineAvailable
            ? `Using ${health.engineCommand} for PDF generation.`
            : "No TeX engine is currently installed on this machine, so compile requests will fail until one is added.")}
      </p>
    </div>
  );
}

export function ResumePreview({ renderOptions, resume }: ResumePreviewProps) {
  const contactLines = getResumeContactLines(resume);
  const flatSkills = flattenSkills(resume.skills);
  const texSource = useMemo(() => renderResumeToTex(resume, renderOptions), [renderOptions, resume]);
  const displayName = resume.header.name?.trim() || "Your Name";
  const displayTitle = resume.header.title?.trim() || "Professional Title";
  const hasSummary = Boolean(resume.summary?.trim());
  const hasExperience = resume.experience.length > 0;
  const hasEducation = resume.education.length > 0;
  const hasProjects = resume.projects.length > 0;
  const hasSkills = flatSkills.length > 0;
  const [compilerHealth, setCompilerHealth] = useState<CompilerHealthResponse | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [compileState, setCompileState] = useState<CompileState>("idle");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetchCompilerHealth()
      .then((health) => {
        if (!active) {
          return;
        }

        setCompilerHealth(health);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setCompileError(error instanceof Error ? error.message : "Failed to reach compile service.");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  function downloadTexSource() {
    const blob = new Blob([texSource], { type: "text/x-tex;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "resume.tex";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleCompilePdf() {
    setCompileState("compiling");
    setCompileError(null);

    try {
      const pdfBlob = await requestCompiledPdf({ resume, options: renderOptions });
      const nextUrl = URL.createObjectURL(pdfBlob);

      setPdfUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return nextUrl;
      });

      setCompileState("success");
    } catch (error) {
      setCompileState("error");
      setCompileError(error instanceof Error ? error.message : "PDF compilation failed.");
    }
  }

  return (
    <Panel className="h-full p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-primary">Preview</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold text-on-surface">Resume Canvas</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="soft">{renderOptions.templateId}</Chip>
          <Chip tone="mint">TeX draft</Chip>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Button icon="download" variant="surface" onClick={downloadTexSource}>
          Download .tex
        </Button>
        <Button icon="picture_as_pdf" onClick={handleCompilePdf} disabled={compileState === "compiling"}>
          {compileState === "compiling" ? "Compiling..." : "Compile PDF"}
        </Button>
      </div>

      <StatusBanner health={compilerHealth} message={compileError} state={compileState} />

      {pdfUrl ? (
        <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest">
          <div className="flex items-center justify-between gap-4 border-b border-outline-variant/20 px-5 py-4">
            <div>
              <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Compiled Output</p>
              <p className="text-sm text-on-surface-variant">Local PDF response from the render service.</p>
            </div>
            <a href={pdfUrl} download="resume.pdf" className="text-sm font-bold text-primary">
              Download PDF
            </a>
          </div>
          <iframe title="Compiled resume PDF" src={pdfUrl} className="h-[520px] w-full bg-white" />
        </div>
      ) : null}

      <div className="resume-paper mx-auto mt-6 max-w-[720px] rounded-[1.75rem] p-10">
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

        <details className="mt-8 overflow-hidden rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest">
          <summary className="cursor-pointer px-5 py-4 font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Generated TeX Source
          </summary>
          <div className="border-t border-outline-variant/20 bg-[#fffdf9] p-5">
            <pre className="workspace-scroll overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-white p-4 font-mono text-xs leading-6 text-on-surface">
              {texSource}
            </pre>
          </div>
        </details>
      </div>
    </Panel>
  );
}

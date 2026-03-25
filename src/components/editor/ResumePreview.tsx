import { useEffect, useMemo, useState } from "react";
import { getTemplateDefinition } from "../../data/templates";
import { analyzeResumeForAts } from "../../lib/analysis";
import { cx } from "../../lib/cx";
import { fetchCompilerHealth, requestCompiledPdf } from "../../lib/render-client";
import { flattenSkills, formatDateRange, getResumeContactLines } from "../../lib/resume";
import { renderResumeToTex } from "../../lib/tex";
import type { AtsAnalysisResult } from "../../types/analysis";
import { areSkillsGrouped, type CompactItem, type RenderOptions, type ResumeData, type ResumeSectionKey } from "../../types/resume";
import type { CompilerHealthResponse } from "../../types/render";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { Panel } from "../ui/Panel";

interface ResumePreviewProps {
  renderOptions: RenderOptions;
  resume: ResumeData;
}

type CompileState = "error" | "idle" | "success" | "compiling";
type PreviewMode = "canvas" | "pdf" | "tex";

function formatSectionLabel(value: string) {
  return value === "header" ? "Header" : `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
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

function ExportReadiness({ analysis }: { analysis: AtsAnalysisResult }) {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <div className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Export Readiness</p>
            <h3 className="mt-2 font-headline text-2xl font-bold text-on-surface">Render Checks</h3>
          </div>
          <Chip tone={analysis.renderChecks.every((item) => item.passed) ? "mint" : "lavender"}>
            {analysis.renderChecks.filter((item) => item.passed).length}/{analysis.renderChecks.length} pass
          </Chip>
        </div>
        <div className="mt-5 space-y-4">
          {analysis.renderChecks.map((check) => (
            <div key={check.label} className="rounded-[1.5rem] bg-surface-container-low p-4">
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${check.passed ? "text-tertiary" : "text-error"}`}>
                  {check.passed ? "check_circle" : "warning"}
                </span>
                <p className="font-semibold text-on-surface">{check.label}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{check.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Section Health</p>
            <h3 className="mt-2 font-headline text-2xl font-bold text-on-surface">Editing Signals</h3>
          </div>
          <Chip tone={analysis.sectionSignals.filter((item) => item.status === "strong").length >= 3 ? "mint" : "soft"}>
            {analysis.rating}
          </Chip>
        </div>
        <div className="mt-5 space-y-4">
          {analysis.sectionSignals.map((signal) => (
            <div key={signal.section} className="rounded-[1.5rem] bg-surface-container-low p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-on-surface">{formatSectionLabel(signal.section)}</p>
                <Chip tone={signal.status === "strong" ? "mint" : "lavender"}>
                  {signal.status === "strong" ? "Strong" : "Needs Work"}
                </Chip>
              </div>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{signal.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewModeTabs({
  mode,
  onModeChange
}: {
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
}) {
  const modes: Array<{ icon: string; id: PreviewMode; label: string }> = [
    { icon: "description", id: "canvas", label: "Canvas" },
    { icon: "picture_as_pdf", id: "pdf", label: "PDF" },
    { icon: "code", id: "tex", label: "TeX" }
  ];

  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-surface-container-high p-1.5">
      {modes.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onModeChange(item.id)}
          className={
            mode === item.id
              ? "rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary"
              : "rounded-xl px-4 py-2 text-sm font-bold text-on-surface-variant"
          }
        >
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">{item.icon}</span>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function SectionTitle({
  templateId,
  title
}: {
  templateId: RenderOptions["templateId"];
  title: string;
}) {
  if (templateId === "compact") {
    return (
      <div className="mb-3 inline-flex rounded-full bg-secondary-fixed px-4 py-1.5 font-label text-[11px] font-bold uppercase tracking-[0.18em] text-on-secondary-fixed-variant">
        {title}
      </div>
    );
  }

  if (templateId === "editorial") {
    return (
      <div className="mb-4">
        <h2 className="font-label text-xs font-bold uppercase tracking-[0.3em] text-secondary">{title}</h2>
        <div className="mt-2 h-px w-16 bg-secondary/40" />
      </div>
    );
  }

  return (
    <div className="mb-4 border-b border-outline-variant/30 pb-2">
      <h2 className="font-label text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">{title}</h2>
    </div>
  );
}

function CompactSection({
  items,
  templateId,
  title
}: {
  items: CompactItem[];
  templateId: RenderOptions["templateId"];
  title: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <SectionTitle templateId={templateId} title={title} />
      <div className="space-y-2 text-sm leading-6 text-on-surface">
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

function EmptyPanel({
  copy,
  title
}: {
  copy: string;
  title: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-outline-variant/30 bg-surface-container-lowest p-8 text-center">
      <p className="font-headline text-2xl font-bold text-on-surface">{title}</p>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">{copy}</p>
    </div>
  );
}

function renderCanvasSection(
  section: ResumeSectionKey,
  resume: ResumeData,
  renderOptions: RenderOptions
) {
  switch (section) {
    case "summary":
      return resume.summary?.trim() ? (
        <section key={section} className="mt-8">
          <SectionTitle templateId={renderOptions.templateId} title="Summary" />
          <p className="text-sm leading-7 text-on-surface">{resume.summary}</p>
        </section>
      ) : null;
    case "skills":
      if (resume.skills.length === 0) {
        return null;
      }

      return (
        <section key={section} className="mt-8">
          <SectionTitle templateId={renderOptions.templateId} title="Skills" />
          {areSkillsGrouped(resume.skills) ? (
            <div className="space-y-3 text-sm text-on-surface">
              {resume.skills.map((group) => (
                <div key={group.category}>
                  <p className="font-semibold text-on-surface">{group.category}</p>
                  <p className="mt-1 text-on-surface-variant">{group.items.join(", ")}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </section>
      );
    case "education":
      return resume.education.length > 0 ? (
        <section key={section} className="mt-8">
          <SectionTitle templateId={renderOptions.templateId} title="Education" />
          <div className="space-y-4 text-sm">
            {resume.education.map((item, index) => (
              <div key={`${item.institution}-${item.degree}-${index}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-on-surface">{item.degree || "Education entry"}</p>
                    <p className="text-on-surface-variant">
                      {[item.field, item.institution, item.location].filter(Boolean).join(" | ")}
                    </p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                    {[item.startYear, item.endYear].filter(Boolean).join(" - ")}
                  </span>
                </div>
                {item.gpa ? <p className="mt-1 text-xs font-semibold text-on-surface-variant">GPA: {item.gpa}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null;
    case "experience":
      return resume.experience.length > 0 ? (
        <section key={section} className="mt-8">
          <SectionTitle templateId={renderOptions.templateId} title="Experience" />
          <div className="space-y-5">
            {resume.experience.map((job) => (
              <article key={job.id ?? `${job.role}-${job.company}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-headline text-lg font-bold text-on-surface">{job.role || "Untitled role"}</h3>
                    <p className="text-sm font-semibold text-primary">{[job.company, job.location].filter(Boolean).join(" | ")}</p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                    {formatDateRange(job.startDate, job.endDate, job.current)}
                  </span>
                </div>
                {job.description ? <p className="mt-3 text-sm leading-6 text-on-surface">{job.description}</p> : null}
                {job.bullets.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-on-surface">
                    {job.bullets.slice(0, renderOptions.maxBulletsPerEntry).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null;
    case "projects":
      return resume.projects.length > 0 ? (
        <section key={section} className="mt-8">
          <SectionTitle templateId={renderOptions.templateId} title="Projects" />
          <div className="space-y-5">
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
                {project.description ? <p className="mt-3 text-sm leading-6 text-on-surface">{project.description}</p> : null}
                {project.bullets.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-on-surface">
                    {project.bullets.slice(0, renderOptions.maxBulletsPerEntry).map((bullet) => (
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
      ) : null;
    case "certifications":
      return <CompactSection key={section} items={resume.certifications} templateId={renderOptions.templateId} title="Certifications" />;
    case "awards":
      return <CompactSection key={section} items={resume.awards} templateId={renderOptions.templateId} title="Awards" />;
    case "leadership":
      return <CompactSection key={section} items={resume.leadership} templateId={renderOptions.templateId} title="Leadership" />;
    case "extracurricular":
      return <CompactSection key={section} items={resume.extracurricular} templateId={renderOptions.templateId} title="Extracurricular" />;
    default:
      return null;
  }
}

function CanvasPreview({
  renderOptions,
  resume
}: {
  renderOptions: RenderOptions;
  resume: ResumeData;
}) {
  const template = getTemplateDefinition(renderOptions.templateId);
  const contactLines = getResumeContactLines(resume);
  const flatSkills = flattenSkills(resume.skills);
  const displayName = resume.header.name?.trim() || "Your Name";
  const displayTitle = resume.header.title?.trim() || "Professional Title";
  const orderedSections = renderOptions.sectionOrder
    .map((section) => renderCanvasSection(section, resume, renderOptions))
    .filter(Boolean);

  return (
    <div
      className={cx(
        "resume-paper mx-auto rounded-[1.75rem]",
        template.id === "compact" ? "max-w-[680px] p-8" : template.id === "editorial" ? "max-w-[760px] p-12" : "max-w-[720px] p-10"
      )}
    >
      <header
        className={cx(
          "border-b border-outline-variant/30 pb-6",
          template.headerLayout === "center" && "text-center"
        )}
      >
        <div className={cx(template.headerLayout === "center" ? "mx-auto max-w-xl" : "")}>
          <h1
            className={cx(
              "font-headline font-black uppercase tracking-[0.04em] text-on-surface",
              template.id === "compact" ? "text-3xl" : "text-4xl"
            )}
          >
            {displayName}
          </h1>
          <p className="mt-2 text-lg font-semibold text-primary">{displayTitle}</p>
          <div
            className={cx(
              "mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-on-surface-variant",
              template.headerLayout === "center" && "justify-center"
            )}
          >
            {contactLines.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </header>

      {orderedSections.length > 0 ? (
        orderedSections
      ) : (
        <div className="mt-8 rounded-[1.5rem] border border-dashed border-outline-variant/30 bg-white/70 p-8 text-center">
          <p className="font-headline text-2xl font-bold text-on-surface">Start filling in the resume</p>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            Add personal details, experience, or import an existing resume to see the selected {template.label.toLowerCase()} template populate live.
          </p>
          {flatSkills.length === 0 ? null : (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {flatSkills.slice(0, 6).map((skill) => (
                <Chip key={skill} tone="soft">
                  {skill}
                </Chip>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ResumePreview({ renderOptions, resume }: ResumePreviewProps) {
  const template = getTemplateDefinition(renderOptions.templateId);
  const texSource = useMemo(() => renderResumeToTex(resume, renderOptions), [renderOptions, resume]);
  const exportAnalysis = useMemo(() => analyzeResumeForAts(resume, renderOptions), [renderOptions, resume]);
  const [compilerHealth, setCompilerHealth] = useState<CompilerHealthResponse | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [compileState, setCompileState] = useState<CompileState>("idle");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("canvas");

  useEffect(() => {
    let active = true;

    fetchCompilerHealth()
      .then((health) => {
        if (active) {
          setCompilerHealth(health);
        }
      })
      .catch((error) => {
        if (active) {
          setCompileError(error instanceof Error ? error.message : "Failed to reach compile service.");
        }
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
    link.download = `${resume.header.name?.trim() || "resume"}.tex`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleCompilePdf() {
    setCompileState("compiling");
    setCompileError(null);

    try {
      const pdfBlob = await requestCompiledPdf({ options: renderOptions, resume });
      const nextUrl = URL.createObjectURL(pdfBlob);

      setPdfUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return nextUrl;
      });

      setCompileState("success");
      setPreviewMode("pdf");
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
          <h2 className="mt-2 font-headline text-3xl font-extrabold text-on-surface">Resume Output</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
            The live canvas, TeX source, and compiled PDF are all driven by the {template.label.toLowerCase()} template and current render settings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={template.badgeTone}>{template.label}</Chip>
          <Chip tone="soft">{renderOptions.pageLimit} page</Chip>
          <Chip tone="mint">{renderOptions.margin} margin</Chip>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <PreviewModeTabs mode={previewMode} onModeChange={setPreviewMode} />
        <div className="flex flex-wrap gap-3">
          <Button to="/ats" icon="analytics" variant="surface">
            Review ATS
          </Button>
          <Button to="/jd" icon="query_stats" variant="surface">
            Review JD
          </Button>
          <Button icon="download" variant="surface" onClick={downloadTexSource}>
            Download .tex
          </Button>
          <Button icon="picture_as_pdf" onClick={handleCompilePdf} disabled={compileState === "compiling"}>
            {compileState === "compiling" ? "Compiling..." : "Compile PDF"}
          </Button>
        </div>
      </div>

      <StatusBanner health={compilerHealth} message={compileError} state={compileState} />

      <ExportReadiness analysis={exportAnalysis} />

      <div className="mt-6">
        {previewMode === "canvas" ? <CanvasPreview renderOptions={renderOptions} resume={resume} /> : null}

        {previewMode === "pdf" ? (
          pdfUrl ? (
            <div className="overflow-hidden rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest">
              <div className="flex items-center justify-between gap-4 border-b border-outline-variant/20 px-5 py-4">
                <div>
                  <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Compiled Output</p>
                  <p className="text-sm text-on-surface-variant">Live PDF generated from the active TeX template.</p>
                </div>
                <a href={pdfUrl} download="resume.pdf" className="text-sm font-bold text-primary">
                  Download PDF
                </a>
              </div>
              <iframe title="Compiled resume PDF" src={pdfUrl} className="h-[720px] w-full bg-white" />
            </div>
          ) : (
            <EmptyPanel
              title="Compile the PDF to preview it here"
              copy="The canvas and TeX draft are already live. Once you compile, the generated PDF will show up in this mode and stay available to download."
            />
          )
        ) : null}

        {previewMode === "tex" ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest">
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant/20 px-5 py-4">
              <div>
                <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Generated TeX</p>
                <p className="text-sm text-on-surface-variant">Current source for the selected {template.label.toLowerCase()} template.</p>
              </div>
              <Chip tone="lavender">{template.label}</Chip>
            </div>
            <div className="border-t border-outline-variant/20 bg-[#fffdf9] p-5">
              <pre className="workspace-scroll overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-white p-4 font-mono text-xs leading-6 text-on-surface">
                {texSource}
              </pre>
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

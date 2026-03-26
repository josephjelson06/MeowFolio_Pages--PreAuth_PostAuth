import { useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { getTemplateDefinition, templateCatalog } from "../../data/templates";
import { DEFAULT_RENDER_OPTIONS } from "../../types/resume";
import type {
  CompactItem,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  RenderOptions,
  ResumeData,
  ResumeSectionKey
} from "../../types/resume";
import type { ResumeImportResult } from "../../types/import";
import { requestImportedResumeFile } from "../../lib/import-client";
import { importResumeFromText } from "../../lib/resume-import";
import { skillsToText, splitDelimitedItems, splitLineItems, textToSkills } from "../../lib/resume";
import { cx } from "../../lib/cx";
import { Chip } from "../ui/Chip";
import { Panel } from "../ui/Panel";
import { SectionHeading } from "../ui/SectionHeading";
import { TemplateCard } from "../ui/TemplateCard";
import { AccordionSection } from "./AccordionSection";
import { type EditorTabId, EditorTabs } from "./EditorTabs";

interface EditorSidebarProps {
  activeTab: EditorTabId;
  onClearResume: () => void;
  onResumeChange: (resume: ResumeData) => void;
  onRenderOptionsChange: (options: RenderOptions) => void;
  onTabChange: (tab: EditorTabId) => void;
  onTemplateChange: (templateId: RenderOptions["templateId"]) => void;
  renderOptions: RenderOptions;
  resume: ResumeData;
}

const fieldClassName =
  "w-full rounded-2xl border border-outline-variant/20 bg-surface-container-highest px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary/40 focus:bg-white";

const textareaClassName =
  "min-h-[120px] w-full resize-y rounded-2xl border border-outline-variant/20 bg-surface-container-highest px-4 py-3 text-sm leading-6 text-on-surface outline-none transition focus:border-primary/40 focus:bg-white";

const compactSectionLabels: Record<
  Extract<ResumeSectionKey, "certifications" | "awards" | "leadership" | "extracurricular">,
  string
> = {
  certifications: "Certifications",
  awards: "Awards",
  leadership: "Leadership",
  extracurricular: "Extracurricular"
};

const sectionLabels: Record<ResumeSectionKey, string> = {
  summary: "Summary",
  skills: "Skills",
  education: "Education",
  experience: "Experience",
  projects: "Projects",
  certifications: "Certifications",
  awards: "Awards",
  leadership: "Leadership",
  extracurricular: "Extracurricular"
};

function isResumeSectionId(value: string): value is ResumeSectionKey {
  return value in sectionLabels;
}

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="ml-1 block font-label text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
      {children}
    </span>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  tone = "surface"
}: {
  icon: string;
  label: string;
  onClick: () => void;
  tone?: "danger" | "surface";
}) {
  const toneClassName =
    tone === "danger"
      ? "border-error-container bg-error-container/60 text-error"
      : "border-outline-variant/20 bg-surface-container-lowest text-on-surface";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-bold transition hover:-translate-y-px ${toneClassName}`}
    >
      <span className="inline-flex items-center gap-2">
        <span className="material-symbols-outlined text-lg">{icon}</span>
        {label}
      </span>
    </button>
  );
}

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface transition hover:-translate-y-px hover:bg-white"
    >
      <span className="material-symbols-outlined text-lg text-primary">add</span>
      {label}
    </button>
  );
}

function DetailCard({
  children,
  title,
  onRemove
}: {
  children: ReactNode;
  title: string;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h4 className="font-headline text-lg font-bold text-on-surface">{title}</h4>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-error-container/60 text-error transition hover:-translate-y-px"
          aria-label={`Remove ${title}`}
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
      {children}
    </div>
  );
}

function WorkspaceSurface({
  bodyClassName,
  children,
  description,
  footer,
  headerAside,
  title
}: {
  bodyClassName?: string;
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
  headerAside?: ReactNode;
  title: string;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest shadow-ambient">
      <div className="shrink-0 border-b border-outline-variant/15 px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-headline text-base font-bold text-on-surface">{title}</p>
            {description ? <p className="mt-1 text-xs leading-5 text-on-surface-variant">{description}</p> : null}
          </div>
          {headerAside ? <div className="shrink-0">{headerAside}</div> : null}
        </div>
      </div>
      <div className={cx("min-h-0 flex-1 overflow-hidden p-3", bodyClassName)}>{children}</div>
      {footer ? <div className="shrink-0 border-t border-outline-variant/15 bg-surface-container px-4 py-3">{footer}</div> : null}
    </section>
  );
}

function SegmentedButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-on-surface shadow-tactile-sm"
          : "rounded-xl px-4 py-2.5 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-highest"
      }
    >
      {children}
    </button>
  );
}

function RangeRow({
  label,
  max,
  min,
  onChange,
  step = 1,
  value,
  valueLabel
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
  valueLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <FieldLabel>{label}</FieldLabel>
        <span className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">{valueLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-outline-variant/30 accent-primary"
      />
    </div>
  );
}

interface AccordionWorkspaceItem {
  content: ReactNode;
  icon: string;
  id: string;
  title: string;
}

function AccordionWorkspace({
  activeId,
  items,
  onChange,
  onReorder
}: {
  activeId: string | null;
  items: AccordionWorkspaceItem[];
  onChange: (id: string | null) => void;
  onReorder?: (from: ResumeSectionKey, to: ResumeSectionKey) => void;
  }) {
    const [draggedSectionId, setDraggedSectionId] = useState<ResumeSectionKey | null>(null);

    return (
      <div className="workspace-scroll h-[42rem] max-h-full overflow-y-scroll pr-2">
        <div className="space-y-3">
          {items.map((item) => {
            const active = item.id === activeId;
            const reorderable = Boolean(onReorder && isResumeSectionId(item.id));

          function handleDragStart(event: DragEvent<HTMLElement>) {
            if (!reorderable || !isResumeSectionId(item.id)) {
              return;
            }

            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", item.id);
            setDraggedSectionId(item.id);
          }

          function handleDragEnd() {
            setDraggedSectionId(null);
          }

          function handleDragOver(event: DragEvent<HTMLElement>) {
            if (!reorderable || !draggedSectionId || !isResumeSectionId(item.id) || draggedSectionId === item.id) {
              return;
            }

            event.preventDefault();
          }

          function handleDrop(event: DragEvent<HTMLElement>) {
            if (!onReorder || !reorderable || !draggedSectionId || !isResumeSectionId(item.id) || draggedSectionId === item.id) {
              return;
            }

            event.preventDefault();
            onReorder(draggedSectionId, item.id);
            setDraggedSectionId(null);
          }

          return (
            <AccordionSection
              key={item.id}
              active={active}
              dragActive={Boolean(reorderable && draggedSectionId === item.id)}
              draggable={reorderable}
              icon={item.icon}
              onDragEnd={reorderable ? handleDragEnd : undefined}
              onDragOver={reorderable ? handleDragOver : undefined}
              onDragStart={reorderable ? handleDragStart : undefined}
              onDrop={reorderable ? handleDrop : undefined}
              title={item.title}
              onToggle={() => onChange(active ? null : item.id)}
            >
              {item.content}
            </AccordionSection>
          );
        })}
      </div>
    </div>
  );
}

function parseInputValue(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
  return event.target.value;
}

export function EditorSidebar({
  activeTab,
  onClearResume,
  onResumeChange,
  onRenderOptionsChange,
  onTabChange,
  onTemplateChange,
  renderOptions,
  resume
}: EditorSidebarProps) {
  const selectedTemplate = getTemplateDefinition(renderOptions.templateId);

  function commit(next: ResumeData) {
    onResumeChange(next);
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeContentSection, setActiveContentSection] = useState<string | null>("personal");
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importSections, setImportSections] = useState<ResumeSectionKey[]>([]);
  const [importSourceLabel, setImportSourceLabel] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState<"all" | "balanced" | "tight" | "airy">("all");

  function updateRenderOptions(patch: Partial<RenderOptions>) {
    onRenderOptionsChange({
      ...renderOptions,
      ...patch
    });
  }

  function reorderResumeSections(from: ResumeSectionKey, to: ResumeSectionKey) {
    if (from === to) {
      return;
    }

    const fromIndex = renderOptions.sectionOrder.indexOf(from);
    const toIndex = renderOptions.sectionOrder.indexOf(to);

    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    const nextSectionOrder = [...renderOptions.sectionOrder];
    const [moved] = nextSectionOrder.splice(fromIndex, 1);
    nextSectionOrder.splice(toIndex, 0, moved);

    updateRenderOptions({
      sectionOrder: nextSectionOrder
    });
  }

  function updateHeader(field: keyof ResumeData["header"], value: string) {
    commit({
      ...resume,
      header: {
        ...resume.header,
        [field]: value
      }
    });
  }

  function updateSummary(value: string) {
    commit({
      ...resume,
      summary: value
    });
  }

  function updateSkills(value: string) {
    commit({
      ...resume,
      skills: textToSkills(value)
    });
  }

  function updateExperience(index: number, patch: Partial<ExperienceItem>) {
    const next = resume.experience.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
    commit({ ...resume, experience: next });
  }

  function addExperience() {
    commit({
      ...resume,
      experience: [
        ...resume.experience,
        {
          id: `experience-${Date.now()}`,
          role: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          description: "",
          bullets: []
        }
      ]
    });
  }

  function removeExperience(index: number) {
    commit({
      ...resume,
      experience: resume.experience.filter((_, itemIndex) => itemIndex !== index)
    });
  }

  function updateEducation(index: number, patch: Partial<EducationItem>) {
    const next = resume.education.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
    commit({ ...resume, education: next });
  }

  function addEducation() {
    commit({
      ...resume,
      education: [
        ...resume.education,
        {
          degree: "",
          field: "",
          institution: "",
          location: "",
          startYear: "",
          endYear: "",
          gpa: ""
        }
      ]
    });
  }

  function removeEducation(index: number) {
    commit({
      ...resume,
      education: resume.education.filter((_, itemIndex) => itemIndex !== index)
    });
  }

  function updateProject(index: number, patch: Partial<ProjectItem>) {
    const next = resume.projects.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
    commit({ ...resume, projects: next });
  }

  function addProject() {
    commit({
      ...resume,
      projects: [
        ...resume.projects,
        {
          title: "",
          description: "",
          startDate: "",
          endDate: "",
          technologies: [],
          bullets: [],
          link: ""
        }
      ]
    });
  }

  function removeProject(index: number) {
    commit({
      ...resume,
      projects: resume.projects.filter((_, itemIndex) => itemIndex !== index)
    });
  }

  function updateCompactSection(
    section: Extract<ResumeSectionKey, "certifications" | "awards" | "leadership" | "extracurricular">,
    index: number,
    patch: Partial<CompactItem>
  ) {
    const next = resume[section].map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
    commit({ ...resume, [section]: next });
  }

  function addCompactSectionItem(section: Extract<ResumeSectionKey, "certifications" | "awards" | "leadership" | "extracurricular">) {
    commit({
      ...resume,
      [section]: [...resume[section], { description: "", date: "", link: "" }]
    });
  }

  function removeCompactSectionItem(
    section: Extract<ResumeSectionKey, "certifications" | "awards" | "leadership" | "extracurricular">,
    index: number
  ) {
    commit({
      ...resume,
      [section]: resume[section].filter((_, itemIndex) => itemIndex !== index)
    });
  }

  function resetImportFeedback() {
    setImportStatus("idle");
    setImportMessage(null);
    setImportWarnings([]);
    setImportSections([]);
    setImportSourceLabel(null);
  }

  function applyImportedResume(result: ResumeImportResult, successMessage: string, sourceLabel: string, nextImportText?: string) {
    commit(result.resume);
    setImportStatus("success");
    setImportMessage(`${successMessage} (AI parse${result.meta.cached ? ", cached" : ""}, ${result.meta.confidence} confidence)`);
    setImportWarnings(result.warnings);
    setImportSections(result.summary.detectedSections);
    setImportSourceLabel(sourceLabel);

    if (typeof nextImportText === "string") {
      setImportText(nextImportText);
    }
  }

  function handleImportResume() {
    if (!importText.trim()) {
      setImportStatus("error");
      setImportMessage("Paste resume text before trying to import it.");
      setImportWarnings([]);
      setImportSections([]);
      return;
    }

    setImportStatus("loading");
    setImportMessage("Running AI resume parse...");

    try {
      const response = await requestImportedResumeText(importText);
      const result = response.result;
      const hasImportedData = Boolean(
        result.resume.header.name ||
          result.resume.summary ||
          result.resume.experience.length ||
          result.resume.education.length ||
          result.resume.projects.length
      );

    if (!hasImportedData) {
      setImportStatus("error");
      setImportMessage("No structured resume content could be detected from that pasted text.");
      setImportWarnings(result.warnings);
      setImportSections(result.summary.detectedSections);
      setImportSourceLabel("Pasted text");
      return;
    }

    applyImportedResume(
      result,
      `Imported ${result.summary.experienceCount} experience, ${result.summary.educationCount} education, ${result.summary.projectCount} projects, and ${result.summary.skillCount} skills.`,
      "Pasted text"
    );
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImportStatus("loading");
    setImportMessage(`Extracting text from ${file.name} and sending it to the AI parser...`);
    setImportWarnings([]);
    setImportSections([]);
    setImportSourceLabel(file.name);

    try {
      const response = await requestImportedResumeFile(file);
      const { result } = response;
      const hasImportedData = Boolean(
        result.resume.header.name ||
          result.resume.summary ||
          result.resume.experience.length ||
          result.resume.education.length ||
          result.resume.projects.length
      );

      if (!hasImportedData) {
        setImportStatus("error");
        setImportMessage(`No structured resume content could be detected in ${file.name}.`);
        setImportWarnings(result.warnings);
        setImportSections(result.summary.detectedSections);
        return;
      }

      applyImportedResume(
        result,
        `Imported ${file.name} with ${result.summary.experienceCount} experience, ${result.summary.educationCount} education, ${result.summary.projectCount} projects, and ${result.summary.skillCount} skills.`,
        file.name,
        response.extractedText
      );
    } catch (error) {
      setImportStatus("error");
      setImportMessage(error instanceof Error ? error.message : `Failed to import ${file.name}.`);
      setImportWarnings([]);
      setImportSections([]);
    } finally {
      event.target.value = "";
    }
  }

  const filteredTemplates = templateCatalog.filter((template) => {
    if (templateFilter === "all") {
      return true;
    }

    return template.density === templateFilter;
  });
  const marginValue = Number.parseFloat(renderOptions.margin) || 1;

  const contentSections: AccordionWorkspaceItem[] = [
    {
      id: "import",
      icon: "upload_file",
      title: "Import Resume",
      content: (
        <>
          <label className="space-y-2">
            <FieldLabel>Paste resume text for AI parsing</FieldLabel>
            <textarea
              className={`${textareaClassName} min-h-[220px]`}
              value={importText}
              placeholder="Paste a resume here. The AI parser will map it into header, summary, skills, experience, education, projects, and the compact sections."
              onChange={(event) => {
                setImportText(parseInputValue(event));
                if (importStatus !== "idle" || importWarnings.length > 0 || importSections.length > 0 || importSourceLabel) {
                  resetImportFeedback();
                }
              }}
            />
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleImportFile}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <IconButton icon="upload" label="Import into editor" onClick={handleImportResume} />
            <IconButton
              icon="attach_file"
              label={importStatus === "loading" ? "Processing file..." : "Choose file"}
              onClick={() => fileInputRef.current?.click()}
            />
            <IconButton
              icon="close"
              label="Clear pasted text"
              onClick={() => {
                setImportText("");
                resetImportFeedback();
              }}
              tone="danger"
            />
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
            Supports `.txt`, `.md`, `.pdf`, and `.docx` under 5 MB. Parsing is AI-first.
          </p>
          {importMessage ? (
            <div
              className={`mt-5 rounded-[1.25rem] border px-4 py-4 ${
                importStatus === "error"
                  ? "border-error-container bg-error-container/40 text-on-surface"
                  : "border-outline-variant/20 bg-surface-container-highest text-on-surface"
              }`}
            >
              <p className="text-sm font-semibold">{importMessage}</p>
              {importSourceLabel ? (
                <div className="mt-3">
                  <Chip tone="lavender">{importSourceLabel}</Chip>
                </div>
              ) : null}
              {importSections.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {importSections.map((section) => (
                    <Chip key={section} tone="mint">
                      {sectionLabels[section]}
                    </Chip>
                  ))}
                </div>
              ) : null}
              {importWarnings.length > 0 ? (
                <div className="mt-4 space-y-2 text-sm leading-6 text-on-surface-variant">
                  {importWarnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )
    },
    {
      id: "personal",
      icon: "person",
      title: "Personal Details",
      content: (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <FieldLabel>Full Name</FieldLabel>
            <input className={fieldClassName} value={resume.header.name ?? ""} onChange={(event) => updateHeader("name", parseInputValue(event))} />
          </label>
          <label className="space-y-2 md:col-span-2">
            <FieldLabel>Role</FieldLabel>
            <input className={fieldClassName} value={resume.header.title ?? ""} onChange={(event) => updateHeader("title", parseInputValue(event))} />
          </label>
          <label className="space-y-2">
            <FieldLabel>Email</FieldLabel>
            <input className={fieldClassName} value={resume.header.email ?? ""} onChange={(event) => updateHeader("email", parseInputValue(event))} />
          </label>
          <label className="space-y-2">
            <FieldLabel>Phone</FieldLabel>
            <input className={fieldClassName} value={resume.header.phone ?? ""} onChange={(event) => updateHeader("phone", parseInputValue(event))} />
          </label>
          <label className="space-y-2 md:col-span-2">
            <FieldLabel>Location</FieldLabel>
            <input className={fieldClassName} value={resume.header.location ?? ""} onChange={(event) => updateHeader("location", parseInputValue(event))} />
          </label>
          <label className="space-y-2">
            <FieldLabel>LinkedIn</FieldLabel>
            <input className={fieldClassName} value={resume.header.linkedin ?? ""} onChange={(event) => updateHeader("linkedin", parseInputValue(event))} />
          </label>
          <label className="space-y-2">
            <FieldLabel>GitHub</FieldLabel>
            <input className={fieldClassName} value={resume.header.github ?? ""} onChange={(event) => updateHeader("github", parseInputValue(event))} />
          </label>
          <label className="space-y-2">
            <FieldLabel>Website</FieldLabel>
            <input className={fieldClassName} value={resume.header.website ?? ""} onChange={(event) => updateHeader("website", parseInputValue(event))} />
          </label>
          <label className="space-y-2">
            <FieldLabel>Portfolio</FieldLabel>
            <input className={fieldClassName} value={resume.header.portfolio ?? ""} onChange={(event) => updateHeader("portfolio", parseInputValue(event))} />
          </label>
        </div>
      )
    },
    {
      id: "summary",
      icon: "auto_awesome",
      title: "Professional Summary",
      content: (
        <label className="space-y-2">
          <FieldLabel>Summary</FieldLabel>
          <textarea className={textareaClassName} value={resume.summary ?? ""} onChange={(event) => updateSummary(parseInputValue(event))} />
        </label>
      )
    },
    {
      id: "skills",
      icon: "bolt",
      title: "Skills",
      content: (
        <>
          <label className="space-y-2">
            <FieldLabel>Skills</FieldLabel>
            <textarea className={textareaClassName} value={skillsToText(resume.skills)} onChange={(event) => updateSkills(parseInputValue(event))} />
          </label>
          <p className="mt-3 text-sm text-on-surface-variant">
            Use one skill per line, or grouped lines like <span className="font-semibold text-on-surface">Languages: Python, Go</span>.
          </p>
        </>
      )
    },
    {
      id: "experience",
      icon: "work",
      title: "Experience",
      content: (
        <div className="space-y-4">
          {resume.experience.map((item, index) => (
            <DetailCard key={item.id ?? `experience-${index}`} title={item.role?.trim() || `Experience ${index + 1}`} onRemove={() => removeExperience(index)}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <FieldLabel>Role</FieldLabel>
                  <input className={fieldClassName} value={item.role ?? ""} onChange={(event) => updateExperience(index, { role: parseInputValue(event) })} />
                </label>
                <label className="space-y-2">
                  <FieldLabel>Company</FieldLabel>
                  <input className={fieldClassName} value={item.company ?? ""} onChange={(event) => updateExperience(index, { company: parseInputValue(event) })} />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <FieldLabel>Location</FieldLabel>
                  <input className={fieldClassName} value={item.location ?? ""} onChange={(event) => updateExperience(index, { location: parseInputValue(event) })} />
                </label>
                <label className="space-y-2">
                  <FieldLabel>Start Date</FieldLabel>
                  <input className={fieldClassName} value={item.startDate ?? ""} onChange={(event) => updateExperience(index, { startDate: parseInputValue(event) })} />
                </label>
                <label className="space-y-2">
                  <FieldLabel>End Date</FieldLabel>
                  <input className={fieldClassName} value={item.endDate ?? ""} onChange={(event) => updateExperience(index, { endDate: parseInputValue(event) })} />
                </label>
                <label className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-highest px-4 py-3 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={Boolean(item.current)}
                    onChange={(event) =>
                      updateExperience(index, {
                        current: event.target.checked,
                        endDate: event.target.checked ? "" : item.endDate ?? ""
                      })
                    }
                  />
                  <span className="text-sm font-semibold text-on-surface">Current role</span>
                </label>
                <label className="space-y-2 md:col-span-2">
                  <FieldLabel>Description</FieldLabel>
                  <textarea className={textareaClassName} value={item.description ?? ""} onChange={(event) => updateExperience(index, { description: parseInputValue(event) })} />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <FieldLabel>Bullets</FieldLabel>
                  <textarea className={textareaClassName} value={item.bullets.join("\n")} onChange={(event) => updateExperience(index, { bullets: splitLineItems(parseInputValue(event)) })} />
                </label>
              </div>
            </DetailCard>
          ))}
          <AddRowButton label="Add experience" onClick={addExperience} />
        </div>
      )
    },
    {
      id: "education",
      icon: "school",
      title: "Education",
      content: (
        <div className="space-y-4">
          {resume.education.map((item, index) => (
            <DetailCard key={`${item.institution}-${index}`} title={item.institution?.trim() || `Education ${index + 1}`} onRemove={() => removeEducation(index)}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <FieldLabel>Degree</FieldLabel>
                  <input className={fieldClassName} value={item.degree ?? ""} onChange={(event) => updateEducation(index, { degree: parseInputValue(event) })} />
                </label>
                <label className="space-y-2">
                  <FieldLabel>Field</FieldLabel>
                  <input className={fieldClassName} value={item.field ?? ""} onChange={(event) => updateEducation(index, { field: parseInputValue(event) })} />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <FieldLabel>Institution</FieldLabel>
                  <input className={fieldClassName} value={item.institution ?? ""} onChange={(event) => updateEducation(index, { institution: parseInputValue(event) })} />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <FieldLabel>Location</FieldLabel>
                  <input className={fieldClassName} value={item.location ?? ""} onChange={(event) => updateEducation(index, { location: parseInputValue(event) })} />
                </label>
                <label className="space-y-2">
                  <FieldLabel>Start Year</FieldLabel>
                  <input className={fieldClassName} value={item.startYear ?? ""} onChange={(event) => updateEducation(index, { startYear: parseInputValue(event) })} />
                </label>
                <label className="space-y-2">
                  <FieldLabel>End Year</FieldLabel>
                  <input className={fieldClassName} value={item.endYear ?? ""} onChange={(event) => updateEducation(index, { endYear: parseInputValue(event) })} />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <FieldLabel>GPA</FieldLabel>
                  <input className={fieldClassName} value={item.gpa ?? ""} onChange={(event) => updateEducation(index, { gpa: parseInputValue(event) })} />
                </label>
              </div>
            </DetailCard>
          ))}
          <AddRowButton label="Add education" onClick={addEducation} />
        </div>
      )
    },
    {
      id: "projects",
      icon: "deployed_code",
      title: "Projects",
      content: (
        <div className="space-y-4">
          {resume.projects.map((item, index) => (
            <DetailCard key={`${item.title}-${index}`} title={item.title?.trim() || `Project ${index + 1}`} onRemove={() => removeProject(index)}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <FieldLabel>Title</FieldLabel>
                  <input className={fieldClassName} value={item.title ?? ""} onChange={(event) => updateProject(index, { title: parseInputValue(event) })} />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <FieldLabel>Link</FieldLabel>
                  <input className={fieldClassName} value={item.link ?? ""} onChange={(event) => updateProject(index, { link: parseInputValue(event) })} />
                </label>
                <label className="space-y-2">
                  <FieldLabel>Start Date</FieldLabel>
                  <input className={fieldClassName} value={item.startDate ?? ""} onChange={(event) => updateProject(index, { startDate: parseInputValue(event) })} />
                </label>
                <label className="space-y-2">
                  <FieldLabel>End Date</FieldLabel>
                  <input className={fieldClassName} value={item.endDate ?? ""} onChange={(event) => updateProject(index, { endDate: parseInputValue(event) })} />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <FieldLabel>Description</FieldLabel>
                  <textarea className={textareaClassName} value={item.description ?? ""} onChange={(event) => updateProject(index, { description: parseInputValue(event) })} />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <FieldLabel>Technologies</FieldLabel>
                  <textarea className={textareaClassName} value={item.technologies.join("\n")} onChange={(event) => updateProject(index, { technologies: splitDelimitedItems(parseInputValue(event)) })} />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <FieldLabel>Bullets</FieldLabel>
                  <textarea className={textareaClassName} value={item.bullets.join("\n")} onChange={(event) => updateProject(index, { bullets: splitLineItems(parseInputValue(event)) })} />
                </label>
              </div>
            </DetailCard>
          ))}
          <AddRowButton label="Add project" onClick={addProject} />
        </div>
      )
    },
    ...(Object.keys(compactSectionLabels) as Array<keyof typeof compactSectionLabels>).map((section) => ({
      id: section,
      icon: "format_list_bulleted",
      title: compactSectionLabels[section],
      content: (
        <div className="space-y-4">
          {resume[section].map((item, index) => (
            <DetailCard
              key={`${section}-${index}`}
              title={item.description?.trim() || `${compactSectionLabels[section]} ${index + 1}`}
              onRemove={() => removeCompactSectionItem(section, index)}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                    className={textareaClassName}
                    value={item.description ?? ""}
                    onChange={(event) => updateCompactSection(section, index, { description: parseInputValue(event) })}
                  />
                </label>
                <label className="space-y-2">
                  <FieldLabel>Date</FieldLabel>
                  <input className={fieldClassName} value={item.date ?? ""} onChange={(event) => updateCompactSection(section, index, { date: parseInputValue(event) })} />
                </label>
                <label className="space-y-2">
                  <FieldLabel>Link</FieldLabel>
                  <input className={fieldClassName} value={item.link ?? ""} onChange={(event) => updateCompactSection(section, index, { link: parseInputValue(event) })} />
                </label>
              </div>
            </DetailCard>
          ))}
          <AddRowButton label={`Add ${compactSectionLabels[section].toLowerCase()} item`} onClick={() => addCompactSectionItem(section)} />
        </div>
      )
    }))
  ];

  const orderedContentSections: AccordionWorkspaceItem[] = [
    ...contentSections.filter((item) => item.id === "import" || item.id === "personal"),
    ...renderOptions.sectionOrder
      .map((section) => contentSections.find((item) => item.id === section))
      .filter((item): item is AccordionWorkspaceItem => Boolean(item))
  ];

  return (
    <Panel className="flex h-full min-h-0 flex-col p-6">
      <div className="shrink-0 space-y-4">
        <EditorTabs activeTab={activeTab} onTabChange={onTabChange} />

        <SectionHeading
          eyebrow="Workspace"
          title={activeTab === "templates" ? "Choose A Template" : activeTab === "design" ? "Customize Output" : "Edit Resume Content"}
          description={
            activeTab === "templates"
              ? "Pick a template quickly and keep the PDF preview on the right."
              : activeTab === "design"
                ? "Adjust only the controls that change the rendered PDF."
                : "Edit sections inside one bounded workspace and drag them into order."
          }
        />

        <div className="rounded-[1.25rem] border border-outline-variant/15 bg-surface-container-lowest px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="lavender">Schema v{resume.meta.version}</Chip>
            <Chip tone="soft">Source: {resume.meta.source}</Chip>
            <Chip tone="mint">{selectedTemplate.label}</Chip>
            <div className="ml-auto flex flex-wrap gap-2">
              <Link
                to="/ats"
                className="inline-flex h-9 items-center justify-center rounded-full border border-outline-variant/20 bg-white px-3 text-xs font-bold uppercase tracking-[0.12em] text-on-surface transition hover:-translate-y-px"
              >
                ATS
              </Link>
              <Link
                to="/jd"
                className="inline-flex h-9 items-center justify-center rounded-full border border-outline-variant/20 bg-white px-3 text-xs font-bold uppercase tracking-[0.12em] text-on-surface transition hover:-translate-y-px"
              >
                JD
              </Link>
              <IconButton icon="ink_eraser" label="Clear" onClick={onClearResume} tone="danger" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1 min-h-0">
        {activeTab === "templates" ? (
          <WorkspaceSurface
            title="Template Library"
            description="Compact picker for the PDF layout."
            headerAside={<Chip tone="soft">{filteredTemplates.length} templates</Chip>}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 space-y-3 pb-3">
                <div className="rounded-[1.25rem] border border-outline-variant/15 bg-surface-container-high px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-label text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Current</p>
                      <p className="mt-1 font-headline text-lg font-bold text-on-surface">{selectedTemplate.label}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Chip tone={selectedTemplate.badgeTone}>{selectedTemplate.badge}</Chip>
                      <Chip tone="soft">{selectedTemplate.density}</Chip>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <SegmentedButton active={templateFilter === "all"} onClick={() => setTemplateFilter("all")}>
                    All
                  </SegmentedButton>
                  <SegmentedButton active={templateFilter === "balanced"} onClick={() => setTemplateFilter("balanced")}>
                    Balanced
                  </SegmentedButton>
                  <SegmentedButton active={templateFilter === "tight"} onClick={() => setTemplateFilter("tight")}>
                    One-page
                  </SegmentedButton>
                  <SegmentedButton active={templateFilter === "airy"} onClick={() => setTemplateFilter("airy")}>
                    Story-led
                  </SegmentedButton>
                </div>
              </div>

              <div className="workspace-scroll min-h-0 flex-1 overflow-y-scroll pr-1">
                <div className="grid gap-3 xl:grid-cols-2">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      compact
                      template={template}
                      selected={template.id === renderOptions.templateId}
                      actionLabel="Use"
                      onSelect={onTemplateChange}
                    />
                  ))}
                </div>
              </div>
            </div>
          </WorkspaceSurface>
        ) : null}

        {activeTab === "design" ? (
          <WorkspaceSurface
            title="Customize Output"
            description="Keep this compact. Reordering still happens in Content."
            headerAside={<Chip tone="mint">{selectedTemplate.label}</Chip>}
            footer={
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    onRenderOptionsChange({
                      ...DEFAULT_RENDER_OPTIONS,
                      templateId: renderOptions.templateId
                    })
                  }
                  className="flex-1 rounded-xl border-2 border-outline-variant/20 bg-surface-container-highest py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange("content")}
                  className="flex-1 rounded-xl bg-secondary py-3 text-sm font-bold text-on-secondary shadow-tactile-sm transition-transform hover:-translate-y-px"
                >
                  Done
                </button>
              </div>
            }
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="workspace-scroll min-h-0 flex-1 overflow-y-scroll pr-1">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.25rem] border border-outline-variant/15 bg-surface-container-high p-4">
                      <FieldLabel>Page Limit</FieldLabel>
                      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-outline-variant/10 bg-surface-container p-1.5">
                        <SegmentedButton active={renderOptions.pageLimit === 1} onClick={() => updateRenderOptions({ pageLimit: 1 })}>
                          1 Page
                        </SegmentedButton>
                        <SegmentedButton active={renderOptions.pageLimit === 2} onClick={() => updateRenderOptions({ pageLimit: 2 })}>
                          2 Pages
                        </SegmentedButton>
                      </div>
                    </div>

                    <div className="rounded-[1.25rem] border border-outline-variant/15 bg-surface-container-high p-4">
                      <FieldLabel>Font Size</FieldLabel>
                      <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-outline-variant/10 bg-surface-container p-1.5">
                        <SegmentedButton active={renderOptions.fontSize <= 10} onClick={() => updateRenderOptions({ fontSize: 10 })}>
                          Small
                        </SegmentedButton>
                        <SegmentedButton active={renderOptions.fontSize === 11} onClick={() => updateRenderOptions({ fontSize: 11 })}>
                          Medium
                        </SegmentedButton>
                        <SegmentedButton active={renderOptions.fontSize >= 12} onClick={() => updateRenderOptions({ fontSize: 12 })}>
                          Large
                        </SegmentedButton>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-outline-variant/15 bg-surface-container-high p-4">
                    <div className="space-y-6">
                      <RangeRow
                        label="Margins"
                        min={0.7}
                        max={1.5}
                        step={0.1}
                        value={marginValue}
                        valueLabel={`${marginValue.toFixed(1)}cm`}
                        onChange={(value) => updateRenderOptions({ margin: `${value.toFixed(1)}cm` })}
                      />
                      <RangeRow
                        label="Bullet Density"
                        min={2}
                        max={6}
                        value={renderOptions.maxBulletsPerEntry}
                        valueLabel={`${renderOptions.maxBulletsPerEntry} bullets`}
                        onChange={(value) => updateRenderOptions({ maxBulletsPerEntry: value })}
                      />
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-outline-variant/15 bg-surface-container-high p-4">
                    <p className="font-label text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Workflow Note</p>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                      Drag section headers from the Content tab to reorder the resume. The PDF on the right only updates when you compile.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </WorkspaceSurface>
        ) : null}

        {activeTab === "content" ? (
          <WorkspaceSurface
            bodyClassName="overflow-hidden"
            title="Section Workspace"
            description="Scroll the full section list here. Open sections can still scroll internally when they get long."
            headerAside={<Chip tone="soft">{Math.max(orderedContentSections.length - 2, 0)} sections</Chip>}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="mb-3 flex shrink-0 flex-wrap gap-2">
                <Chip tone="soft">Drag to reorder</Chip>
                <Chip tone="soft">One section open at a time</Chip>
              </div>
              <div className="min-h-0 flex-1">
                <AccordionWorkspace
                  items={orderedContentSections}
                  activeId={activeContentSection}
                  onChange={setActiveContentSection}
                  onReorder={reorderResumeSections}
                />
              </div>
            </div>
          </WorkspaceSurface>
        ) : null}
      </div>
    </Panel>
  );
}

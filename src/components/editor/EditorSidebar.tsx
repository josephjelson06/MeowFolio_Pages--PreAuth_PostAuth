import { useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { templateCatalog } from "../../data/templates";
import { DEFAULT_RENDER_OPTIONS } from "../../types/resume";
import type {
  CompactItem,
  CustomResumeSectionId,
  EducationItem,
  ExperienceItem,
  OrderedResumeSectionId,
  ProjectItem,
  RenderOptions,
  ResumeData,
  ResumeSectionKey
} from "../../types/resume";
import { isCustomResumeSectionId } from "../../types/resume";
import type { ResumeImportResult } from "../../types/import";
import { requestImportedResumeFile, requestImportedResumeText } from "../../lib/import-client";
import { skillsToText, splitDelimitedItems, splitLineItems, textToSkills } from "../../lib/resume";
import { cx } from "../../lib/cx";
import { Chip } from "../ui/Chip";
import { TemplateCard } from "../ui/TemplateCard";
import { AccordionSection } from "./AccordionSection";
import { type EditorTabId } from "./EditorTabs";

interface EditorSidebarProps {
  activeTab: EditorTabId;
  onResumeChange: (resume: ResumeData) => void;
  onRenderOptionsChange: (options: RenderOptions) => void;
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
  disabled = false,
  icon,
  label,
  onClick,
  tone = "surface"
}: {
  disabled?: boolean;
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
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-bold transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${toneClassName}`}
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
  canDelete?: boolean;
  canRename?: boolean;
  content: ReactNode;
  icon: string;
  id: string;
  onDelete?: () => void;
  onRename?: () => void;
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
  onReorder?: (from: OrderedResumeSectionId, to: OrderedResumeSectionId) => void;
  }) {
    const [draggedSectionId, setDraggedSectionId] = useState<OrderedResumeSectionId | null>(null);

    return (
      <div className="workspace-scroll h-[42rem] max-h-full overflow-y-scroll pr-2">
        <div className="space-y-3">
          {items.map((item) => {
            const active = item.id === activeId;
            const reorderable = Boolean(onReorder && (isResumeSectionId(item.id) || isCustomResumeSectionId(item.id)));

          function handleDragStart(event: DragEvent<HTMLElement>) {
            if (!reorderable || (!isResumeSectionId(item.id) && !isCustomResumeSectionId(item.id))) {
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
            if (
              !reorderable ||
              !draggedSectionId ||
              (!isResumeSectionId(item.id) && !isCustomResumeSectionId(item.id)) ||
              draggedSectionId === item.id
            ) {
              return;
            }

            event.preventDefault();
          }

          function handleDrop(event: DragEvent<HTMLElement>) {
            if (
              !onReorder ||
              !reorderable ||
              !draggedSectionId ||
              (!isResumeSectionId(item.id) && !isCustomResumeSectionId(item.id)) ||
              draggedSectionId === item.id
            ) {
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
              onDelete={item.canDelete ? item.onDelete : undefined}
              onRename={item.canRename ? item.onRename : undefined}
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
  onResumeChange,
  onRenderOptionsChange,
  onTemplateChange,
  renderOptions,
  resume
}: EditorSidebarProps) {
  function commit(next: ResumeData) {
    onResumeChange(next);
  }

  const customSections = Array.isArray(resume.customSections) ? resume.customSections : [];
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

  function getSectionTitle(section: ResumeSectionKey) {
    return renderOptions.sectionTitles[section]?.trim() || sectionLabels[section];
  }

  function renameBuiltInSection(section: ResumeSectionKey) {
    const nextTitle = window.prompt("Rename section", getSectionTitle(section));

    if (nextTitle === null) {
      return;
    }

    const trimmedTitle = nextTitle.trim();
    const nextSectionTitles = { ...renderOptions.sectionTitles };

    if (!trimmedTitle || trimmedTitle === sectionLabels[section]) {
      delete nextSectionTitles[section];
    } else {
      nextSectionTitles[section] = trimmedTitle;
    }

    updateRenderOptions({
      sectionTitles: nextSectionTitles
    });
  }

  function renameCustomSection(sectionId: CustomResumeSectionId) {
    const section = customSections.find((item) => item.id === sectionId);

    if (!section) {
      return;
    }

    const nextTitle = window.prompt("Rename section", section.title);

    if (nextTitle === null) {
      return;
    }

    const trimmedTitle = nextTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    commit({
      ...resume,
      customSections: customSections.map((item) =>
        item.id === sectionId
          ? {
              ...item,
              title: trimmedTitle
            }
          : item
      )
    });
  }

  function deleteSection(sectionId: OrderedResumeSectionId) {
    const label = isCustomResumeSectionId(sectionId)
      ? customSections.find((section) => section.id === sectionId)?.title || "this section"
      : getSectionTitle(sectionId);

    if (!window.confirm(`Delete ${label}?`)) {
      return;
    }

    const nextSectionOrder = renderOptions.sectionOrder.filter((section) => section !== sectionId);
    const nextSectionTitles = { ...renderOptions.sectionTitles };

    if (!isCustomResumeSectionId(sectionId)) {
      delete nextSectionTitles[sectionId];
    }

    updateRenderOptions({
      sectionOrder: nextSectionOrder,
      sectionTitles: nextSectionTitles
    });

    if (isCustomResumeSectionId(sectionId)) {
      commit({
        ...resume,
        customSections: customSections.filter((section) => section.id !== sectionId)
      });
    }

    if (activeContentSection === sectionId) {
      setActiveContentSection(null);
    }
  }

  function addSection() {
    const hiddenBuiltInSections = DEFAULT_RENDER_OPTIONS.sectionOrder.filter(
      (section): section is ResumeSectionKey =>
        isResumeSectionId(section) && !renderOptions.sectionOrder.includes(section)
    );
    const hiddenHint =
      hiddenBuiltInSections.length > 0
        ? `You can also restore: ${hiddenBuiltInSections.map((section) => sectionLabels[section]).join(", ")}.`
        : "Type a name to create a custom section.";
    const input = window.prompt(`Create section. ${hiddenHint}`, "");

    if (input === null) {
      return;
    }

    const trimmedInput = input.trim();

    if (!trimmedInput) {
      return;
    }

    const builtInMatch = hiddenBuiltInSections.find(
      (section) => sectionLabels[section].toLowerCase() === trimmedInput.toLowerCase()
    );

    if (builtInMatch) {
      updateRenderOptions({
        sectionOrder: [...renderOptions.sectionOrder, builtInMatch]
      });
      setActiveContentSection(builtInMatch);
      return;
    }

    const sectionId = `custom:${Date.now()}` as CustomResumeSectionId;

    commit({
      ...resume,
      customSections: [
        ...customSections,
        {
          id: sectionId,
          items: [],
          title: trimmedInput
        }
      ]
    });

    updateRenderOptions({
      sectionOrder: [...renderOptions.sectionOrder, sectionId]
    });
    setActiveContentSection(sectionId);
  }

  function reorderResumeSections(from: OrderedResumeSectionId, to: OrderedResumeSectionId) {
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

  function updateCustomSectionItem(sectionId: CustomResumeSectionId, index: number, patch: Partial<CompactItem>) {
    commit({
      ...resume,
      customSections: customSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
            }
          : section
      )
    });
  }

  function addCustomSectionItem(sectionId: CustomResumeSectionId) {
    commit({
      ...resume,
      customSections: customSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: [...section.items, { description: "", date: "", link: "" }]
            }
          : section
      )
    });
  }

  function removeCustomSectionItem(sectionId: CustomResumeSectionId, index: number) {
    commit({
      ...resume,
      customSections: customSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.filter((_, itemIndex) => itemIndex !== index)
            }
          : section
      )
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

  async function handleImportResume() {
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
    } catch (error) {
      setImportStatus("error");
      setImportMessage(error instanceof Error ? error.message : "Failed to import pasted resume text.");
      setImportWarnings([]);
      setImportSections([]);
    }
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
    // {
    //   id: "import",
    //   icon: "upload_file",
    //   title: "Import Resume",
    //   content: (
    //     <>
    //       <label className="space-y-2">
    //         <FieldLabel>Paste resume text for AI parsing</FieldLabel>
    //         <textarea
    //           className={`${textareaClassName} min-h-[220px]`}
    //           value={importText}
    //           placeholder="Paste a resume here. The AI parser will map it into header, summary, skills, experience, education, projects, and the compact sections."
    //           onChange={(event) => {
    //             setImportText(parseInputValue(event));
    //             if (importStatus !== "idle" || importWarnings.length > 0 || importSections.length > 0 || importSourceLabel) {
    //               resetImportFeedback();
    //             }
    //           }}
    //         />
    //       </label>
    //       <input
    //         ref={fileInputRef}
    //         type="file"
    //         accept=".txt,.md,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    //         className="hidden"
    //         onChange={handleImportFile}
    //       />
    //       <div className="mt-4 flex flex-wrap gap-3">
    //         <IconButton icon="upload" label="Import into editor" onClick={handleImportResume} />
    //         <IconButton
    //           icon="attach_file"
    //           label={importStatus === "loading" ? "Processing file..." : "Choose file"}
    //           onClick={() => fileInputRef.current?.click()}
    //         />
    //         <IconButton
    //           icon="close"
    //           label="Clear pasted text"
    //           onClick={() => {
    //             setImportText("");
    //             resetImportFeedback();
    //           }}
    //           tone="danger"
    //         />
    //       </div>
    //       <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
    //         Supports `.txt`, `.md`, `.pdf`, and `.docx` under 5 MB. Parsing is AI-first.
    //       </p>
    //       {importMessage ? (
    //         <div
    //           className={`mt-5 rounded-[1.25rem] border px-4 py-4 ${
    //             importStatus === "error"
    //               ? "border-error-container bg-error-container/40 text-on-surface"
    //               : "border-outline-variant/20 bg-surface-container-highest text-on-surface"
    //           }`}
    //         >
    //           <p className="text-sm font-semibold">{importMessage}</p>
    //           {importSourceLabel ? (
    //             <div className="mt-3">
    //               <Chip tone="lavender">{importSourceLabel}</Chip>
    //             </div>
    //           ) : null}
    //           {importSections.length > 0 ? (
    //             <div className="mt-3 flex flex-wrap gap-2">
    //               {importSections.map((section) => (
    //                 <Chip key={section} tone="mint">
    //                   {sectionLabels[section]}
    //                 </Chip>
    //               ))}
    //             </div>
    //           ) : null}
    //           {importWarnings.length > 0 ? (
    //             <div className="mt-4 space-y-2 text-sm leading-6 text-on-surface-variant">
    //               {importWarnings.map((warning) => (
    //                 <p key={warning}>{warning}</p>
    //               ))}
    //             </div>
    //           ) : null}
    //         </div>
    //       ) : null}
    //     </>
    //   )
    // },
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
      title: getSectionTitle("summary"),
      canDelete: true,
      canRename: true,
      onDelete: () => deleteSection("summary"),
      onRename: () => renameBuiltInSection("summary"),
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
      title: getSectionTitle("skills"),
      canDelete: true,
      canRename: true,
      onDelete: () => deleteSection("skills"),
      onRename: () => renameBuiltInSection("skills"),
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
      title: getSectionTitle("experience"),
      canDelete: true,
      canRename: true,
      onDelete: () => deleteSection("experience"),
      onRename: () => renameBuiltInSection("experience"),
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
      title: getSectionTitle("education"),
      canDelete: true,
      canRename: true,
      onDelete: () => deleteSection("education"),
      onRename: () => renameBuiltInSection("education"),
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
      title: getSectionTitle("projects"),
      canDelete: true,
      canRename: true,
      onDelete: () => deleteSection("projects"),
      onRename: () => renameBuiltInSection("projects"),
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
      title: getSectionTitle(section),
      canDelete: true,
      canRename: true,
      onDelete: () => deleteSection(section),
      onRename: () => renameBuiltInSection(section),
      content: (
        <div className="space-y-4">
          {(resume[section] ?? []).map((item, index) => (
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
    })),
    ...customSections.map((section) => ({
      id: section.id,
      icon: "note_stack",
      title: section.title,
      canDelete: true,
      canRename: true,
      onDelete: () => deleteSection(section.id),
      onRename: () => renameCustomSection(section.id),
      content: (
        <div className="space-y-4">
          {section.items.map((item, index) => (
            <DetailCard
              key={`${section.id}-${index}`}
              title={item.description?.trim() || `${section.title} ${index + 1}`}
              onRemove={() => removeCustomSectionItem(section.id, index)}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                    className={textareaClassName}
                    value={item.description ?? ""}
                    onChange={(event) => updateCustomSectionItem(section.id, index, { description: parseInputValue(event) })}
                  />
                </label>
                <label className="space-y-2">
                  <FieldLabel>Date</FieldLabel>
                  <input
                    className={fieldClassName}
                    value={item.date ?? ""}
                    onChange={(event) => updateCustomSectionItem(section.id, index, { date: parseInputValue(event) })}
                  />
                </label>
                <label className="space-y-2">
                  <FieldLabel>Link</FieldLabel>
                  <input
                    className={fieldClassName}
                    value={item.link ?? ""}
                    onChange={(event) => updateCustomSectionItem(section.id, index, { link: parseInputValue(event) })}
                  />
                </label>
              </div>
            </DetailCard>
          ))}
          <AddRowButton label={`Add ${section.title.toLowerCase()} item`} onClick={() => addCustomSectionItem(section.id)} />
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

  if (activeTab === "templates") {
    return (
      <WorkspaceSurface title="Template Library" description="Pick a layout.">
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 space-y-3 pb-3">
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

          <div className="workspace-scroll h-[30rem] max-h-full overflow-y-scroll pr-1">
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
    );
  }

  if (activeTab === "design") {
    return (
      <WorkspaceSurface
        title="Customize Output"
        description="Tweak the PDF."
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
            </div>
          </div>
        </div>
      </WorkspaceSurface>
    );
  }

  return (
    <WorkspaceSurface
      bodyClassName="overflow-hidden"
      title="Section Workspace"
      description="Scroll for more sections."
      headerAside={<AddRowButton label="Add section" onClick={addSection} />}
    >
      <div className="flex h-full min-h-0 flex-col">
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
  );
}

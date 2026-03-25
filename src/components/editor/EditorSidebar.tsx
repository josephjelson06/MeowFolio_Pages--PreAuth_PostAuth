import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { getTemplateDefinition, templateCatalog } from "../../data/templates";
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
import { renderOptionsToText, textToSectionOrder, TEX_TEMPLATE_OPTIONS } from "../../lib/tex";
import { Chip } from "../ui/Chip";
import { Panel } from "../ui/Panel";
import { SectionHeading } from "../ui/SectionHeading";
import { TemplateCard } from "../ui/TemplateCard";
import { AccordionSection } from "./AccordionSection";
import { type EditorTabId, EditorTabs } from "./EditorTabs";

interface EditorSidebarProps {
  activeTab: EditorTabId;
  onClearResume: () => void;
  onLoadSample: () => void;
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

function parseInputValue(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
  return event.target.value;
}

export function EditorSidebar({
  activeTab,
  onClearResume,
  onLoadSample,
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
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importSections, setImportSections] = useState<ResumeSectionKey[]>([]);
  const [importSourceLabel, setImportSourceLabel] = useState<string | null>(null);

  function updateRenderOptions(patch: Partial<RenderOptions>) {
    onRenderOptionsChange({
      ...renderOptions,
      ...patch
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
    setImportMessage(successMessage);
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

    const result = importResumeFromText(importText);
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
    setImportMessage(`Reading ${file.name}...`);
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

  return (
    <Panel className="h-full p-8">
      <div className="mb-8">
        <EditorTabs activeTab={activeTab} onTabChange={onTabChange} />
      </div>
      <SectionHeading
        eyebrow="Workspace"
        title={activeTab === "templates" ? "Choose A Template" : activeTab === "design" ? "Tune Output Settings" : "Edit Resume Content"}
        description={
          activeTab === "templates"
            ? "Pick the TeX template that should drive the live canvas, source preview, and compiled PDF output."
            : activeTab === "design"
              ? "Adjust the real output settings that flow into ATS checks and the compiled PDF."
              : "This workspace edits the canonical resume schema directly, persists locally, and updates the preview immediately."
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Chip tone="lavender">Schema v{resume.meta.version}</Chip>
        <Chip tone="soft">Source: {resume.meta.source}</Chip>
        <Chip tone="mint">{selectedTemplate.label}</Chip>
        <div className="ml-auto flex flex-wrap gap-3">
          <Link
            to="/ats"
            className="inline-flex h-10 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 text-sm font-bold text-on-surface transition hover:-translate-y-px"
          >
            Open ATS
          </Link>
          <Link
            to="/jd"
            className="inline-flex h-10 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 text-sm font-bold text-on-surface transition hover:-translate-y-px"
          >
            Open JD
          </Link>
          <IconButton icon="restart_alt" label="Load sample" onClick={onLoadSample} />
          <IconButton icon="ink_eraser" label="Clear all" onClick={onClearResume} tone="danger" />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {activeTab === "templates" ? (
          <>
            <div className="rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest p-5">
              <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Current Choice</p>
              <h3 className="mt-2 font-headline text-2xl font-extrabold text-on-surface">{selectedTemplate.label}</h3>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">{selectedTemplate.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Chip tone={selectedTemplate.badgeTone}>{selectedTemplate.badge}</Chip>
                <Chip tone="soft">{selectedTemplate.bestFor}</Chip>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
              {templateCatalog.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  selected={template.id === renderOptions.templateId}
                  actionLabel="Apply Template"
                  onSelect={onTemplateChange}
                />
              ))}
            </div>
          </>
        ) : null}

        {activeTab === "content" ? (
          <>
        <AccordionSection icon="upload_file" title="Import Resume Text">
          <label className="space-y-2">
            <FieldLabel>Paste resume text</FieldLabel>
            <textarea
              className={`${textareaClassName} min-h-[220px]`}
              value={importText}
              placeholder="Paste a resume here with headings like Summary, Experience, Education, Projects, and Skills. The parser will map what it can into the canonical schema, and you can clean up the rest in the editor."
              onChange={(event) => {
                setImportText(parseInputValue(event));
                if (importStatus !== "idle" || importWarnings.length > 0 || importSections.length > 0 || importSourceLabel) {
                  resetImportFeedback();
                }
              }}
            />
          </label>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            This first import path is deterministic and local. It works best when the pasted text has clear section headings and bullet lists.
          </p>
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
            Supports `.txt`, `.md`, `.pdf`, and `.docx` under 5 MB.
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
        </AccordionSection>
          </>
        ) : null}

        {activeTab === "design" ? (
        <AccordionSection icon="dashboard" title="Render Settings">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <FieldLabel>Template</FieldLabel>
              <select
                className={fieldClassName}
                value={renderOptions.templateId}
                onChange={(event) =>
                  onTemplateChange((event.target.value || renderOptions.templateId) as RenderOptions["templateId"])
                }
              >
                {TEX_TEMPLATE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <FieldLabel>Page Limit</FieldLabel>
              <select
                className={fieldClassName}
                value={renderOptions.pageLimit}
                onChange={(event) => updateRenderOptions({ pageLimit: Number(event.target.value) as 1 | 2 })}
              >
                <option value={1}>1 page</option>
                <option value={2}>2 pages</option>
              </select>
            </label>
            <label className="space-y-2">
              <FieldLabel>Font Size</FieldLabel>
              <input
                className={fieldClassName}
                type="number"
                min={9}
                max={14}
                value={renderOptions.fontSize}
                onChange={(event) => updateRenderOptions({ fontSize: Number(event.target.value) || 11 })}
              />
            </label>
            <label className="space-y-2">
              <FieldLabel>Max Bullets</FieldLabel>
              <input
                className={fieldClassName}
                type="number"
                min={1}
                max={8}
                value={renderOptions.maxBulletsPerEntry}
                onChange={(event) =>
                  updateRenderOptions({
                    maxBulletsPerEntry: Number(event.target.value) || renderOptions.maxBulletsPerEntry
                  })
                }
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <FieldLabel>Margin</FieldLabel>
              <input
                className={fieldClassName}
                value={renderOptions.margin}
                onChange={(event) => updateRenderOptions({ margin: parseInputValue(event) })}
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <FieldLabel>Section Order</FieldLabel>
              <textarea
                className={textareaClassName}
                value={renderOptionsToText(renderOptions.sectionOrder)}
                onChange={(event) => updateRenderOptions({ sectionOrder: textToSectionOrder(parseInputValue(event)) })}
              />
            </label>
          </div>
        </AccordionSection>
        ) : null}

        {activeTab === "design" ? (
          <div className="rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest p-5">
            <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Design Notes</p>
            <h3 className="mt-2 font-headline text-xl font-bold text-on-surface">What changes here</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-on-surface-variant">
              <p>The selected template affects the visual canvas, generated TeX source, and compiled PDF.</p>
              <p>Margins, bullet caps, section order, and font size also feed directly into ATS render checks.</p>
              <p>Use this mode to shape output quality without changing the underlying resume content.</p>
            </div>
          </div>
        ) : null}

        {activeTab === "content" ? (
          <>
        <AccordionSection icon="person" title="Personal Details">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <FieldLabel>Full Name</FieldLabel>
              <input
                className={fieldClassName}
                value={resume.header.name ?? ""}
                onChange={(event) => updateHeader("name", parseInputValue(event))}
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <FieldLabel>Role</FieldLabel>
              <input
                className={fieldClassName}
                value={resume.header.title ?? ""}
                onChange={(event) => updateHeader("title", parseInputValue(event))}
              />
            </label>
            <label className="space-y-2">
              <FieldLabel>Email</FieldLabel>
              <input
                className={fieldClassName}
                value={resume.header.email ?? ""}
                onChange={(event) => updateHeader("email", parseInputValue(event))}
              />
            </label>
            <label className="space-y-2">
              <FieldLabel>Phone</FieldLabel>
              <input
                className={fieldClassName}
                value={resume.header.phone ?? ""}
                onChange={(event) => updateHeader("phone", parseInputValue(event))}
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <FieldLabel>Location</FieldLabel>
              <input
                className={fieldClassName}
                value={resume.header.location ?? ""}
                onChange={(event) => updateHeader("location", parseInputValue(event))}
              />
            </label>
            <label className="space-y-2">
              <FieldLabel>LinkedIn</FieldLabel>
              <input
                className={fieldClassName}
                value={resume.header.linkedin ?? ""}
                onChange={(event) => updateHeader("linkedin", parseInputValue(event))}
              />
            </label>
            <label className="space-y-2">
              <FieldLabel>GitHub</FieldLabel>
              <input
                className={fieldClassName}
                value={resume.header.github ?? ""}
                onChange={(event) => updateHeader("github", parseInputValue(event))}
              />
            </label>
            <label className="space-y-2">
              <FieldLabel>Website</FieldLabel>
              <input
                className={fieldClassName}
                value={resume.header.website ?? ""}
                onChange={(event) => updateHeader("website", parseInputValue(event))}
              />
            </label>
            <label className="space-y-2">
              <FieldLabel>Portfolio</FieldLabel>
              <input
                className={fieldClassName}
                value={resume.header.portfolio ?? ""}
                onChange={(event) => updateHeader("portfolio", parseInputValue(event))}
              />
            </label>
          </div>
        </AccordionSection>

        <AccordionSection icon="auto_awesome" title="Professional Summary">
          <label className="space-y-2">
            <FieldLabel>Summary</FieldLabel>
            <textarea
              className={textareaClassName}
              value={resume.summary ?? ""}
              onChange={(event) => updateSummary(parseInputValue(event))}
            />
          </label>
        </AccordionSection>

        <AccordionSection icon="bolt" title="Skills">
          <label className="space-y-2">
            <FieldLabel>Skills</FieldLabel>
            <textarea
              className={textareaClassName}
              value={skillsToText(resume.skills)}
              onChange={(event) => updateSkills(parseInputValue(event))}
            />
          </label>
          <p className="mt-3 text-sm text-on-surface-variant">
            Use one skill per line, or grouped lines like <span className="font-semibold text-on-surface">Languages: Python, Go</span>.
          </p>
        </AccordionSection>

        <AccordionSection icon="work" title="Experience">
          <div className="space-y-4">
            {resume.experience.map((item, index) => (
              <DetailCard
                key={item.id ?? `experience-${index}`}
                title={item.role?.trim() || `Experience ${index + 1}`}
                onRemove={() => removeExperience(index)}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <FieldLabel>Role</FieldLabel>
                    <input
                      className={fieldClassName}
                      value={item.role ?? ""}
                      onChange={(event) => updateExperience(index, { role: parseInputValue(event) })}
                    />
                  </label>
                  <label className="space-y-2">
                    <FieldLabel>Company</FieldLabel>
                    <input
                      className={fieldClassName}
                      value={item.company ?? ""}
                      onChange={(event) => updateExperience(index, { company: parseInputValue(event) })}
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <FieldLabel>Location</FieldLabel>
                    <input
                      className={fieldClassName}
                      value={item.location ?? ""}
                      onChange={(event) => updateExperience(index, { location: parseInputValue(event) })}
                    />
                  </label>
                  <label className="space-y-2">
                    <FieldLabel>Start Date</FieldLabel>
                    <input
                      className={fieldClassName}
                      value={item.startDate ?? ""}
                      onChange={(event) => updateExperience(index, { startDate: parseInputValue(event) })}
                    />
                  </label>
                  <label className="space-y-2">
                    <FieldLabel>End Date</FieldLabel>
                    <input
                      className={fieldClassName}
                      value={item.endDate ?? ""}
                      onChange={(event) => updateExperience(index, { endDate: parseInputValue(event) })}
                    />
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
                    <textarea
                      className={textareaClassName}
                      value={item.description ?? ""}
                      onChange={(event) => updateExperience(index, { description: parseInputValue(event) })}
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <FieldLabel>Bullets</FieldLabel>
                    <textarea
                      className={textareaClassName}
                      value={item.bullets.join("\n")}
                      onChange={(event) => updateExperience(index, { bullets: splitLineItems(parseInputValue(event)) })}
                    />
                  </label>
                </div>
              </DetailCard>
            ))}
            <AddRowButton label="Add experience" onClick={addExperience} />
          </div>
        </AccordionSection>

        <AccordionSection icon="school" title="Education">
          <div className="space-y-4">
            {resume.education.map((item, index) => (
              <DetailCard
                key={`${item.institution}-${index}`}
                title={item.institution?.trim() || `Education ${index + 1}`}
                onRemove={() => removeEducation(index)}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <FieldLabel>Degree</FieldLabel>
                    <input
                      className={fieldClassName}
                      value={item.degree ?? ""}
                      onChange={(event) => updateEducation(index, { degree: parseInputValue(event) })}
                    />
                  </label>
                  <label className="space-y-2">
                    <FieldLabel>Field</FieldLabel>
                    <input
                      className={fieldClassName}
                      value={item.field ?? ""}
                      onChange={(event) => updateEducation(index, { field: parseInputValue(event) })}
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <FieldLabel>Institution</FieldLabel>
                    <input
                      className={fieldClassName}
                      value={item.institution ?? ""}
                      onChange={(event) => updateEducation(index, { institution: parseInputValue(event) })}
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <FieldLabel>Location</FieldLabel>
                    <input
                      className={fieldClassName}
                      value={item.location ?? ""}
                      onChange={(event) => updateEducation(index, { location: parseInputValue(event) })}
                    />
                  </label>
                  <label className="space-y-2">
                    <FieldLabel>Start Year</FieldLabel>
                    <input
                      className={fieldClassName}
                      value={item.startYear ?? ""}
                      onChange={(event) => updateEducation(index, { startYear: parseInputValue(event) })}
                    />
                  </label>
                  <label className="space-y-2">
                    <FieldLabel>End Year</FieldLabel>
                    <input
                      className={fieldClassName}
                      value={item.endYear ?? ""}
                      onChange={(event) => updateEducation(index, { endYear: parseInputValue(event) })}
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <FieldLabel>GPA</FieldLabel>
                    <input
                      className={fieldClassName}
                      value={item.gpa ?? ""}
                      onChange={(event) => updateEducation(index, { gpa: parseInputValue(event) })}
                    />
                  </label>
                </div>
              </DetailCard>
            ))}
            <AddRowButton label="Add education" onClick={addEducation} />
          </div>
        </AccordionSection>

        <AccordionSection icon="deployed_code" title="Projects">
          <div className="space-y-4">
            {resume.projects.map((item, index) => (
              <DetailCard
                key={`${item.title}-${index}`}
                title={item.title?.trim() || `Project ${index + 1}`}
                onRemove={() => removeProject(index)}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2 md:col-span-2">
                    <FieldLabel>Title</FieldLabel>
                    <input
                      className={fieldClassName}
                      value={item.title ?? ""}
                      onChange={(event) => updateProject(index, { title: parseInputValue(event) })}
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <FieldLabel>Link</FieldLabel>
                    <input
                      className={fieldClassName}
                      value={item.link ?? ""}
                      onChange={(event) => updateProject(index, { link: parseInputValue(event) })}
                    />
                  </label>
                  <label className="space-y-2">
                    <FieldLabel>Start Date</FieldLabel>
                    <input
                      className={fieldClassName}
                      value={item.startDate ?? ""}
                      onChange={(event) => updateProject(index, { startDate: parseInputValue(event) })}
                    />
                  </label>
                  <label className="space-y-2">
                    <FieldLabel>End Date</FieldLabel>
                    <input
                      className={fieldClassName}
                      value={item.endDate ?? ""}
                      onChange={(event) => updateProject(index, { endDate: parseInputValue(event) })}
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <FieldLabel>Description</FieldLabel>
                    <textarea
                      className={textareaClassName}
                      value={item.description ?? ""}
                      onChange={(event) => updateProject(index, { description: parseInputValue(event) })}
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <FieldLabel>Technologies</FieldLabel>
                    <textarea
                      className={textareaClassName}
                      value={item.technologies.join("\n")}
                      onChange={(event) => updateProject(index, { technologies: splitDelimitedItems(parseInputValue(event)) })}
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <FieldLabel>Bullets</FieldLabel>
                    <textarea
                      className={textareaClassName}
                      value={item.bullets.join("\n")}
                      onChange={(event) => updateProject(index, { bullets: splitLineItems(parseInputValue(event)) })}
                    />
                  </label>
                </div>
              </DetailCard>
            ))}
            <AddRowButton label="Add project" onClick={addProject} />
          </div>
        </AccordionSection>

        {(Object.keys(compactSectionLabels) as Array<keyof typeof compactSectionLabels>).map((section) => (
          <AccordionSection key={section} icon="format_list_bulleted" title={compactSectionLabels[section]}>
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
                        onChange={(event) =>
                          updateCompactSection(section, index, { description: parseInputValue(event) })
                        }
                      />
                    </label>
                    <label className="space-y-2">
                      <FieldLabel>Date</FieldLabel>
                      <input
                        className={fieldClassName}
                        value={item.date ?? ""}
                        onChange={(event) => updateCompactSection(section, index, { date: parseInputValue(event) })}
                      />
                    </label>
                    <label className="space-y-2">
                      <FieldLabel>Link</FieldLabel>
                      <input
                        className={fieldClassName}
                        value={item.link ?? ""}
                        onChange={(event) => updateCompactSection(section, index, { link: parseInputValue(event) })}
                      />
                    </label>
                  </div>
                </DetailCard>
              ))}
              <AddRowButton
                label={`Add ${compactSectionLabels[section].toLowerCase()} item`}
                onClick={() => addCompactSectionItem(section)}
              />
            </div>
          </AccordionSection>
        ))}
          </>
        ) : null}
      </div>
    </Panel>
  );
}

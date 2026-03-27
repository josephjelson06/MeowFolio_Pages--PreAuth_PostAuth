import { useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { templateCatalog } from "../../data/templates";
import { requestImportedResumeFile, requestImportedResumeText } from "../../lib/import-client";
import { getProfileLabel, splitDelimitedItems } from "../../lib/resume";
import { cx } from "../../lib/cx";
import type { ResumeImportResult } from "../../types/import";
import {
  DEFAULT_RENDER_OPTIONS,
  GENERIC_CUSTOM_SECTION_LABELS,
  MONTH_OPTIONS,
  RESUME_SECTION_LABELS,
  createEmptyCustomEntry,
  createEmptyDateField,
  createEmptyDescriptionField,
  createEmptyLinkField,
  createEmptySkillGroup,
  isGenericCustomSectionKey,
  type CertificationEntry,
  type CustomEntriesSection,
  type DateField,
  type DateFieldMode,
  type DescriptionField,
  type EducationEntry,
  type ExperienceEntry,
  type GenericCustomSectionKey,
  type GroupedInputMode,
  type HobbiesSection,
  type LanguageItem,
  type LanguagesSection,
  type LinkField,
  type LinkDisplayMode,
  type ProfileMode,
  type ProjectEntry,
  type RenderOptions,
  type ResumeData,
  type ResumeSectionKey,
  type SkillsSection
} from "../../types/resume";
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
const selectClassName = `${fieldClassName} appearance-none`;

const genericSectionKeys: GenericCustomSectionKey[] = ["leadership", "achievements", "competitions", "extracurricular", "publications", "openSource"];
const dateModeOptions: Array<{ label: string; value: DateFieldMode }> = [
  { label: "MM / YYYY", value: "mm-yyyy" },
  { label: "YYYY", value: "yyyy" },
  { label: "MM / YYYY - MM / YYYY", value: "mm-yyyy-range" },
  { label: "YYYY - YYYY", value: "yyyy-range" },
  { label: "MM / YYYY - Present", value: "mm-yyyy-present" },
  { label: "YYYY - Present", value: "yyyy-present" }
];
const groupedModeOptions: Array<{ label: string; value: GroupedInputMode }> = [
  { label: "CSV", value: "csv" },
  { label: "Grouped", value: "grouped" }
];
const profileModeOptions: Array<{ label: string; value: ProfileMode }> = [
  { label: "Career Objective", value: "career-objective" },
  { label: "Professional Summary", value: "professional-summary" }
];
const linkDisplayOptions: Array<{ label: string; value: LinkDisplayMode }> = [
  { label: "Plain URL", value: "plain-url" },
  { label: "Hyperlinked Text", value: "hyperlinked-text" }
];
const educationLevelOptions: Array<{ label: string; value: EducationEntry["level"] }> = [
  { label: "Degree / Diploma", value: "degree-diploma" },
  { label: "Class 12 / Intermediate", value: "class-12" },
  { label: "Class 10 / Matriculation", value: "class-10" },
  { label: "Other", value: "other" }
];
const resultTypeOptions: Array<{ label: string; value: NonNullable<EducationEntry["resultType"]> }> = [
  { label: "CGPA (10.0)", value: "cgpa-10" },
  { label: "GPA (4.0)", value: "gpa-4" },
  { label: "Percentage", value: "percentage" },
  { label: "Grade", value: "grade" },
  { label: "Not Disclosed", value: "not-disclosed" }
];
const languageProficiencyOptions: Array<{ label: string; value: NonNullable<LanguageItem["proficiency"]> }> = [
  { label: "Native", value: "native" },
  { label: "Fluent", value: "fluent" },
  { label: "Conversational", value: "conversational" },
  { label: "Basic", value: "basic" }
];
const sectionIconMap: Record<string, string> = {
  achievements: "emoji_events",
  certifications: "workspace_premium",
  competitions: "military_tech",
  education: "school",
  experience: "work",
  extracurricular: "sports_score",
  hobbies: "interests",
  import: "upload_file",
  languages: "language",
  leadership: "groups",
  openSource: "code",
  personal: "person",
  projects: "deployed_code",
  publications: "article",
  skills: "bolt",
  summary: "auto_awesome"
};

function FieldLabel({ children }: { children: string }) {
  return <span className="ml-1 block font-label text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">{children}</span>;
}

function IconButton({ disabled = false, icon, label, onClick, tone = "surface" }: { disabled?: boolean; icon: string; label: string; onClick: () => void; tone?: "danger" | "surface"; }) {
  const toneClassName = tone === "danger" ? "border-error-container bg-error-container/60 text-error" : "border-outline-variant/20 bg-surface-container-lowest text-on-surface";
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-bold transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${toneClassName}`}>
      <span className="inline-flex items-center gap-2"><span className="material-symbols-outlined text-lg">{icon}</span>{label}</span>
    </button>
  );
}

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface transition hover:-translate-y-px hover:bg-white">
      <span className="material-symbols-outlined text-lg text-primary">add</span>{label}
    </button>
  );
}

function SegmentedButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={active ? "rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-on-surface shadow-tactile-sm" : "rounded-xl px-4 py-2.5 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-highest"}>{children}</button>;
}

function RangeRow({ label, max, min, onChange, step = 1, value, valueLabel }: { label: string; max: number; min: number; onChange: (value: number) => void; step?: number; value: number; valueLabel: string; }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4"><FieldLabel>{label}</FieldLabel><span className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">{valueLabel}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-full bg-outline-variant/30 accent-primary" />
    </div>
  );
}

function DetailCard({ children, title, onRemove }: { children: ReactNode; title: string; onRemove: () => void }) {
  return (
    <div className="rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h4 className="font-headline text-lg font-bold text-on-surface">{title}</h4>
        <button type="button" onClick={onRemove} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-error-container/60 text-error transition hover:-translate-y-px" aria-label={`Remove ${title}`}>
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
      {children}
    </div>
  );
}

function WorkspaceSurface({ bodyClassName, children, description, footer, headerAside, title }: { bodyClassName?: string; children: ReactNode; description?: string; footer?: ReactNode; headerAside?: ReactNode; title: string; }) {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest shadow-ambient">
      <div className="shrink-0 border-b border-outline-variant/15 px-4 py-3"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="font-headline text-base font-bold text-on-surface">{title}</p>{description ? <p className="mt-1 text-xs leading-5 text-on-surface-variant">{description}</p> : null}</div>{headerAside ? <div className="shrink-0">{headerAside}</div> : null}</div></div>
      <div className={cx("min-h-0 flex-1 overflow-hidden p-3", bodyClassName)}>{children}</div>
      {footer ? <div className="shrink-0 border-t border-outline-variant/15 bg-surface-container px-4 py-3">{footer}</div> : null}
    </section>
  );
}

function EditableStringList({ addLabel, onChange, placeholder, values }: { addLabel: string; onChange: (values: string[]) => void; placeholder: string; values: string[]; }) {
  const safeValues = values.length > 0 ? values : [""];
  return (
    <div className="space-y-3">
      {safeValues.map((value, index) => (
        <div key={`${placeholder}-${index}`} className="flex items-center gap-3">
          <input className={fieldClassName} value={value} placeholder={placeholder} onChange={(event) => { const nextValues = [...safeValues]; nextValues[index] = event.target.value; onChange(nextValues); }} />
          <button type="button" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-container/60 text-error transition hover:-translate-y-px" onClick={() => onChange(safeValues.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove item"><span className="material-symbols-outlined text-lg">delete</span></button>
        </div>
      ))}
      <AddRowButton label={addLabel} onClick={() => onChange([...safeValues.filter((item) => item.trim().length > 0), ""])} />
    </div>
  );
}
function LinkFieldEditor({ label, onChange, value }: { label: string; onChange: (value: LinkField) => void; value: LinkField; }) {
  return (
    <div className="space-y-4 rounded-[1.25rem] border border-outline-variant/15 bg-surface-container-high p-4">
      <FieldLabel>{label}</FieldLabel>
      <input className={fieldClassName} value={value.url ?? ""} placeholder="https://..." onChange={(event) => onChange({ ...value, url: event.target.value })} />
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-outline-variant/10 bg-surface-container p-1.5">
        {linkDisplayOptions.map((option) => <SegmentedButton key={option.value} active={value.displayMode === option.value} onClick={() => onChange({ ...value, displayMode: option.value })}>{option.label}</SegmentedButton>)}
      </div>
      {value.displayMode === "hyperlinked-text" ? <input className={fieldClassName} value={value.displayText ?? ""} placeholder="View Certificate" onChange={(event) => onChange({ ...value, displayText: event.target.value })} /> : null}
      <p className="text-xs leading-5 text-on-surface-variant">Plain URL is safer for ATS and print.</p>
    </div>
  );
}

function DateFieldEditor({ allowOngoing = false, label, onChange, value }: { allowOngoing?: boolean; label: string; onChange: (value: DateField) => void; value: DateField; }) {
  const usesMonth = value.mode.startsWith("mm");
  const isRange = value.mode.includes("range");
  const isPresent = value.mode.endsWith("present");
  function updateMode(nextMode: DateFieldMode) { onChange({ ...value, isOngoing: nextMode.endsWith("present"), mode: nextMode }); }
  function toggleOngoing(next: boolean) {
    if (!allowOngoing) { return; }
    updateMode(next ? (value.mode.startsWith("yyyy") ? "yyyy-present" : "mm-yyyy-present") : (value.mode.startsWith("yyyy") ? "yyyy-range" : "mm-yyyy-range"));
  }
  return (
    <div className="space-y-4 rounded-[1.25rem] border border-outline-variant/15 bg-surface-container-high p-4">
      <FieldLabel>{label}</FieldLabel>
      <select className={selectClassName} value={value.mode} onChange={(event) => updateMode(event.target.value as DateFieldMode)}>{dateModeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {usesMonth ? <label className="space-y-2"><FieldLabel>Start Month</FieldLabel><select className={selectClassName} value={value.startMonth ?? ""} onChange={(event) => onChange({ ...value, startMonth: event.target.value as DateField["startMonth"] })}><option value="">Month</option>{MONTH_OPTIONS.map((month) => <option key={month} value={month}>{month}</option>)}</select></label> : null}
        <label className="space-y-2"><FieldLabel>{isRange || isPresent ? "Start Year" : "Year"}</FieldLabel><input className={fieldClassName} value={value.startYear ?? ""} placeholder="2026" onChange={(event) => onChange({ ...value, startYear: event.target.value })} /></label>
        {isRange && !isPresent && usesMonth ? <label className="space-y-2"><FieldLabel>End Month</FieldLabel><select className={selectClassName} value={value.endMonth ?? ""} onChange={(event) => onChange({ ...value, endMonth: event.target.value as DateField["endMonth"] })}><option value="">Month</option>{MONTH_OPTIONS.map((month) => <option key={month} value={month}>{month}</option>)}</select></label> : null}
        {isRange && !isPresent ? <label className="space-y-2"><FieldLabel>End Year</FieldLabel><input className={fieldClassName} value={value.endYear ?? ""} placeholder="2027" onChange={(event) => onChange({ ...value, endYear: event.target.value })} /></label> : null}
      </div>
      {allowOngoing ? <label className="inline-flex items-center gap-3 rounded-2xl bg-surface-container-highest px-4 py-3"><input type="checkbox" checked={Boolean(isPresent || value.isOngoing)} onChange={(event) => toggleOngoing(event.target.checked)} /><span className="text-sm font-semibold text-on-surface">Ongoing / Present</span></label> : null}
    </div>
  );
}

function DescriptionFieldEditor({ label, onChange, value }: { label: string; onChange: (value: DescriptionField) => void; value: DescriptionField; }) {
  return (
    <div className="space-y-4 rounded-[1.25rem] border border-outline-variant/15 bg-surface-container-high p-4">
      <FieldLabel>{label}</FieldLabel>
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-outline-variant/10 bg-surface-container p-1.5">
        <SegmentedButton active={value.mode === "bullets"} onClick={() => onChange({ ...value, mode: "bullets" })}>Bullets</SegmentedButton>
        <SegmentedButton active={value.mode === "paragraph"} onClick={() => onChange({ ...value, mode: "paragraph" })}>Paragraph</SegmentedButton>
      </div>
      {value.mode === "bullets" ? <EditableStringList addLabel="Add bullet" values={value.bullets} placeholder="Describe impact, outcome, or contribution" onChange={(bullets) => onChange({ ...value, bullets })} /> : <textarea className={textareaClassName} value={value.paragraph ?? ""} onChange={(event) => onChange({ ...value, paragraph: event.target.value })} />}
    </div>
  );
}

function parseInputValue(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) { return event.target.value; }
interface AccordionWorkspaceItem { canDelete?: boolean; canRename?: boolean; content: ReactNode; icon: string; id: string; onDelete?: () => void; onRename?: () => void; reorderable?: boolean; title: string; }

function AccordionWorkspace({ activeId, items, onChange, onReorder }: { activeId: string | null; items: AccordionWorkspaceItem[]; onChange: (id: string | null) => void; onReorder?: (from: ResumeSectionKey, to: ResumeSectionKey) => void; }) {
  const [draggedSectionId, setDraggedSectionId] = useState<ResumeSectionKey | null>(null);
  return (
    <div className="workspace-scroll h-[42rem] max-h-full overflow-y-auto pr-2">
      <div className="space-y-3">
        {items.map((item) => {
          const active = item.id === activeId;
          const reorderable = Boolean(item.reorderable && onReorder);
          function handleDragStart(event: DragEvent<HTMLElement>) { if (!reorderable) { return; } event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", item.id); setDraggedSectionId(item.id as ResumeSectionKey); }
          function handleDragEnd() { setDraggedSectionId(null); }
          function handleDragOver(event: DragEvent<HTMLElement>) { if (!reorderable || !draggedSectionId || draggedSectionId === item.id) { return; } event.preventDefault(); }
          function handleDrop(event: DragEvent<HTMLElement>) { if (!onReorder || !reorderable || !draggedSectionId || draggedSectionId === item.id) { return; } event.preventDefault(); onReorder(draggedSectionId, item.id as ResumeSectionKey); setDraggedSectionId(null); }
          return <AccordionSection key={item.id} active={active} dragActive={Boolean(reorderable && draggedSectionId === item.id)} draggable={reorderable} icon={item.icon} onDelete={item.canDelete ? item.onDelete : undefined} onDragEnd={reorderable ? handleDragEnd : undefined} onDragOver={reorderable ? handleDragOver : undefined} onDragStart={reorderable ? handleDragStart : undefined} onDrop={reorderable ? handleDrop : undefined} onRename={item.canRename ? item.onRename : undefined} title={item.title} onToggle={() => onChange(active ? null : item.id)}>{item.content}</AccordionSection>;
        })}
      </div>
    </div>
  );
}

function normalizeSectionTitleInput(value: string) { return value.trim().replace(/\s+/g, " "); }

export function EditorSidebar({ activeTab, onResumeChange, onRenderOptionsChange, onTemplateChange, renderOptions, resume }: EditorSidebarProps) {
  function commit(next: ResumeData) { onResumeChange({ ...next, meta: { ...next.meta, updatedAt: new Date().toISOString() } }); }
  function updateRenderOptions(patch: Partial<RenderOptions>) { onRenderOptionsChange({ ...renderOptions, ...patch }); }
  function updateSectionOrder(nextSectionOrder: ResumeSectionKey[]) { updateRenderOptions({ sectionOrder: nextSectionOrder }); }
  function getSectionTitle(section: ResumeSectionKey) {
    if (isGenericCustomSectionKey(section)) { return resume[section].label?.trim() || GENERIC_CUSTOM_SECTION_LABELS[section]; }
    if (section === "summary") { return renderOptions.sectionTitles.summary?.trim() || getProfileLabel(resume); }
    return renderOptions.sectionTitles[section]?.trim() || RESUME_SECTION_LABELS[section];
  }
  function renameSection(section: ResumeSectionKey) {
    const nextTitle = window.prompt("Rename section", getSectionTitle(section));
    if (nextTitle === null) { return; }
    const trimmedTitle = normalizeSectionTitleInput(nextTitle);
    if (isGenericCustomSectionKey(section)) { commit({ ...resume, [section]: { ...resume[section], label: trimmedTitle || GENERIC_CUSTOM_SECTION_LABELS[section] } }); return; }
    const nextSectionTitles = { ...renderOptions.sectionTitles };
    const defaultTitle = section === "summary" ? getProfileLabel(resume) : RESUME_SECTION_LABELS[section];
    if (!trimmedTitle || trimmedTitle === defaultTitle) { delete nextSectionTitles[section]; } else { nextSectionTitles[section] = trimmedTitle; }
    updateRenderOptions({ sectionTitles: nextSectionTitles });
  }
  function deleteSection(section: ResumeSectionKey) {
    if (!window.confirm(`Hide ${getSectionTitle(section)} from the current resume layout?`)) { return; }
    updateSectionOrder(renderOptions.sectionOrder.filter((item) => item !== section));
    if (activeContentSection === section) { setActiveContentSection(null); }
  }
  function addSection() {
    const hiddenSections = DEFAULT_RENDER_OPTIONS.sectionOrder.filter((section) => !renderOptions.sectionOrder.includes(section));
    if (hiddenSections.length === 0) { window.alert("All available sections are already visible."); return; }
    const promptValue = window.prompt(`Add section:\n${hiddenSections.map((section) => `- ${getSectionTitle(section)}`).join("\n")}`, getSectionTitle(hiddenSections[0]));
    if (promptValue === null) { return; }
    const normalizedInput = normalizeSectionTitleInput(promptValue).toLowerCase();
    if (!normalizedInput) { return; }
    const matchedSection = hiddenSections.find((section) => [getSectionTitle(section), RESUME_SECTION_LABELS[section], isGenericCustomSectionKey(section) ? GENERIC_CUSTOM_SECTION_LABELS[section] : ""].some((candidate) => candidate.trim().toLowerCase() === normalizedInput));
    if (!matchedSection) { window.alert("That section is not available to add right now."); return; }
    updateSectionOrder([...renderOptions.sectionOrder, matchedSection]);
    setActiveContentSection(matchedSection);
  }
  function reorderResumeSections(from: ResumeSectionKey, to: ResumeSectionKey) {
    if (from === to) { return; }
    const fromIndex = renderOptions.sectionOrder.indexOf(from);
    const toIndex = renderOptions.sectionOrder.indexOf(to);
    if (fromIndex === -1 || toIndex === -1) { return; }
    const nextSectionOrder = [...renderOptions.sectionOrder];
    const [moved] = nextSectionOrder.splice(fromIndex, 1);
    nextSectionOrder.splice(toIndex, 0, moved);
    updateSectionOrder(nextSectionOrder);
  }
  function updateHeaderField(field: keyof ResumeData["header"], value: string) { commit({ ...resume, header: { ...resume.header, [field]: value } }); }
  function updateHeaderLink(field: "github" | "linkedin" | "website", value: LinkField) { commit({ ...resume, header: { ...resume.header, [field]: value } }); }
  function updateSummary(patch: Partial<ResumeData["summary"]>) { commit({ ...resume, summary: { ...resume.summary, ...patch } }); }
  function updateEducation(index: number, patch: Partial<EducationEntry>) { commit({ ...resume, education: resume.education.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) }); }
  function addEducation() { commit({ ...resume, education: [...resume.education, { boardOrUniversity: "", date: createEmptyDateField("yyyy-range"), degree: "", field: "", institution: "", level: "degree-diploma", location: "", result: "", resultType: null }] }); }
  function removeEducation(index: number) { commit({ ...resume, education: resume.education.filter((_, itemIndex) => itemIndex !== index) }); }
  function setSkills(nextSkills: SkillsSection) { commit({ ...resume, skills: nextSkills }); }
  function updateExperience(index: number, patch: Partial<ExperienceEntry>) { commit({ ...resume, experience: resume.experience.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) }); }
  function addExperience() { commit({ ...resume, experience: [...resume.experience, { company: "", date: createEmptyDateField("mm-yyyy-range"), description: createEmptyDescriptionField("bullets"), isCurrent: false, location: "", role: "" }] }); }
  function removeExperience(index: number) { commit({ ...resume, experience: resume.experience.filter((_, itemIndex) => itemIndex !== index) }); }
  function updateProject(index: number, patch: Partial<ProjectEntry>) { commit({ ...resume, projects: resume.projects.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) }); }
  function addProject() { commit({ ...resume, projects: [...resume.projects, { date: createEmptyDateField("mm-yyyy-range"), description: createEmptyDescriptionField("bullets"), githubLink: createEmptyLinkField(), liveLink: createEmptyLinkField(), technologies: [], title: "" }] }); }
  function removeProject(index: number) { commit({ ...resume, projects: resume.projects.filter((_, itemIndex) => itemIndex !== index) }); }
  function updateCertification(index: number, patch: Partial<CertificationEntry>) { commit({ ...resume, certifications: resume.certifications.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) }); }
  function addCertification() { commit({ ...resume, certifications: [...resume.certifications, { date: createEmptyDateField("mm-yyyy"), description: "", issuer: "", link: createEmptyLinkField(), title: "" }] }); }
  function removeCertification(index: number) { commit({ ...resume, certifications: resume.certifications.filter((_, itemIndex) => itemIndex !== index) }); }
  function updateCustomSection(section: GenericCustomSectionKey, nextSection: CustomEntriesSection) { commit({ ...resume, [section]: nextSection }); }
  function updateCustomSectionEntry(section: GenericCustomSectionKey, index: number, patch: Partial<CustomEntriesSection["entries"][number]>) { updateCustomSection(section, { ...resume[section], entries: resume[section].entries.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) }); }
  function addCustomSectionEntry(section: GenericCustomSectionKey) { updateCustomSection(section, { ...resume[section], entries: [...resume[section].entries, createEmptyCustomEntry()] }); }
  function removeCustomSectionEntry(section: GenericCustomSectionKey, index: number) { updateCustomSection(section, { ...resume[section], entries: resume[section].entries.filter((_, itemIndex) => itemIndex !== index) }); }
  function setLanguages(nextLanguages: LanguagesSection) { commit({ ...resume, languages: nextLanguages }); }
  function setHobbies(nextHobbies: HobbiesSection) { commit({ ...resume, hobbies: nextHobbies }); }

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeContentSection, setActiveContentSection] = useState<string | null>("personal");
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importSections, setImportSections] = useState<ResumeSectionKey[]>([]);
  const [importSourceLabel, setImportSourceLabel] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState<"all" | "balanced" | "tight" | "airy">("all");

  function resetImportFeedback() { setImportStatus("idle"); setImportMessage(null); setImportWarnings([]); setImportSections([]); setImportSourceLabel(null); }
  function applyImportedResume(result: ResumeImportResult, successMessage: string, sourceLabel: string, nextImportText?: string) {
    commit(result.resume);
    setImportStatus("success");
    setImportMessage(`${successMessage} (AI parse${result.meta.cached ? ", cached" : ""}, ${result.meta.confidence} confidence)`);
    setImportWarnings(result.warnings); setImportSections(result.summary.detectedSections); setImportSourceLabel(sourceLabel);
    if (typeof nextImportText === "string") { setImportText(nextImportText); }
  }
  async function handleImportResume() {
    if (!importText.trim()) { setImportStatus("error"); setImportMessage("Paste resume text before trying to import it."); setImportWarnings([]); setImportSections([]); return; }
    setImportStatus("loading"); setImportMessage("Running AI resume parse...");
    try {
      const response = await requestImportedResumeText(importText); const result = response.result;
      const hasImportedData = Boolean(result.resume.header.name?.trim() || result.resume.summary.content?.trim() || result.resume.experience.length || result.resume.education.length || result.resume.projects.length);
      if (!hasImportedData) { setImportStatus("error"); setImportMessage("No structured resume content could be detected from that pasted text."); setImportWarnings(result.warnings); setImportSections(result.summary.detectedSections); setImportSourceLabel("Pasted text"); return; }
      applyImportedResume(result, `Imported ${result.summary.experienceCount} experience, ${result.summary.educationCount} education, ${result.summary.projectCount} projects, and ${result.summary.skillCount} skills.`, "Pasted text");
    } catch (error) { setImportStatus("error"); setImportMessage(error instanceof Error ? error.message : "Failed to import pasted resume text."); setImportWarnings([]); setImportSections([]); }
  }
  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) { return; }
    setImportStatus("loading"); setImportMessage(`Extracting text from ${file.name} and sending it to the AI parser...`); setImportWarnings([]); setImportSections([]); setImportSourceLabel(file.name);
    try {
      const response = await requestImportedResumeFile(file); const { result } = response;
      const hasImportedData = Boolean(result.resume.header.name?.trim() || result.resume.summary.content?.trim() || result.resume.experience.length || result.resume.education.length || result.resume.projects.length);
      if (!hasImportedData) { setImportStatus("error"); setImportMessage(`No structured resume content could be detected in ${file.name}.`); setImportWarnings(result.warnings); setImportSections(result.summary.detectedSections); return; }
      applyImportedResume(result, `Imported ${file.name} with ${result.summary.experienceCount} experience, ${result.summary.educationCount} education, ${result.summary.projectCount} projects, and ${result.summary.skillCount} skills.`, file.name, response.extractedText);
    } catch (error) { setImportStatus("error"); setImportMessage(error instanceof Error ? error.message : `Failed to import ${file.name}.`); setImportWarnings([]); setImportSections([]); } finally { event.target.value = ""; }
  }

  const filteredTemplates = templateCatalog.filter((template) => (templateFilter === "all" ? true : template.density === templateFilter));
  const marginValue = Number.parseFloat(renderOptions.margin) || 1;
  const contentSections: AccordionWorkspaceItem[] = [
    {
      id: "import",
      icon: sectionIconMap.import,
      title: "Import Resume",
      content: (
        <div className="space-y-5">
          <label className="space-y-2">
            <FieldLabel>Paste resume text for AI parsing</FieldLabel>
            <textarea className={`${textareaClassName} min-h-[220px]`} value={importText} placeholder="Paste a resume here. AI will map it into the canonical resume schema." onChange={(event) => { setImportText(parseInputValue(event)); if (importStatus !== "idle" || importWarnings.length > 0 || importSections.length > 0 || importSourceLabel) { resetImportFeedback(); } }} />
          </label>
          <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={handleImportFile} />
          <div className="flex flex-wrap gap-3">
            <IconButton icon="upload" label="Import Text" onClick={handleImportResume} disabled={importStatus === "loading"} />
            <IconButton icon="attach_file" label={importStatus === "loading" ? "Processing..." : "Choose File"} onClick={() => fileInputRef.current?.click()} disabled={importStatus === "loading"} />
            <IconButton icon="close" label="Clear" tone="danger" onClick={() => { setImportText(""); resetImportFeedback(); }} />
          </div>
          {importMessage ? (
            <div className={`rounded-[1.25rem] border px-4 py-4 ${importStatus === "error" ? "border-error-container bg-error-container/40 text-on-surface" : "border-outline-variant/20 bg-surface-container-highest text-on-surface"}`}>
              <p className="text-sm font-semibold">{importMessage}</p>
              {importSourceLabel ? <div className="mt-3"><Chip tone="lavender">{importSourceLabel}</Chip></div> : null}
              {importSections.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{importSections.map((section) => <Chip key={section} tone="mint">{getSectionTitle(section)}</Chip>)}</div> : null}
              {importWarnings.length > 0 ? <div className="mt-4 space-y-2 text-sm leading-6 text-on-surface-variant">{importWarnings.map((warning) => <p key={warning}>{warning}</p>)}</div> : null}
            </div>
          ) : null}
        </div>
      )
    },
    {
      id: "personal",
      icon: sectionIconMap.personal,
      title: "Personal Details",
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2"><FieldLabel>Name</FieldLabel><input className={fieldClassName} value={resume.header.name ?? ""} onChange={(event) => updateHeaderField("name", parseInputValue(event))} /></label>
            <label className="space-y-2 md:col-span-2"><FieldLabel>Role</FieldLabel><input className={fieldClassName} value={resume.header.role ?? ""} onChange={(event) => updateHeaderField("role", parseInputValue(event))} /></label>
            <label className="space-y-2"><FieldLabel>Phone</FieldLabel><input className={fieldClassName} value={resume.header.phone ?? ""} onChange={(event) => updateHeaderField("phone", parseInputValue(event))} /></label>
            <label className="space-y-2"><FieldLabel>Email</FieldLabel><input className={fieldClassName} value={resume.header.email ?? ""} onChange={(event) => updateHeaderField("email", parseInputValue(event))} /></label>
            <label className="space-y-2 md:col-span-2"><FieldLabel>Address</FieldLabel><input className={fieldClassName} value={resume.header.address ?? ""} onChange={(event) => updateHeaderField("address", parseInputValue(event))} /></label>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <LinkFieldEditor label="GitHub" value={resume.header.github} onChange={(value) => updateHeaderLink("github", value)} />
            <LinkFieldEditor label="LinkedIn" value={resume.header.linkedin} onChange={(value) => updateHeaderLink("linkedin", value)} />
            <LinkFieldEditor label="Website / Portfolio" value={resume.header.website} onChange={(value) => updateHeaderLink("website", value)} />
          </div>
        </div>
      )
    },
    {
      id: "summary",
      icon: sectionIconMap.summary,
      title: getSectionTitle("summary"),
      canDelete: true,
      canRename: true,
      reorderable: true,
      onDelete: () => deleteSection("summary"),
      onRename: () => renameSection("summary"),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-outline-variant/10 bg-surface-container p-1.5">{profileModeOptions.map((option) => <SegmentedButton key={option.value} active={resume.summary.mode === option.value} onClick={() => updateSummary({ mode: option.value })}>{option.label}</SegmentedButton>)}</div>
          <textarea className={textareaClassName} value={resume.summary.content ?? ""} onChange={(event) => updateSummary({ content: parseInputValue(event) })} />
        </div>
      )
    },
    {
      id: "education",
      icon: sectionIconMap.education,
      title: getSectionTitle("education"),
      canDelete: true,
      canRename: true,
      reorderable: true,
      onDelete: () => deleteSection("education"),
      onRename: () => renameSection("education"),
      content: (
        <div className="space-y-4">
          {resume.education.map((item, index) => (
            <DetailCard key={`education-${index}`} title={item.institution?.trim() || item.degree?.trim() || `Education ${index + 1}`} onRemove={() => removeEducation(index)}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2"><FieldLabel>Level</FieldLabel><select className={selectClassName} value={item.level} onChange={(event) => updateEducation(index, { level: event.target.value as EducationEntry["level"] })}>{educationLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className="space-y-2"><FieldLabel>Result Type</FieldLabel><select className={selectClassName} value={item.resultType ?? ""} onChange={(event) => updateEducation(index, { resultType: event.target.value ? (event.target.value as EducationEntry["resultType"]) : null })}><option value="">Select</option>{resultTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className="space-y-2"><FieldLabel>Degree</FieldLabel><input className={fieldClassName} value={item.degree ?? ""} onChange={(event) => updateEducation(index, { degree: parseInputValue(event) })} /></label>
                  <label className="space-y-2"><FieldLabel>Field</FieldLabel><input className={fieldClassName} value={item.field ?? ""} onChange={(event) => updateEducation(index, { field: parseInputValue(event) })} /></label>
                  <label className="space-y-2 md:col-span-2"><FieldLabel>Institution</FieldLabel><input className={fieldClassName} value={item.institution ?? ""} onChange={(event) => updateEducation(index, { institution: parseInputValue(event) })} /></label>
                  <label className="space-y-2"><FieldLabel>Board / University</FieldLabel><input className={fieldClassName} value={item.boardOrUniversity ?? ""} onChange={(event) => updateEducation(index, { boardOrUniversity: parseInputValue(event) })} /></label>
                  <label className="space-y-2"><FieldLabel>Location</FieldLabel><input className={fieldClassName} value={item.location ?? ""} onChange={(event) => updateEducation(index, { location: parseInputValue(event) })} /></label>
                  <label className="space-y-2 md:col-span-2"><FieldLabel>Result</FieldLabel><input className={fieldClassName} value={item.result ?? ""} onChange={(event) => updateEducation(index, { result: parseInputValue(event) })} /></label>
                </div>
                <DateFieldEditor label="Dates" value={item.date} onChange={(value) => updateEducation(index, { date: value })} />
              </div>
            </DetailCard>
          ))}
          <AddRowButton label="Add education" onClick={addEducation} />
        </div>
      )
    },
    {
      id: "skills",
      icon: sectionIconMap.skills,
      title: getSectionTitle("skills"),
      canDelete: true,
      canRename: true,
      reorderable: true,
      onDelete: () => deleteSection("skills"),
      onRename: () => renameSection("skills"),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-outline-variant/10 bg-surface-container p-1.5">{groupedModeOptions.map((option) => <SegmentedButton key={option.value} active={resume.skills.mode === option.value} onClick={() => setSkills({ ...resume.skills, mode: option.value })}>{option.label}</SegmentedButton>)}</div>
          {resume.skills.mode === "csv" ? <EditableStringList addLabel="Add skill" values={resume.skills.items} placeholder="Python" onChange={(items) => setSkills({ ...resume.skills, items: splitDelimitedItems(items.join("\n")) })} /> : <div className="space-y-4">{resume.skills.groups.map((group, index) => <DetailCard key={`skill-group-${index}`} title={group.groupLabel?.trim() || `Group ${index + 1}`} onRemove={() => setSkills({ ...resume.skills, groups: resume.skills.groups.filter((_, itemIndex) => itemIndex !== index) })}><div className="space-y-4"><input className={fieldClassName} value={group.groupLabel ?? ""} onChange={(event) => setSkills({ ...resume.skills, groups: resume.skills.groups.map((item, itemIndex) => itemIndex === index ? { ...item, groupLabel: parseInputValue(event) } : item) })} /><EditableStringList addLabel="Add skill" values={group.items} placeholder="Figma" onChange={(items) => setSkills({ ...resume.skills, groups: resume.skills.groups.map((item, itemIndex) => itemIndex === index ? { ...item, items: splitDelimitedItems(items.join("\n")) } : item) })} /></div></DetailCard>)}<AddRowButton label="Add skill group" onClick={() => setSkills({ ...resume.skills, groups: [...resume.skills.groups, createEmptySkillGroup()] })} /></div>}
        </div>
      )
    },
    {
      id: "experience",
      icon: sectionIconMap.experience,
      title: getSectionTitle("experience"),
      canDelete: true,
      canRename: true,
      reorderable: true,
      onDelete: () => deleteSection("experience"),
      onRename: () => renameSection("experience"),
      content: (
        <div className="space-y-4">
          {resume.experience.map((item, index) => (
            <DetailCard key={`experience-${index}`} title={item.role?.trim() || item.company?.trim() || `Experience ${index + 1}`} onRemove={() => removeExperience(index)}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2"><FieldLabel>Role</FieldLabel><input className={fieldClassName} value={item.role ?? ""} onChange={(event) => updateExperience(index, { role: parseInputValue(event) })} /></label>
                  <label className="space-y-2"><FieldLabel>Company</FieldLabel><input className={fieldClassName} value={item.company ?? ""} onChange={(event) => updateExperience(index, { company: parseInputValue(event) })} /></label>
                  <label className="space-y-2 md:col-span-2"><FieldLabel>Location</FieldLabel><input className={fieldClassName} value={item.location ?? ""} onChange={(event) => updateExperience(index, { location: parseInputValue(event) })} /></label>
                </div>
                <DateFieldEditor allowOngoing label="Dates" value={item.date} onChange={(value) => updateExperience(index, { date: value, isCurrent: value.mode.endsWith("present") })} />
                <DescriptionFieldEditor label="Description" value={item.description} onChange={(value) => updateExperience(index, { description: value })} />
              </div>
            </DetailCard>
          ))}
          <AddRowButton label="Add experience" onClick={addExperience} />
        </div>
      )
    },
    {
      id: "projects",
      icon: sectionIconMap.projects,
      title: getSectionTitle("projects"),
      canDelete: true,
      canRename: true,
      reorderable: true,
      onDelete: () => deleteSection("projects"),
      onRename: () => renameSection("projects"),
      content: (
        <div className="space-y-4">
          {resume.projects.map((item, index) => (
            <DetailCard key={`project-${index}`} title={item.title?.trim() || `Project ${index + 1}`} onRemove={() => removeProject(index)}>
              <div className="space-y-4">
                <input className={fieldClassName} value={item.title ?? ""} onChange={(event) => updateProject(index, { title: parseInputValue(event) })} />
                <DateFieldEditor allowOngoing label="Dates" value={item.date} onChange={(value) => updateProject(index, { date: value })} />
                <LinkFieldEditor label="GitHub Link" value={item.githubLink} onChange={(value) => updateProject(index, { githubLink: value })} />
                <LinkFieldEditor label="Live Link" value={item.liveLink} onChange={(value) => updateProject(index, { liveLink: value })} />
                <EditableStringList addLabel="Add technology" values={item.technologies} placeholder="React" onChange={(values) => updateProject(index, { technologies: splitDelimitedItems(values.join("\n")) })} />
                <DescriptionFieldEditor label="Description" value={item.description} onChange={(value) => updateProject(index, { description: value })} />
              </div>
            </DetailCard>
          ))}
          <AddRowButton label="Add project" onClick={addProject} />
        </div>
      )
    },
    {
      id: "certifications",
      icon: sectionIconMap.certifications,
      title: getSectionTitle("certifications"),
      canDelete: true,
      canRename: true,
      reorderable: true,
      onDelete: () => deleteSection("certifications"),
      onRename: () => renameSection("certifications"),
      content: (
        <div className="space-y-4">
          {resume.certifications.map((item, index) => (
            <DetailCard key={`certification-${index}`} title={item.title?.trim() || item.issuer?.trim() || `Certification ${index + 1}`} onRemove={() => removeCertification(index)}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2"><FieldLabel>Title</FieldLabel><input className={fieldClassName} value={item.title ?? ""} onChange={(event) => updateCertification(index, { title: parseInputValue(event) })} /></label>
                  <label className="space-y-2"><FieldLabel>Issuer</FieldLabel><input className={fieldClassName} value={item.issuer ?? ""} onChange={(event) => updateCertification(index, { issuer: parseInputValue(event) })} /></label>
                  <label className="space-y-2 md:col-span-2"><FieldLabel>Description</FieldLabel><input className={fieldClassName} value={item.description ?? ""} onChange={(event) => updateCertification(index, { description: parseInputValue(event) })} /></label>
                </div>
                <DateFieldEditor label="Issue Date" value={item.date} onChange={(value) => updateCertification(index, { date: value })} />
                <LinkFieldEditor label="Certificate Link" value={item.link} onChange={(value) => updateCertification(index, { link: value })} />
              </div>
            </DetailCard>
          ))}
          <AddRowButton label="Add certification" onClick={addCertification} />
        </div>
      )
    },
    ...genericSectionKeys.map((section) => ({
      id: section,
      icon: sectionIconMap[section],
      title: getSectionTitle(section),
      canDelete: true,
      canRename: true,
      reorderable: true,
      onDelete: () => deleteSection(section),
      onRename: () => renameSection(section),
      content: (
        <div className="space-y-4">
          {resume[section].entries.map((item, index) => (
            <DetailCard key={`${section}-${index}`} title={item.title?.trim() || item.subtitle?.trim() || `${getSectionTitle(section)} ${index + 1}`} onRemove={() => removeCustomSectionEntry(section, index)}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2"><FieldLabel>Title</FieldLabel><input className={fieldClassName} value={item.title ?? ""} onChange={(event) => updateCustomSectionEntry(section, index, { title: parseInputValue(event) })} /></label>
                  <label className="space-y-2"><FieldLabel>Subtitle</FieldLabel><input className={fieldClassName} value={item.subtitle ?? ""} onChange={(event) => updateCustomSectionEntry(section, index, { subtitle: parseInputValue(event) })} /></label>
                  <label className="space-y-2 md:col-span-2"><FieldLabel>Location</FieldLabel><input className={fieldClassName} value={item.location ?? ""} onChange={(event) => updateCustomSectionEntry(section, index, { location: parseInputValue(event) })} /></label>
                </div>
                <DateFieldEditor allowOngoing label="Dates" value={item.date} onChange={(value) => updateCustomSectionEntry(section, index, { date: value })} />
                <LinkFieldEditor label="Link" value={item.link} onChange={(value) => updateCustomSectionEntry(section, index, { link: value })} />
                <DescriptionFieldEditor label="Description" value={item.description} onChange={(value) => updateCustomSectionEntry(section, index, { description: value })} />
              </div>
            </DetailCard>
          ))}
          <AddRowButton label={`Add ${getSectionTitle(section).toLowerCase()} item`} onClick={() => addCustomSectionEntry(section)} />
        </div>
      )
    })),
    {
      id: "languages",
      icon: sectionIconMap.languages,
      title: getSectionTitle("languages"),
      canDelete: true,
      canRename: true,
      reorderable: true,
      onDelete: () => deleteSection("languages"),
      onRename: () => renameSection("languages"),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-outline-variant/10 bg-surface-container p-1.5">{groupedModeOptions.map((option) => <SegmentedButton key={option.value} active={resume.languages.mode === option.value} onClick={() => setLanguages({ ...resume.languages, mode: option.value })}>{option.label}</SegmentedButton>)}</div>
          {resume.languages.mode === "csv" ? <div className="space-y-4">{(resume.languages.items.length > 0 ? resume.languages.items : [{ language: "", proficiency: null }]).map((item, index) => <div key={`language-${index}`} className="grid grid-cols-1 gap-3 rounded-[1.25rem] border border-outline-variant/15 bg-surface-container-high p-4 md:grid-cols-[1.2fr_0.8fr_auto]"><input className={fieldClassName} value={item.language ?? ""} placeholder="English" onChange={(event) => setLanguages({ ...resume.languages, items: (resume.languages.items.length > 0 ? resume.languages.items : [{ language: "", proficiency: null }]).map((languageItem, itemIndex) => itemIndex === index ? { ...languageItem, language: event.target.value } : languageItem) })} /><select className={selectClassName} value={item.proficiency ?? ""} onChange={(event) => setLanguages({ ...resume.languages, items: (resume.languages.items.length > 0 ? resume.languages.items : [{ language: "", proficiency: null }]).map((languageItem, itemIndex) => itemIndex === index ? { ...languageItem, proficiency: event.target.value ? (event.target.value as LanguageItem["proficiency"]) : null } : languageItem) })}><option value="">Proficiency</option>{languageProficiencyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><button type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-error-container/60 text-error transition hover:-translate-y-px" onClick={() => setLanguages({ ...resume.languages, items: (resume.languages.items.length > 0 ? resume.languages.items : [{ language: "", proficiency: null }]).filter((_, itemIndex) => itemIndex !== index) })} aria-label="Remove language"><span className="material-symbols-outlined text-lg">delete</span></button></div>)}<AddRowButton label="Add language" onClick={() => setLanguages({ ...resume.languages, items: [...resume.languages.items, { language: "", proficiency: null }] })} /></div> : <div className="space-y-4">{resume.languages.groups.map((group, index) => <DetailCard key={`language-group-${index}`} title={group.groupLabel?.trim() || `Group ${index + 1}`} onRemove={() => setLanguages({ ...resume.languages, groups: resume.languages.groups.filter((_, itemIndex) => itemIndex !== index) })}><div className="space-y-4"><input className={fieldClassName} value={group.groupLabel ?? ""} onChange={(event) => setLanguages({ ...resume.languages, groups: resume.languages.groups.map((item, itemIndex) => itemIndex === index ? { ...item, groupLabel: event.target.value } : item) })} /><EditableStringList addLabel="Add language" values={group.items} placeholder="Hindi" onChange={(items) => setLanguages({ ...resume.languages, groups: resume.languages.groups.map((item, itemIndex) => itemIndex === index ? { ...item, items: splitDelimitedItems(items.join("\n")) } : item) })} /></div></DetailCard>)}<AddRowButton label="Add proficiency group" onClick={() => setLanguages({ ...resume.languages, groups: [...resume.languages.groups, createEmptySkillGroup()] })} /></div>}
        </div>
      )
    },
    {
      id: "hobbies",
      icon: sectionIconMap.hobbies,
      title: getSectionTitle("hobbies"),
      canDelete: true,
      canRename: true,
      reorderable: true,
      onDelete: () => deleteSection("hobbies"),
      onRename: () => renameSection("hobbies"),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-outline-variant/10 bg-surface-container p-1.5">{groupedModeOptions.map((option) => <SegmentedButton key={option.value} active={resume.hobbies.mode === option.value} onClick={() => setHobbies({ ...resume.hobbies, mode: option.value })}>{option.label}</SegmentedButton>)}</div>
          {resume.hobbies.mode === "csv" ? <EditableStringList addLabel="Add hobby" values={resume.hobbies.items} placeholder="Photography" onChange={(items) => setHobbies({ ...resume.hobbies, items: splitDelimitedItems(items.join("\n")) })} /> : <div className="space-y-4">{resume.hobbies.groups.map((group, index) => <DetailCard key={`hobby-group-${index}`} title={group.groupLabel?.trim() || `Group ${index + 1}`} onRemove={() => setHobbies({ ...resume.hobbies, groups: resume.hobbies.groups.filter((_, itemIndex) => itemIndex !== index) })}><div className="space-y-4"><input className={fieldClassName} value={group.groupLabel ?? ""} onChange={(event) => setHobbies({ ...resume.hobbies, groups: resume.hobbies.groups.map((item, itemIndex) => itemIndex === index ? { ...item, groupLabel: event.target.value } : item) })} /><EditableStringList addLabel="Add hobby" values={group.items} placeholder="Chess" onChange={(items) => setHobbies({ ...resume.hobbies, groups: resume.hobbies.groups.map((item, itemIndex) => itemIndex === index ? { ...item, items: splitDelimitedItems(items.join("\n")) } : item) })} /></div></DetailCard>)}<AddRowButton label="Add hobby group" onClick={() => setHobbies({ ...resume.hobbies, groups: [...resume.hobbies.groups, createEmptySkillGroup()] })} /></div>}
        </div>
      )
    }
  ];

  const orderedContentSections: AccordionWorkspaceItem[] = [
    ...contentSections.filter((item) => item.id === "import" || item.id === "personal"),
    ...renderOptions.sectionOrder.map((section) => contentSections.find((item) => item.id === section)).filter((item): item is AccordionWorkspaceItem => Boolean(item))
  ];

  if (activeTab === "templates") {
    return (
      <WorkspaceSurface title="Template Library" description="Choose a layout.">
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 pb-3"><div className="flex items-center gap-2 overflow-x-auto pb-1"><SegmentedButton active={templateFilter === "all"} onClick={() => setTemplateFilter("all")}>All</SegmentedButton><SegmentedButton active={templateFilter === "balanced"} onClick={() => setTemplateFilter("balanced")}>Balanced</SegmentedButton><SegmentedButton active={templateFilter === "tight"} onClick={() => setTemplateFilter("tight")}>One-page</SegmentedButton><SegmentedButton active={templateFilter === "airy"} onClick={() => setTemplateFilter("airy")}>Story-led</SegmentedButton></div></div>
          <div className="workspace-scroll h-[30rem] max-h-full overflow-y-auto pr-1"><div className="grid gap-3 xl:grid-cols-2">{filteredTemplates.map((template) => <TemplateCard key={template.id} compact template={template} selected={template.id === renderOptions.templateId} actionLabel="Use" onSelect={onTemplateChange} />)}</div></div>
        </div>
      </WorkspaceSurface>
    );
  }

  if (activeTab === "design") {
    return (
      <WorkspaceSurface title="Customize Output" description="Tweak the PDF." footer={<div className="flex gap-3"><button type="button" onClick={() => onRenderOptionsChange({ ...DEFAULT_RENDER_OPTIONS, sectionOrder: [...renderOptions.sectionOrder], sectionTitles: { ...renderOptions.sectionTitles }, templateId: renderOptions.templateId })} className="flex-1 rounded-xl border-2 border-outline-variant/20 bg-surface-container-highest py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container">Reset</button></div>}>
        <div className="workspace-scroll h-[38rem] max-h-full overflow-y-auto pr-1">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.25rem] border border-outline-variant/15 bg-surface-container-high p-4"><FieldLabel>Page Limit</FieldLabel><div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-outline-variant/10 bg-surface-container p-1.5"><SegmentedButton active={renderOptions.pageLimit === 1} onClick={() => updateRenderOptions({ pageLimit: 1 })}>1 Page</SegmentedButton><SegmentedButton active={renderOptions.pageLimit === 2} onClick={() => updateRenderOptions({ pageLimit: 2 })}>2 Pages</SegmentedButton></div></div>
              <div className="rounded-[1.25rem] border border-outline-variant/15 bg-surface-container-high p-4"><FieldLabel>Font Size</FieldLabel><div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-outline-variant/10 bg-surface-container p-1.5"><SegmentedButton active={renderOptions.fontSize <= 10} onClick={() => updateRenderOptions({ fontSize: 10 })}>Small</SegmentedButton><SegmentedButton active={renderOptions.fontSize === 11} onClick={() => updateRenderOptions({ fontSize: 11 })}>Medium</SegmentedButton><SegmentedButton active={renderOptions.fontSize >= 12} onClick={() => updateRenderOptions({ fontSize: 12 })}>Large</SegmentedButton></div></div>
            </div>
            <div className="rounded-[1.25rem] border border-outline-variant/15 bg-surface-container-high p-4">
              <div className="space-y-6">
                <RangeRow label="Margins" min={0.7} max={1.5} step={0.1} value={marginValue} valueLabel={`${marginValue.toFixed(1)}cm`} onChange={(value) => updateRenderOptions({ margin: `${value.toFixed(1)}cm` })} />
                <RangeRow label="Bullet Density" min={2} max={6} value={renderOptions.maxBulletsPerEntry} valueLabel={`${renderOptions.maxBulletsPerEntry} bullets`} onChange={(value) => updateRenderOptions({ maxBulletsPerEntry: value })} />
              </div>
            </div>
          </div>
        </div>
      </WorkspaceSurface>
    );
  }

  return <WorkspaceSurface bodyClassName="overflow-hidden" title="Section Workspace" description="Edit and reorder resume sections." headerAside={<AddRowButton label="Add section" onClick={addSection} />}><AccordionWorkspace items={orderedContentSections} activeId={activeContentSection} onChange={setActiveContentSection} onReorder={reorderResumeSections} /></WorkspaceSurface>;
}

import type { ChangeEvent, ReactNode } from "react";
import type {
  CompactItem,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ResumeData,
  ResumeSectionKey
} from "../../types/resume";
import { skillsToText, splitDelimitedItems, splitLineItems, textToSkills } from "../../lib/resume";
import { Chip } from "../ui/Chip";
import { Panel } from "../ui/Panel";
import { SectionHeading } from "../ui/SectionHeading";
import { AccordionSection } from "./AccordionSection";
import { EditorTabs } from "./EditorTabs";

interface EditorSidebarProps {
  onClearResume: () => void;
  onLoadSample: () => void;
  onResumeChange: (resume: ResumeData) => void;
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

export function EditorSidebar({ onClearResume, onLoadSample, onResumeChange, resume }: EditorSidebarProps) {
  function commit(next: ResumeData) {
    onResumeChange(next);
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

  return (
    <Panel className="h-full p-8">
      <div className="mb-8">
        <EditorTabs />
      </div>
      <SectionHeading
        eyebrow="Workspace"
        title="Edit Details"
        description="This editor is now wired to the canonical resume schema. Changes stay local to this session and update the preview immediately."
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Chip tone="lavender">Schema v{resume.meta.version}</Chip>
        <Chip tone="soft">Source: {resume.meta.source}</Chip>
        <Chip tone="mint">Updated locally</Chip>
        <div className="ml-auto flex flex-wrap gap-3">
          <IconButton icon="restart_alt" label="Load sample" onClick={onLoadSample} />
          <IconButton icon="ink_eraser" label="Clear all" onClick={onClearResume} tone="danger" />
        </div>
      </div>

      <div className="mt-8 space-y-4">
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
      </div>
    </Panel>
  );
}

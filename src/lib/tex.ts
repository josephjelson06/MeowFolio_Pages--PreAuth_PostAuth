import { getTemplateDefinition, templateCatalog } from "../data/templates";
import {
  DEFAULT_RENDER_OPTIONS,
  DEFAULT_RESUME_SECTION_ORDER,
  areSkillsGrouped,
  type CompactItem,
  type RenderOptions,
  type ResumeData,
  type ResumeSectionKey
} from "../types/resume";
import { formatDateRange, getResumeContactLines, splitLineItems } from "./resume";

export const TEX_TEMPLATE_OPTIONS = templateCatalog.map((template) => ({
  id: template.id,
  label: template.label
})) as ReadonlyArray<{
  id: RenderOptions["templateId"];
  label: string;
}>;

interface TemplateRenderConfig {
  accentHex: string;
  bodySpacing: string;
  headerLayout: "center" | "left";
  itemSpacing: string;
  nameCommand: "\\LARGE" | "\\Large";
  sectionMacro: string;
}

function escapeTex(value: string) {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function getTemplateRenderConfig(templateId: RenderOptions["templateId"]): TemplateRenderConfig {
  switch (templateId) {
    case "compact":
      return {
        accentHex: "2F5F98",
        bodySpacing: "0.18em",
        headerLayout: "left",
        itemSpacing: "0.12em",
        nameCommand: "\\Large",
        sectionMacro:
          "\\newcommand{\\resumeSection}[1]{\\vspace{0.65em}{\\normalsize\\bfseries\\color{ResumeAccent}\\uppercase{#1}}\\par\\vspace{0.35em}\\fcolorbox{ResumeAccent}{ResumeAccent!10}{\\rule{0pt}{1.1ex}\\hspace{0.2em}}\\par\\vspace{0.45em}}"
      };
    case "editorial":
      return {
        accentHex: "7A4B87",
        bodySpacing: "0.45em",
        headerLayout: "center",
        itemSpacing: "0.28em",
        nameCommand: "\\LARGE",
        sectionMacro:
          "\\newcommand{\\resumeSection}[1]{\\vspace{1.0em}{\\large\\bfseries\\color{ResumeAccent}\\textsc{#1}}\\par\\vspace{0.25em}\\hrule height 0.8pt\\vspace{0.65em}}"
      };
    case "modern":
    default:
      return {
        accentHex: "9D4223",
        bodySpacing: "0.3em",
        headerLayout: "left",
        itemSpacing: "0.2em",
        nameCommand: "\\LARGE",
        sectionMacro:
          "\\newcommand{\\resumeSection}[1]{\\vspace{0.85em}{\\large\\bfseries\\color{ResumeAccent}#1}\\par\\vspace{0.25em}\\hrule height 0.8pt\\vspace{0.55em}}"
      };
  }
}

function sectionBlock(title: string, content: string) {
  if (!content.trim()) {
    return "";
  }

  return [`\\resumeSection{${escapeTex(title)}}`, content].join("\n");
}

function renderCompactItems(items: CompactItem[]) {
  return items
    .filter((item) => item.description?.trim())
    .map((item) => {
      const line = escapeTex(item.description!.trim());
      const meta = item.date?.trim() ? `\\hfill ${escapeTex(item.date.trim())}` : "";
      return `${line}${meta}\\\\`;
    })
    .join("\n");
}

function renderSkills(resume: ResumeData) {
  if (resume.skills.length === 0) {
    return "";
  }

  if (!areSkillsGrouped(resume.skills)) {
    return escapeTex(resume.skills.join(", "));
  }

  return resume.skills
    .map((group) => `\\textbf{${escapeTex(group.category)}}: ${escapeTex(group.items.join(", "))}\\\\`)
    .join("\n");
}

function renderExperience(resume: ResumeData, options: RenderOptions, config: TemplateRenderConfig) {
  return resume.experience
    .filter((item) => item.role?.trim() || item.company?.trim())
    .map((item) => {
      const heading = [item.role?.trim(), item.company?.trim()]
        .filter((value): value is string => Boolean(value))
        .map(escapeTex)
        .join(" at ");
      const meta = [item.location?.trim(), formatDateRange(item.startDate, item.endDate, item.current)]
        .filter((value): value is string => Boolean(value))
        .map(escapeTex)
        .join(" | ");
      const description = item.description?.trim() ? escapeTex(item.description.trim()) : "";
      const bullets = item.bullets
        .slice(0, options.maxBulletsPerEntry)
        .filter((bullet) => bullet.trim())
        .map((bullet) => `  \\item ${escapeTex(bullet.trim())}`)
        .join("\n");

      return [
        `\\textbf{${heading}}${meta ? ` \\hfill ${meta}` : ""}\\\\`,
        description,
        bullets
          ? `\\begin{itemize}[leftmargin=1.2em, itemsep=${config.itemSpacing}, topsep=0.1em]\n${bullets}\n\\end{itemize}`
          : ""
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function renderEducation(resume: ResumeData) {
  return resume.education
    .filter((item) => item.degree?.trim() || item.institution?.trim())
    .map((item) => {
      const heading = [item.degree?.trim(), item.field?.trim()]
        .filter((value): value is string => Boolean(value))
        .map(escapeTex)
        .join(", ");
      const meta = [item.institution?.trim(), item.location?.trim()]
        .filter((value): value is string => Boolean(value))
        .map(escapeTex)
        .join(" | ");
      const dateRange = [item.startYear?.trim(), item.endYear?.trim()]
        .filter((value): value is string => Boolean(value))
        .map(escapeTex)
        .join(" - ");
      const gpa = item.gpa?.trim() ? `GPA: ${escapeTex(item.gpa.trim())}` : "";

      return [`\\textbf{${heading || "Education"}}${dateRange ? ` \\hfill ${dateRange}` : ""}\\\\`, meta, gpa]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function renderProjects(resume: ResumeData, options: RenderOptions, config: TemplateRenderConfig) {
  return resume.projects
    .filter((item) => item.title?.trim())
    .map((item) => {
      const heading = escapeTex(item.title!.trim());
      const dateRange = formatDateRange(item.startDate, item.endDate);
      const description = item.description?.trim() ? escapeTex(item.description.trim()) : "";
      const technologies = item.technologies.length > 0 ? `Technologies: ${escapeTex(item.technologies.join(", "))}` : "";
      const link = item.link?.trim() ? escapeTex(item.link.trim()) : "";
      const bullets = item.bullets
        .slice(0, options.maxBulletsPerEntry)
        .filter((bullet) => bullet.trim())
        .map((bullet) => `  \\item ${escapeTex(bullet.trim())}`)
        .join("\n");

      return [
        `\\textbf{${heading}}${dateRange ? ` \\hfill ${escapeTex(dateRange)}` : ""}\\\\`,
        link,
        description,
        technologies,
        bullets
          ? `\\begin{itemize}[leftmargin=1.2em, itemsep=${config.itemSpacing}, topsep=0.1em]\n${bullets}\n\\end{itemize}`
          : ""
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function renderSection(
  section: ResumeSectionKey,
  resume: ResumeData,
  options: RenderOptions,
  config: TemplateRenderConfig
) {
  switch (section) {
    case "summary":
      return sectionBlock("Summary", resume.summary?.trim() ? escapeTex(resume.summary.trim()) : "");
    case "skills":
      return sectionBlock("Skills", renderSkills(resume));
    case "education":
      return sectionBlock("Education", renderEducation(resume));
    case "experience":
      return sectionBlock("Experience", renderExperience(resume, options, config));
    case "projects":
      return sectionBlock("Projects", renderProjects(resume, options, config));
    case "certifications":
      return sectionBlock("Certifications", renderCompactItems(resume.certifications));
    case "awards":
      return sectionBlock("Awards", renderCompactItems(resume.awards));
    case "leadership":
      return sectionBlock("Leadership", renderCompactItems(resume.leadership));
    case "extracurricular":
      return sectionBlock("Extracurricular", renderCompactItems(resume.extracurricular));
    default:
      return "";
  }
}

function renderHeaderBlock(resume: ResumeData, config: TemplateRenderConfig) {
  const name = escapeTex(resume.header.name?.trim() || "Your Name");
  const title = resume.header.title?.trim() ? escapeTex(resume.header.title.trim()) : "";
  const contacts = getResumeContactLines(resume)
    .map((item) => escapeTex(item))
    .join(" \\quad ");

  const body = [
    `{${config.nameCommand} \\textbf{${name}}}\\par`,
    title ? `{\\large ${title}}\\par` : "",
    contacts ? `{\\small ${contacts}}\\par` : ""
  ]
    .filter(Boolean)
    .join("\n");

  if (config.headerLayout === "center") {
    return [`\\begin{center}`, body, "\\end{center}"].join("\n");
  }

  return body;
}

function buildPreamble(templateId: RenderOptions["templateId"], options: RenderOptions) {
  const config = getTemplateRenderConfig(templateId);

  return [
    "\\documentclass[11pt]{article}",
    `\\usepackage[margin=${options.margin}]{geometry}`,
    "\\usepackage[dvipsnames]{xcolor}",
    "\\usepackage{enumitem}",
    "\\usepackage{hyperref}",
    "\\usepackage{parskip}",
    "\\pagestyle{empty}",
    "\\setlength{\\parindent}{0pt}",
    `\\setlength{\\parskip}{${config.bodySpacing}}`,
    "\\hypersetup{hidelinks}",
    `\\definecolor{ResumeAccent}{HTML}{${config.accentHex}}`,
    config.sectionMacro
  ].join("\n");
}

export function renderOptionsToText(order: ResumeSectionKey[]) {
  return order.join("\n");
}

export function textToSectionOrder(value: string) {
  const allowed = new Set(DEFAULT_RESUME_SECTION_ORDER);
  const cleaned = splitLineItems(value).filter((item): item is ResumeSectionKey => allowed.has(item as ResumeSectionKey));

  return cleaned.length > 0 ? cleaned : [...DEFAULT_RESUME_SECTION_ORDER];
}

export function createInitialRenderOptions(): RenderOptions {
  return {
    ...DEFAULT_RENDER_OPTIONS,
    sectionOrder: [...DEFAULT_RENDER_OPTIONS.sectionOrder]
  };
}

export function renderResumeToTex(resume: ResumeData, options: RenderOptions) {
  const template = getTemplateDefinition(options.templateId);
  const config = getTemplateRenderConfig(template.id);
  const orderedSections = options.sectionOrder
    .map((section) => renderSection(section, resume, options, config))
    .filter(Boolean)
    .join("\n\n");

  return [
    `% Template: ${template.id} (${template.label})`,
    buildPreamble(template.id, options),
    "\\begin{document}",
    `\\fontsize{${options.fontSize}}{${options.fontSize + 2}}\\selectfont`,
    renderHeaderBlock(resume, config),
    orderedSections,
    "\\end{document}"
  ]
    .filter(Boolean)
    .join("\n\n");
}

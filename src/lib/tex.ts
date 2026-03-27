import { getTemplateDefinition, templateCatalog } from "../data/templates";
import {
  DEFAULT_RENDER_OPTIONS,
  DEFAULT_RESUME_SECTION_ORDER,
  RESUME_SECTION_LABELS,
  type CustomEntriesSection,
  type DescriptionField,
  type LinkField,
  type OrderedResumeSectionId,
  type RenderOptions,
  type ResumeData,
  type ResumeSectionKey
} from "../types/resume";
import { flattenDescriptionLines, flattenSkills, formatDateField, getLinkLabel, getLinkUrl, getProfileLabel, getResumeContactLines, getSummaryText, splitLineItems } from "./resume";

export const TEX_TEMPLATE_OPTIONS = templateCatalog.map((template) => ({
  id: template.id,
  label: template.label
})) as ReadonlyArray<{
  id: RenderOptions["templateId"];
  label: string;
}>;

interface TemplateRenderConfig {
  accentHex: string;
  headerLayout: "center" | "left";
  itemSpacing: string;
  nameCommand: "\\LARGE" | "\\Large";
  sectionHeading: "caps" | "title";
}

const UNICODE_TEXT_REPLACEMENTS: Record<string, string> = {
  "\u00a0": " ",
  "\u200b": "",
  "\u2012": "-",
  "\u2013": "--",
  "\u2014": "---",
  "\u2018": "'",
  "\u2019": "'",
  "\u201c": '"',
  "\u201d": '"',
  "\u2022": "\\textbullet{}",
  "\u2026": "...",
  "\u2212": "-"
};

function normalizeTexText(value: string) {
  let normalized = value;

  Object.entries(UNICODE_TEXT_REPLACEMENTS).forEach(([source, target]) => {
    normalized = normalized.split(source).join(target);
  });

  return normalized
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0A\x20-\x7E]/g, "");
}

function escapeTex(value: string) {
  return normalizeTexText(value)
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

function escapeHref(value: string) {
  return normalizeTexText(value).replace(/\\/g, "/").replace(/ /g, "%20");
}

function getTemplateRenderConfig(templateId: RenderOptions["templateId"]): TemplateRenderConfig {
  switch (templateId) {
    case "classic":
      return {
        accentHex: "2D2D2D",
        headerLayout: "center",
        itemSpacing: "0.2em",
        nameCommand: "\\LARGE",
        sectionHeading: "caps"
      };
    case "compact":
      return {
        accentHex: "2F5F98",
        headerLayout: "left",
        itemSpacing: "0.12em",
        nameCommand: "\\Large",
        sectionHeading: "caps"
      };
    case "editorial":
      return {
        accentHex: "7A4B87",
        headerLayout: "center",
        itemSpacing: "0.28em",
        nameCommand: "\\LARGE",
        sectionHeading: "title"
      };
    case "modern":
    default:
      return {
        accentHex: "9D4223",
        headerLayout: "left",
        itemSpacing: "0.2em",
        nameCommand: "\\LARGE",
        sectionHeading: "title"
      };
  }
}

function buildPreamble(options: RenderOptions, config: TemplateRenderConfig) {
  const sectionHeadingCommand =
    config.sectionHeading === "caps"
      ? "\\newcommand{\\resumeSection}[1]{\\vspace{0.8em}{\\large\\bfseries\\color{ResumeAccent}\\uppercase{#1}}\\par\\vspace{0.18em}\\hrule height 0.7pt\\vspace{0.45em}}"
      : "\\newcommand{\\resumeSection}[1]{\\vspace{0.9em}{\\large\\bfseries\\color{ResumeAccent}#1}\\par\\vspace{0.22em}\\hrule height 0.8pt\\vspace{0.55em}}";

  return [
    "\\documentclass[11pt]{article}",
    `\\usepackage[margin=${options.margin}]{geometry}`,
    "\\usepackage[T1]{fontenc}",
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage[dvipsnames]{xcolor}",
    "\\usepackage{enumitem}",
    "\\usepackage{hyperref}",
    "\\usepackage{xurl}",
    "\\usepackage{parskip}",
    "\\pagestyle{empty}",
    "\\setlength{\\parindent}{0pt}",
    "\\setlength{\\parskip}{0.28em}",
    "\\hypersetup{hidelinks}",
    `\\definecolor{ResumeAccent}{HTML}{${config.accentHex}}`,
    sectionHeadingCommand,
    "\\newcommand{\\resumeMeta}[1]{{\\small\\color{black!70}#1}}"
  ].join("\n");
}

function renderLink(link?: LinkField | null) {
  if (!link) {
    return "";
  }

  const url = getLinkUrl(link);

  if (!url) {
    return "";
  }

  const label = getLinkLabel(link) || url;

  if (link.displayMode === "hyperlinked-text" && label && label !== url) {
    return `\\href{${escapeHref(url)}}{${escapeTex(label)}}`;
  }

  return escapeTex(url);
}

function renderDescription(description: DescriptionField, options: RenderOptions, itemSpacing: string) {
  if (description.mode === "paragraph") {
    return description.paragraph?.trim() ? escapeTex(description.paragraph.trim()) : "";
  }

  const bullets = description.bullets
    .slice(0, options.maxBulletsPerEntry)
    .map((bullet) => bullet.trim())
    .filter(Boolean)
    .map((bullet) => `  \\item ${escapeTex(bullet)}`)
    .join("\n");

  if (!bullets) {
    return "";
  }

  return `\\begin{itemize}[leftmargin=1.2em, itemsep=${itemSpacing}, topsep=0.2em]\n${bullets}\n\\end{itemize}`;
}

function sectionBlock(title: string, content: string) {
  if (!content.trim()) {
    return "";
  }

  return [`\\resumeSection{${escapeTex(title)}}`, content].join("\n");
}

function getSectionTitle(section: ResumeSectionKey, options: RenderOptions, resume: ResumeData) {
  if (section === "summary") {
    return options.sectionTitles.summary?.trim() || getProfileLabel(resume);
  }

  if (section === "leadership" || section === "achievements" || section === "competitions" || section === "extracurricular" || section === "publications" || section === "openSource") {
    return resume[section].label?.trim() || options.sectionTitles[section]?.trim() || RESUME_SECTION_LABELS[section];
  }

  return options.sectionTitles[section]?.trim() || RESUME_SECTION_LABELS[section];
}

function renderHeader(resume: ResumeData, config: TemplateRenderConfig) {
  const name = escapeTex(resume.header.name?.trim() || "Your Name");
  const role = resume.header.role?.trim() ? escapeTex(resume.header.role.trim()) : "";
  const contacts = getResumeContactLines(resume)
    .map((item) => escapeTex(item))
    .join(" \\quad ");

  const body = [
    `{${config.nameCommand} \\textbf{${name}}}\\par`,
    role ? `{\\large ${role}}\\par` : "",
    contacts ? `{\\small ${contacts}}\\par` : ""
  ]
    .filter(Boolean)
    .join("\n");

  return config.headerLayout === "center" ? `\\begin{center}\n${body}\n\\end{center}` : body;
}

function renderSummary(resume: ResumeData, options: RenderOptions) {
  const content = getSummaryText(resume);
  return sectionBlock(getSectionTitle("summary", options, resume), content ? escapeTex(content) : "");
}

function renderSkills(resume: ResumeData, options: RenderOptions) {
  const content =
    resume.skills.mode === "grouped"
      ? resume.skills.groups
          .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
          .map((group) => `\\textbf{${escapeTex(group.groupLabel?.trim() || "General")}}: ${escapeTex(group.items.join(", "))}\\\\`)
          .join("\n")
      : resume.skills.items.length > 0
        ? escapeTex(resume.skills.items.join(", "))
        : "";

  return sectionBlock(getSectionTitle("skills", options, resume), content);
}

function renderEducation(resume: ResumeData, options: RenderOptions) {
  const content = resume.education
    .map((item) => {
      const heading = [item.degree?.trim(), item.field?.trim()].filter((value): value is string => Boolean(value)).map(escapeTex).join(", ");
      const institution = [item.institution?.trim(), item.boardOrUniversity?.trim()].filter((value): value is string => Boolean(value)).map(escapeTex).join(" | ");
      const meta = [item.location?.trim(), item.result?.trim(), formatDateField(item.date)].filter((value): value is string => Boolean(value)).map(escapeTex).join(" | ");

      if (!heading && !institution && !meta) {
        return "";
      }

      return [`\\textbf{${heading || "Education"}}\\\\`, institution, meta ? `\\resumeMeta{${meta}}\\\\` : ""].filter(Boolean).join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  return sectionBlock(getSectionTitle("education", options, resume), content);
}

function renderExperience(resume: ResumeData, options: RenderOptions, config: TemplateRenderConfig) {
  const content = resume.experience
    .map((item) => {
      const heading = [item.role?.trim(), item.company?.trim()].filter((value): value is string => Boolean(value)).map(escapeTex).join(" at ");
      const meta = [item.location?.trim(), formatDateField(item.date)].filter((value): value is string => Boolean(value)).map(escapeTex).join(" | ");
      const description = renderDescription(item.description, options, config.itemSpacing);

      if (!heading && !meta && !description) {
        return "";
      }

      return [`\\textbf{${heading || "Experience"}}${meta ? ` \\hfill ${meta}` : ""}\\\\`, description].filter(Boolean).join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  return sectionBlock(getSectionTitle("experience", options, resume), content);
}

function renderProjects(resume: ResumeData, options: RenderOptions, config: TemplateRenderConfig) {
  const content = resume.projects
    .map((item) => {
      const links = [renderLink(item.githubLink), renderLink(item.liveLink)].filter(Boolean).join(" | ");
      const meta = [formatDateField(item.date), item.technologies.length > 0 ? item.technologies.join(", ") : ""]
        .filter(Boolean)
        .map(escapeTex)
        .join(" | ");
      const description = renderDescription(item.description, options, config.itemSpacing);

      if (!item.title?.trim() && !links && !meta && !description) {
        return "";
      }

      return [
        `\\textbf{${escapeTex(item.title?.trim() || "Project")}}${meta ? ` \\hfill ${meta}` : ""}\\\\`,
        links ? `${links}\\\\` : "",
        description
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  return sectionBlock(getSectionTitle("projects", options, resume), content);
}

function renderCertifications(resume: ResumeData, options: RenderOptions) {
  const content = resume.certifications
    .map((item) => {
      const heading = [item.title?.trim(), item.issuer?.trim()].filter((value): value is string => Boolean(value)).map(escapeTex).join(" | ");
      const meta = [item.description?.trim(), formatDateField(item.date)].filter((value): value is string => Boolean(value)).map(escapeTex).join(" | ");
      const link = renderLink(item.link);

      if (!heading && !meta && !link) {
        return "";
      }

      return [`\\textbf{${heading || "Certification"}}\\\\`, meta ? `\\resumeMeta{${meta}}\\\\` : "", link ? `${link}\\\\` : ""]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  return sectionBlock(getSectionTitle("certifications", options, resume), content);
}

function renderCustomSection(sectionKey: ResumeSectionKey, section: CustomEntriesSection, options: RenderOptions, resume: ResumeData, config: TemplateRenderConfig) {
  const content = section.entries
    .map((entry) => {
      const heading = [entry.title?.trim(), entry.subtitle?.trim()].filter((value): value is string => Boolean(value)).map(escapeTex).join(" | ");
      const meta = [entry.location?.trim(), formatDateField(entry.date)].filter((value): value is string => Boolean(value)).map(escapeTex).join(" | ");
      const link = renderLink(entry.link);
      const description = renderDescription(entry.description, options, config.itemSpacing);

      if (!heading && !meta && !link && !description) {
        return "";
      }

      return [`\\textbf{${heading || escapeTex(section.label)}}${meta ? ` \\hfill ${meta}` : ""}\\\\`, link ? `${link}\\\\` : "", description]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  return sectionBlock(getSectionTitle(sectionKey, options, resume) || section.label, content);
}

function renderLanguages(resume: ResumeData, options: RenderOptions) {
  const content =
    resume.languages.mode === "grouped"
      ? resume.languages.groups
          .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
          .map((group) => `\\textbf{${escapeTex(group.groupLabel?.trim() || "Group")}}: ${escapeTex(group.items.join(", "))}\\\\`)
          .join("\n")
      : resume.languages.items
          .map((item) => [item.language?.trim(), item.proficiency?.trim()].filter((value): value is string => Boolean(value)).map(escapeTex).join(" | "))
          .filter(Boolean)
          .join("\\\\\n");

  return sectionBlock(getSectionTitle("languages", options, resume), content);
}

function renderHobbies(resume: ResumeData, options: RenderOptions) {
  const content =
    resume.hobbies.mode === "grouped"
      ? resume.hobbies.groups
          .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
          .map((group) => `\\textbf{${escapeTex(group.groupLabel?.trim() || "Group")}}: ${escapeTex(group.items.join(", "))}\\\\`)
          .join("\n")
      : escapeTex(resume.hobbies.items.join(", "));

  return sectionBlock(getSectionTitle("hobbies", options, resume), content);
}

function renderSection(section: ResumeSectionKey, resume: ResumeData, options: RenderOptions, config: TemplateRenderConfig) {
  switch (section) {
    case "summary":
      return renderSummary(resume, options);
    case "education":
      return renderEducation(resume, options);
    case "skills":
      return renderSkills(resume, options);
    case "experience":
      return renderExperience(resume, options, config);
    case "projects":
      return renderProjects(resume, options, config);
    case "certifications":
      return renderCertifications(resume, options);
    case "leadership":
      return renderCustomSection("leadership", resume.leadership, options, resume, config);
    case "achievements":
      return renderCustomSection("achievements", resume.achievements, options, resume, config);
    case "competitions":
      return renderCustomSection("competitions", resume.competitions, options, resume, config);
    case "extracurricular":
      return renderCustomSection("extracurricular", resume.extracurricular, options, resume, config);
    case "publications":
      return renderCustomSection("publications", resume.publications, options, resume, config);
    case "openSource":
      return renderCustomSection("openSource", resume.openSource, options, resume, config);
    case "languages":
      return renderLanguages(resume, options);
    case "hobbies":
      return renderHobbies(resume, options);
    default:
      return "";
  }
}

export function renderOptionsToText(order: OrderedResumeSectionId[]) {
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
    sectionOrder: [...DEFAULT_RENDER_OPTIONS.sectionOrder],
    sectionTitles: { ...DEFAULT_RENDER_OPTIONS.sectionTitles }
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
    buildPreamble(options, config),
    "\\begin{document}",
    `\\fontsize{${options.fontSize}}{${options.fontSize + 2}}\\selectfont`,
    renderHeader(resume, config),
    orderedSections,
    "\\end{document}"
  ]
    .filter(Boolean)
    .join("\n\n");
}

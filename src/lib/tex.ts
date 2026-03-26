import { getTemplateDefinition, templateCatalog } from "../data/templates";
import {
  DEFAULT_RENDER_OPTIONS,
  DEFAULT_RESUME_SECTION_ORDER,
  areSkillsGrouped,
  isCustomResumeSectionId,
  type CompactItem,
  type CustomSection,
  type OrderedResumeSectionId,
  type RenderOptions,
  type ResumeData,
  type ResumeSectionKey
} from "../types/resume";
import { flattenSkills, formatDateRange, getResumeContactLines, splitLineItems } from "./resume";

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

function getTemplateRenderConfig(templateId: RenderOptions["templateId"]): TemplateRenderConfig {
  switch (templateId) {
    case "classic":
      return {
        accentHex: "2D2D2D",
        bodySpacing: "0.34em",
        headerLayout: "center",
        itemSpacing: "0.18em",
        nameCommand: "\\LARGE",
        sectionMacro:
          "\\newcommand{\\resumeSection}[1]{\\vspace{0.8em}{\\large\\bfseries\\color{ResumeAccent}\\textsc{#1}}\\par\\vspace{0.22em}\\hrule height 0.6pt\\vspace{0.52em}}"
      };
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

function getBuiltInSectionTitle(section: ResumeSectionKey, options: RenderOptions, fallback: string) {
  return options.sectionTitles[section]?.trim() || fallback;
}

function findCustomSection(sectionId: string, resume: ResumeData) {
  return resume.customSections.find((section) => section.id === sectionId) ?? null;
}

function renderCustomSection(section: CustomSection) {
  return sectionBlock(section.title.trim() || "Custom Section", renderCompactItems(section.items));
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

function renderClassicHeader(resume: ResumeData) {
  const leftLines = [resume.header.phone?.trim(), resume.header.email?.trim(), resume.header.location?.trim()]
    .filter((value): value is string => Boolean(value))
    .map(escapeTex);
  const rightLines = [
    resume.header.linkedin?.trim(),
    resume.header.github?.trim(),
    resume.header.website?.trim(),
    resume.header.portfolio?.trim()
  ]
    .filter((value): value is string => Boolean(value))
    .map(escapeTex);
  const leftBlock = leftLines.length > 0 ? `${leftLines.join("\\\\\n")}\\\\` : "~\\\\";
  const rightBlock = rightLines.length > 0 ? `${rightLines.join("\\\\\n")}\\\\` : "~\\\\";
  const name = escapeTex(resume.header.name?.trim() || "Your Name");
  const title = escapeTex(resume.header.title?.trim() || "Professional Title");

  return [
    "\\begin{center}",
    "  \\begin{minipage}[b]{0.27\\textwidth}",
    `    \\small ${leftBlock}`,
    "  \\end{minipage}%",
    "  \\begin{minipage}[b]{0.46\\textwidth}",
    "    \\centering",
    `    {\\LARGE ${name}}\\\\`,
    `    {\\color{UIBlue}\\large ${title}}`,
    "  \\end{minipage}%",
    "  \\begin{minipage}[b]{0.27\\textwidth}",
    "    \\raggedleft\\small",
    `    ${rightBlock}`,
    "  \\end{minipage}",
    "  \\vspace{-0.15cm}",
    "  {\\color{UIBlue}\\hrulefill}",
    "\\end{center}"
  ].join("\n");
}

function renderClassicSkillRibbon(resume: ResumeData) {
  const topSkills = flattenSkills(resume.skills).filter((skill) => skill.trim()).slice(0, 4);

  if (topSkills.length === 0) {
    return "";
  }

  return topSkills.map((skill) => `\\begin{minipage}[b]{0.25\\textwidth}\\textbullet\\hspace{0.1cm}${escapeTex(skill)}\\end{minipage}`).join("\n");
}

function renderClassicSkillsTable(resume: ResumeData) {
  if (resume.skills.length === 0) {
    return "";
  }

  if (!areSkillsGrouped(resume.skills)) {
    return [
      "\\begin{tabularx}{\\textwidth}{p{7em} X}",
      `\\textbf{Skills} & ${escapeTex(resume.skills.join(", "))} \\\\`,
      "\\end{tabularx}"
    ].join("\n");
  }

  return [
    "\\begin{tabularx}{\\textwidth}{p{7em} X}",
    ...resume.skills.map((group) => `\\textbf{${escapeTex(group.category)}} & ${escapeTex(group.items.join(", "))} \\\\`),
    "\\end{tabularx}"
  ].join("\n");
}

function renderClassicExperience(resume: ResumeData, options: RenderOptions) {
  return resume.experience
    .filter((item) => item.role?.trim() || item.company?.trim())
    .map((item) => {
      const hasHeading = Boolean(item.role?.trim() || item.company?.trim());
      const dateRange = formatDateRange(item.startDate, item.endDate, item.current);
      const heading = item.company?.trim()
        ? `\\subsection*{${escapeTex(item.role?.trim() || "")}, {\\normalfont ${escapeTex(item.company.trim())}}${dateRange ? ` \\hfill ${escapeTex(dateRange)}` : ""}}`
        : `\\subsection*{${escapeTex(item.role?.trim() || "Experience")}${dateRange ? ` \\hfill ${escapeTex(dateRange)}` : ""}}`;
      const location = item.location?.trim() ? `\\small ${escapeTex(item.location.trim())}\\par` : "";
      const description = item.description?.trim() ? `\\par \\small ${escapeTex(item.description.trim())}\\par` : "";
      const bullets = item.bullets
        .slice(0, options.maxBulletsPerEntry)
        .filter((bullet) => bullet.trim())
        .map((bullet) => `\\item ${escapeTex(bullet.trim())}`)
        .join("\n");

      return [
        hasHeading ? heading : "",
        location,
        description,
        bullets
          ? ["\\begin{zitemize}", bullets, "\\end{zitemize}"].join("\n")
          : ""
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

function renderClassicEducation(resume: ResumeData) {
  return resume.education
    .filter((item) => item.degree?.trim() || item.institution?.trim())
    .map((item) => {
      const degreeParts = [item.degree?.trim(), item.field?.trim()].filter((value): value is string => Boolean(value)).map(escapeTex).join(", ");
      const institution = escapeTex(item.institution?.trim() || "Institution");
      const dateRange = [item.startYear?.trim(), item.endYear?.trim()].filter((value): value is string => Boolean(value)).map(escapeTex).join(" --- ");
      const gpa = item.gpa?.trim() ? `, GPA: ${escapeTex(item.gpa.trim())}` : "";

      return `\\subsection*{${degreeParts || "Education"}, {\\normalfont ${institution}${gpa}}${dateRange ? ` \\hfill ${dateRange}` : ""}}`;
    })
    .join("\n");
}

function renderClassicProjects(resume: ResumeData, options: RenderOptions) {
  return resume.projects
    .filter((item) => item.title?.trim())
    .map((item) => {
      const title = escapeTex(item.title?.trim() || "Project");
      const technologies = item.technologies.length > 0 ? `, {\\normalfont ${escapeTex(item.technologies.join(", "))}}` : "";
      const dateRange = formatDateRange(item.startDate, item.endDate);
      const description = item.description?.trim();
      const bullets = item.bullets
        .slice(0, options.maxBulletsPerEntry)
        .filter((bullet) => bullet.trim())
        .map((bullet) => `\\item ${escapeTex(bullet.trim())}`)
        .join("\n");

      return [
        `\\subsection*{${title}${technologies}${dateRange ? ` \\hfill ${escapeTex(dateRange)}` : ""}}`,
        description
          ? ["\\begin{zitemize}", `\\item ${escapeTex(description)}`, "\\end{zitemize}"].join("\n")
          : bullets
            ? ["\\begin{zitemize}", bullets, "\\end{zitemize}"].join("\n")
            : ""
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function renderClassicCompactList(items: CompactItem[]) {
  const rows = items
    .filter((item) => item.description?.trim())
    .map((item) => {
      const description = escapeTex(item.description?.trim() || "");
      const date = item.date?.trim() ? ` (${escapeTex(item.date.trim())})` : "";
      return `\\item ${description}${date}`;
    });

  if (rows.length === 0) {
    return "";
  }

  return ["\\begin{itemize}[leftmargin=1.2em,itemsep=0.2em]", ...rows, "\\end{itemize}"].join("\n");
}

function renderClassicSection(section: ResumeSectionKey, resume: ResumeData, options: RenderOptions) {
  switch (section) {
    case "summary":
      return resume.summary?.trim()
        ? sectionBlock(getBuiltInSectionTitle(section, options, "Summary"), escapeTex(resume.summary.trim()))
        : "";
    case "skills":
      return sectionBlock(getBuiltInSectionTitle(section, options, "Skills"), renderClassicSkillsTable(resume));
    case "education":
      return sectionBlock(getBuiltInSectionTitle(section, options, "Education"), renderClassicEducation(resume));
    case "experience":
      return sectionBlock(getBuiltInSectionTitle(section, options, "Experience"), renderClassicExperience(resume, options));
    case "projects":
      return sectionBlock(getBuiltInSectionTitle(section, options, "Projects"), renderClassicProjects(resume, options));
    case "certifications":
      return sectionBlock(getBuiltInSectionTitle(section, options, "Certifications"), renderClassicCompactList(resume.certifications));
    case "awards":
      return sectionBlock(getBuiltInSectionTitle(section, options, "Awards \\& Honors"), renderClassicCompactList(resume.awards));
    case "leadership":
      return sectionBlock(
        getBuiltInSectionTitle(section, options, "Leadership | Roles \\& Responsibilities"),
        renderClassicCompactList(resume.leadership)
      );
    case "extracurricular":
      return sectionBlock(
        getBuiltInSectionTitle(section, options, "Extracurricular Activities"),
        renderClassicCompactList(resume.extracurricular)
      );
    default:
      return "";
  }
}

function renderSection(
  section: ResumeSectionKey,
  resume: ResumeData,
  options: RenderOptions,
  config: TemplateRenderConfig
) {
  switch (section) {
    case "summary":
      return sectionBlock(
        getBuiltInSectionTitle(section, options, "Summary"),
        resume.summary?.trim() ? escapeTex(resume.summary.trim()) : ""
      );
    case "skills":
      return sectionBlock(getBuiltInSectionTitle(section, options, "Skills"), renderSkills(resume));
    case "education":
      return sectionBlock(getBuiltInSectionTitle(section, options, "Education"), renderEducation(resume));
    case "experience":
      return sectionBlock(getBuiltInSectionTitle(section, options, "Experience"), renderExperience(resume, options, config));
    case "projects":
      return sectionBlock(getBuiltInSectionTitle(section, options, "Projects"), renderProjects(resume, options, config));
    case "certifications":
      return sectionBlock(getBuiltInSectionTitle(section, options, "Certifications"), renderCompactItems(resume.certifications));
    case "awards":
      return sectionBlock(getBuiltInSectionTitle(section, options, "Awards"), renderCompactItems(resume.awards));
    case "leadership":
      return sectionBlock(getBuiltInSectionTitle(section, options, "Leadership"), renderCompactItems(resume.leadership));
    case "extracurricular":
      return sectionBlock(getBuiltInSectionTitle(section, options, "Extracurricular"), renderCompactItems(resume.extracurricular));
    default:
      return "";
  }
}

function renderOrderedSection(sectionId: OrderedResumeSectionId, resume: ResumeData, options: RenderOptions, config?: TemplateRenderConfig) {
  if (isCustomResumeSectionId(sectionId)) {
    const customSection = findCustomSection(sectionId, resume);
    return customSection ? renderCustomSection(customSection) : "";
  }

  return config ? renderSection(sectionId, resume, options, config) : renderClassicSection(sectionId, resume, options);
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

function buildClassicPreamble(options: RenderOptions) {
  return [
    `\\documentclass[a4,${options.fontSize}pt]{article}`,
    "\\usepackage[empty]{fullpage}",
    "\\usepackage{titlesec}",
    "\\usepackage{tabularx}",
    "\\usepackage[hidelinks]{hyperref}",
    "\\usepackage{enumitem}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage{xcolor}",
    `\\usepackage[margin=${options.margin}, top=${options.margin}]{geometry}`,
    "\\definecolor{UIBlue}{RGB}{32, 64, 151}",
    "\\pagestyle{empty}",
    "\\raggedbottom",
    "\\setlength{\\parindent}{0pt}",
    "\\setlength{\\parskip}{0.3em}",
    "\\titleformat{\\section}{\\color{UIBlue}\\scshape\\raggedright\\large}{}{0em}{}[\\vspace{-10pt}\\hrulefill\\vspace{-6pt}]",
    "\\titleformat{\\subsection}{\\bfseries\\normalsize}{}{0em}{}",
    "\\newenvironment{zitemize}{\\begin{itemize}[leftmargin=1.2em,itemsep=0.2em,topsep=0.2em]}{\\end{itemize}}",
    "\\newcommand{\\resumeSection}[1]{\\section{#1}}"
  ].join("\n");
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

  if (template.id === "classic") {
    const orderedSections = options.sectionOrder
      .map((section) => renderOrderedSection(section, resume, options))
      .filter(Boolean)
      .join("\n\n");

    return [
      `% Template: ${template.id} (${template.label})`,
      buildClassicPreamble(options),
      "\\begin{document}",
      renderClassicHeader(resume),
      renderClassicSkillRibbon(resume),
      orderedSections,
      "\\end{document}"
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  const config = getTemplateRenderConfig(template.id);
  const orderedSections = options.sectionOrder
    .map((section) => renderOrderedSection(section, resume, options, config))
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

import {
  RESUME_SECTION_LABELS,
  type CustomEntriesSection,
  type DescriptionField,
  type LinkField,
  type RenderOptions,
  type ResumeData,
  type ResumeSectionKey
} from "../../types/resume";
import {
  flattenSkills,
  formatDateField,
  getLinkLabel,
  getLinkUrl,
  getProfileLabel,
  getResumeContactLines,
  getSummaryText
} from "../../lib/resume";

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

function renderLink(link?: LinkField | null) {
  if (!link) {
    return "";
  }

  const url = getLinkUrl(link);
  if (!url) {
    return "";
  }

  const label = getLinkLabel(link) || url;
  if (link.displayMode === "hyperlinked-text" && label !== url) {
    return `\\href{${escapeHref(url)}}{${escapeTex(label)}}`;
  }

  return `\\href{${escapeHref(url)}}{${escapeTex(label)}}`;
}

function sectionBlock(title: string, content: string) {
  if (!content.trim()) {
    return "";
  }

  return [`\\section{${escapeTex(title)}}`, content].join("\n");
}

function renderDescription(description: DescriptionField, options: RenderOptions) {
  if (description.mode === "paragraph") {
    return description.paragraph?.trim() ? escapeTex(description.paragraph.trim()) : "";
  }

  const bullets = description.bullets
    .slice(0, options.maxBulletsPerEntry)
    .map((bullet) => bullet.trim())
    .filter(Boolean);

  if (bullets.length === 0) {
    return "";
  }

  return [
    "\\begin{zitemize}",
    ...bullets.map((bullet) => `\\item ${escapeTex(bullet)}`),
    "\\end{zitemize}"
  ].join("\n");
}

function getSectionTitle(section: ResumeSectionKey, options: RenderOptions, resume: ResumeData) {
  if (section === "summary") {
    return options.sectionTitles.summary?.trim() || getProfileLabel(resume);
  }

  if (
    section === "leadership" ||
    section === "achievements" ||
    section === "competitions" ||
    section === "extracurricular" ||
    section === "publications" ||
    section === "openSource"
  ) {
    return resume[section].label?.trim() || options.sectionTitles[section]?.trim() || RESUME_SECTION_LABELS[section];
  }

  return options.sectionTitles[section]?.trim() || RESUME_SECTION_LABELS[section];
}

function renderHeader(resume: ResumeData) {
  const leftLines = [resume.header.phone, resume.header.address, resume.header.email]
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item))
    .map((item) => escapeTex(item));

  const rightLines = [renderLink(resume.header.github), renderLink(resume.header.linkedin), renderLink(resume.header.website)].filter(Boolean);
  const name = escapeTex(resume.header.name?.trim() || "Your Name");
  const role = resume.header.role?.trim() ? escapeTex(resume.header.role.trim()) : "";

  return [
    "\\begin{center}",
    `{\\Huge \\skills ${name}}\\\\`,
    role ? `\\vspace{0.25em}{\\color{highlight} \\Large ${role}}\\\\` : "",
    "\\end{center}",
    "\\fancypagestyle{first_page}{",
    "  \\fancyhf{}",
    `  \\lhead{${leftLines.join(" \\\\ ")}}`,
    `  \\chead{\\centering {\\Huge \\skills ${name}}\\\\${role ? `\\vspace{0.25em}{\\color{highlight} \\Large ${role}}` : ""}}`,
    `  \\rhead{${rightLines.join(" \\\\ ")}}`,
    "  \\renewcommand{\\headrulewidth}{1pt}",
    "  \\renewcommand{\\headrule}{\\hbox to\\headwidth{\\color{highlight}\\leaders\\hrule height \\headrulewidth\\hfill}}",
    "  \\setlength{\\headheight}{90pt}",
    "  \\setlength{\\headsep}{8pt}",
    "}",
    "\\fancypagestyle{others}{",
    "  \\fancyhf{}",
    "  \\renewcommand{\\headrulewidth}{0pt}",
    "  \\setlength{\\headheight}{30pt}",
    "  \\setlength{\\headsep}{5pt}",
    "}",
    "\\pagestyle{others}",
    "\\thispagestyle{first_page}"
  ]
    .filter(Boolean)
    .join("\n");
}

function renderSummary(resume: ResumeData, options: RenderOptions) {
  const content = getSummaryText(resume);
  return sectionBlock(getSectionTitle("summary", options, resume), content ? escapeTex(content) : "");
}

function renderSkills(resume: ResumeData, options: RenderOptions) {
  const groupedRows =
    resume.skills.mode === "grouped"
      ? resume.skills.groups
          .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
          .map(
            (group) =>
              `\\skills{${escapeTex(group.groupLabel?.trim() || "Skills")}} & & ${escapeTex(group.items.join(", "))} \\\\`
          )
      : [];
  const csvRows =
    resume.skills.mode === "csv" && resume.skills.items.length > 0
      ? [`\\skills{Core Skills} & & ${escapeTex(flattenSkills(resume.skills).join(", "))} \\\\`]
      : [];
  const rows = [...groupedRows, ...csvRows];

  if (rows.length === 0) {
    return "";
  }

  return sectionBlock(
    getSectionTitle("skills", options, resume),
    ["\\begin{tabular}{p{11em} p{1em} p{0.67\\textwidth}}", ...rows, "\\end{tabular}"].join("\n")
  );
}

function renderEducation(resume: ResumeData, options: RenderOptions) {
  const content = resume.education
    .map((item) => {
      const left = [item.degree?.trim(), item.field?.trim()]
        .filter((value): value is string => Boolean(value))
        .map(escapeTex)
        .join(" in ");
      const institution = [item.institution?.trim(), item.location?.trim()]
        .filter((value): value is string => Boolean(value))
        .map(escapeTex)
        .join(", ");
      const result = item.result?.trim() ? ` (${escapeTex(item.result.trim())})` : "";
      const date = formatDateField(item.date);

      if (!left && !institution && !date) {
        return "";
      }

      return `\\skills{${left || "Education"}${result}}, \\textit{${institution || escapeTex(item.boardOrUniversity?.trim() || "")}} \\hfill ${escapeTex(date)}`;
    })
    .filter(Boolean)
    .join("\n\n");

  return sectionBlock(getSectionTitle("education", options, resume), content);
}

function renderSubsectionBlock(title: string, subtitle: string, trailing: string, body: string) {
  if (!title && !subtitle && !body) {
    return "";
  }

  return [
    `\\subsection{{${title || "Untitled"}${trailing ? ` \\hfill ${trailing}` : ""}}}`,
    subtitle ? `\\subtext{${subtitle}}` : "",
    body
  ]
    .filter(Boolean)
    .join("\n");
}

function renderExperience(resume: ResumeData, options: RenderOptions) {
  const content = resume.experience
    .map((item) => {
      const title = [item.role?.trim(), item.company?.trim()]
        .filter((value): value is string => Boolean(value))
        .map(escapeTex)
        .join(" at ");
      const subtitle = item.location?.trim() ? escapeTex(item.location.trim()) : "";
      const date = formatDateField(item.date).trim() ? escapeTex(formatDateField(item.date)) : "";
      const body = renderDescription(item.description, options);

      return renderSubsectionBlock(title, subtitle, date, body);
    })
    .filter(Boolean)
    .join("\n\n");

  return sectionBlock(getSectionTitle("experience", options, resume), content);
}

function renderProjects(resume: ResumeData, options: RenderOptions) {
  const content = resume.projects
    .map((item) => {
      const title = item.title?.trim() ? escapeTex(item.title.trim()) : "";
      const techLine = item.technologies.length > 0 ? `Tech Stack: ${escapeTex(item.technologies.join(", "))}` : "";
      const linkLine = [renderLink(item.githubLink), renderLink(item.liveLink)].filter(Boolean).join(" | ");
      const subtitle = [techLine, linkLine].filter(Boolean).join(" \\hfill ");
      const date = formatDateField(item.date).trim() ? escapeTex(formatDateField(item.date)) : "";
      const body = renderDescription(item.description, options);

      return renderSubsectionBlock(title, subtitle, date, body);
    })
    .filter(Boolean)
    .join("\n\n");

  return sectionBlock(getSectionTitle("projects", options, resume), content);
}

function renderCertifications(resume: ResumeData, options: RenderOptions) {
  const content = resume.certifications
    .map((item) => {
      const title = [item.title?.trim(), item.issuer?.trim()]
        .filter((value): value is string => Boolean(value))
        .map(escapeTex)
        .join(" | ");
      const subtitle = [item.description?.trim(), renderLink(item.link)]
        .filter((value): value is string => Boolean(value))
        .map((value) => (value.startsWith("\\href") ? value : escapeTex(value)))
        .join(" \\hfill ");
      const date = formatDateField(item.date).trim() ? escapeTex(formatDateField(item.date)) : "";

      return renderSubsectionBlock(title, subtitle, date, "");
    })
    .filter(Boolean)
    .join("\n\n");

  return sectionBlock(getSectionTitle("certifications", options, resume), content);
}

function renderCustomSection(sectionKey: ResumeSectionKey, section: CustomEntriesSection, options: RenderOptions, resume: ResumeData) {
  const content = section.entries
    .map((entry) => {
      const title = [entry.title?.trim(), entry.subtitle?.trim()]
        .filter((value): value is string => Boolean(value))
        .map(escapeTex)
        .join(" | ");
      const subtitle = [entry.location?.trim(), renderLink(entry.link)]
        .filter((value): value is string => Boolean(value))
        .map((value) => (value.startsWith("\\href") ? value : escapeTex(value)))
        .join(" \\hfill ");
      const date = formatDateField(entry.date).trim() ? escapeTex(formatDateField(entry.date)) : "";
      const body = renderDescription(entry.description, options);

      return renderSubsectionBlock(title, subtitle, date, body);
    })
    .filter(Boolean)
    .join("\n\n");

  return sectionBlock(getSectionTitle(sectionKey, options, resume), content);
}

function renderLanguages(resume: ResumeData, options: RenderOptions) {
  const grouped =
    resume.languages.mode === "grouped"
      ? resume.languages.groups
          .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
          .map(
            (group) =>
              `\\skills{${escapeTex(group.groupLabel?.trim() || "Languages")}} & & ${escapeTex(group.items.join(", "))} \\\\`
          )
      : [];
  const csv =
    resume.languages.mode === "csv"
      ? resume.languages.items
          .map((item) =>
            [item.language?.trim(), item.proficiency?.trim()]
              .filter((value): value is string => Boolean(value))
              .map(escapeTex)
              .join(" | ")
          )
          .filter(Boolean)
      : [];
  const rows = grouped.length > 0 ? grouped : csv.map((line) => `\\skills{Language} & & ${line} \\\\`);

  if (rows.length === 0) {
    return "";
  }

  return sectionBlock(
    getSectionTitle("languages", options, resume),
    ["\\begin{tabular}{p{11em} p{1em} p{0.67\\textwidth}}", ...rows, "\\end{tabular}"].join("\n")
  );
}

function renderHobbies(resume: ResumeData, options: RenderOptions) {
  const grouped =
    resume.hobbies.mode === "grouped"
      ? resume.hobbies.groups
          .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
          .map(
            (group) =>
              `\\skills{${escapeTex(group.groupLabel?.trim() || "Interests")}} & & ${escapeTex(group.items.join(", "))} \\\\`
          )
      : [];
  const rows =
    grouped.length > 0
      ? grouped
      : resume.hobbies.items.length > 0
        ? [`\\skills{Interests} & & ${escapeTex(resume.hobbies.items.join(", "))} \\\\`]
        : [];

  if (rows.length === 0) {
    return "";
  }

  return sectionBlock(
    getSectionTitle("hobbies", options, resume),
    ["\\begin{tabular}{p{11em} p{1em} p{0.67\\textwidth}}", ...rows, "\\end{tabular}"].join("\n")
  );
}

function renderSection(section: ResumeSectionKey, resume: ResumeData, options: RenderOptions) {
  switch (section) {
    case "summary":
      return renderSummary(resume, options);
    case "education":
      return renderEducation(resume, options);
    case "skills":
      return renderSkills(resume, options);
    case "experience":
      return renderExperience(resume, options);
    case "projects":
      return renderProjects(resume, options);
    case "certifications":
      return renderCertifications(resume, options);
    case "leadership":
      return renderCustomSection("leadership", resume.leadership, options, resume);
    case "achievements":
      return renderCustomSection("achievements", resume.achievements, options, resume);
    case "competitions":
      return renderCustomSection("competitions", resume.competitions, options, resume);
    case "extracurricular":
      return renderCustomSection("extracurricular", resume.extracurricular, options, resume);
    case "publications":
      return renderCustomSection("publications", resume.publications, options, resume);
    case "openSource":
      return renderCustomSection("openSource", resume.openSource, options, resume);
    case "languages":
      return renderLanguages(resume, options);
    case "hobbies":
      return renderHobbies(resume, options);
    default:
      return "";
  }
}

function buildPreamble(options: RenderOptions) {
  return [
    "\\documentclass[10pt]{article}",
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage[scaled=0.96]{helvet}",
    "\\renewcommand{\\familydefault}{\\sfdefault}",
    "\\usepackage{enumitem}",
    `\\usepackage[margin=${options.margin}, top=${options.margin}, bottom=${options.margin}]{geometry}`,
    "\\raggedright",
    "\\raggedbottom",
    "\\usepackage{xcolor}",
    "\\definecolor{highlight}{RGB}{61, 90, 128}",
    "\\usepackage{hyperref}",
    "\\hypersetup{colorlinks=true,urlcolor=highlight}",
    "\\usepackage[nostruts]{titlesec}",
    "\\usepackage{fancyhdr}",
    "\\usepackage{tabularx}",
    "\\setlength{\\tabcolsep}{0in}",
    "\\titlespacing*{\\section}{0em}{0.7em}{0.15em}",
    "\\titleformat{\\section}{\\color{highlight} \\scshape \\raggedright \\large}{}{0em}{}[\\vspace{-0.65em}\\hrulefill]",
    "\\titlespacing*{\\subsection}{0em}{0.1em}{0em}",
    "\\titleformat{\\subsection}{\\bfseries}{}{0em}{}[]",
    "\\newcommand{\\skills}[1]{{\\bfseries #1}}",
    "\\newcommand{\\subtext}[1]{\\textit{#1}\\par\\vspace{-0.4em}}",
    "\\setlist[itemize]{align=parleft,left=0pt..1em}",
    "\\newenvironment{zitemize}{\\begin{itemize} \\itemsep 0pt \\parskip 0pt \\parsep 1pt}{\\end{itemize}\\vspace{-0.5em}}",
    "\\pagenumbering{gobble}"
  ].join("\n");
}

export function renderTemplate1ToTex(resume: ResumeData, options: RenderOptions) {
  const orderedSections = options.sectionOrder
    .map((section) => renderSection(section, resume, options))
    .filter(Boolean)
    .join("\n\n");

  return [
    "% Template: template1",
    buildPreamble(options),
    "\\begin{document}",
    `\\fontsize{${options.fontSize}}{${options.fontSize + 2}}\\selectfont`,
    renderHeader(resume),
    orderedSections,
    "\\end{document}"
  ]
    .filter(Boolean)
    .join("\n\n");
}

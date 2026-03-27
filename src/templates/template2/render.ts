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
  return `\\href{${escapeHref(url)}}{\\underline{${escapeTex(label)}}}`;
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

function sectionBlock(title: string, content: string) {
  if (!content.trim()) {
    return "";
  }

  return [`\\section{${escapeTex(title)}}`, content].join("\n");
}

function renderDescription(description: DescriptionField, options: RenderOptions) {
  if (description.mode === "paragraph") {
    return description.paragraph?.trim()
      ? ["\\resumeItemListStart", `\\resumeItem{${escapeTex(description.paragraph.trim())}}`, "\\resumeItemListEnd"].join("\n")
      : "";
  }

  const bullets = description.bullets
    .slice(0, options.maxBulletsPerEntry)
    .map((bullet) => bullet.trim())
    .filter(Boolean);

  if (bullets.length === 0) {
    return "";
  }

  return ["\\resumeItemListStart", ...bullets.map((bullet) => `\\resumeItem{${escapeTex(bullet)}}`), "\\resumeItemListEnd"].join("\n");
}

function renderHeader(resume: ResumeData) {
  const contactLine = getResumeContactLines(resume)
    .map((item) => escapeTex(item))
    .join(" ~ ");
  const links = [renderLink(resume.header.linkedin), renderLink(resume.header.github), renderLink(resume.header.website)]
    .filter(Boolean)
    .join(" ~ ");

  return [
    "\\begin{center}",
    `{\\Huge \\scshape ${escapeTex(resume.header.name?.trim() || "Your Name")}} \\\\ \\vspace{1pt}`,
    resume.header.address?.trim() ? `${escapeTex(resume.header.address.trim())} \\\\ \\vspace{1pt}` : "",
    contactLine ? `\\small ${contactLine}${links ? ` ~ ${links}` : ""}` : links ? `\\small ${links}` : "",
    "\\vspace{-8pt}",
    "\\end{center}"
  ]
    .filter(Boolean)
    .join("\n");
}

function renderSummary(resume: ResumeData, options: RenderOptions) {
  const content = getSummaryText(resume);
  return sectionBlock(
    getSectionTitle("summary", options, resume),
    content
      ? ["\\begin{itemize}[leftmargin=0.15in, label={}]", `\\small{\\item{${escapeTex(content)}}}`, "\\end{itemize}", "\\vspace{-10pt}"].join("\n")
      : ""
  );
}

function renderEducation(resume: ResumeData, options: RenderOptions) {
  const items = resume.education
    .map((item) => {
      const school = item.institution?.trim() || item.boardOrUniversity?.trim();
      const degree = [item.degree?.trim(), item.field?.trim()].filter((value): value is string => Boolean(value)).join(" in ");
      const meta = item.location?.trim() || "";
      const date = formatDateField(item.date).trim();

      if (!school && !degree && !date) {
        return "";
      }

      return [
        "\\resumeSubheading",
        `  {${escapeTex(school || "Education")}}{${escapeTex(date)}}`,
        `  {${escapeTex(degree || item.result?.trim() || "")}}{${escapeTex(meta)}}`
      ].join("\n");
    })
    .filter(Boolean);

  return sectionBlock(
    getSectionTitle("education", options, resume),
    items.length > 0 ? ["\\resumeSubHeadingListStart", ...items, "\\resumeSubHeadingListEnd", "\\vspace{-10pt}"].join("\n") : ""
  );
}

function renderExperience(resume: ResumeData, options: RenderOptions) {
  const items = resume.experience
    .map((item) => {
      const role = item.role?.trim() || "";
      const company = item.company?.trim() || "";
      const location = item.location?.trim() || "";
      const date = formatDateField(item.date).trim();
      const description = renderDescription(item.description, options);

      if (!role && !company && !description) {
        return "";
      }

      return [
        "\\resumeSubheading",
        `  {${escapeTex(company || role || "Experience")}}{${escapeTex(date)}}`,
        `  {${escapeTex(role)}}{${escapeTex(location)}}`,
        description
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean);

  return sectionBlock(
    getSectionTitle("experience", options, resume),
    items.length > 0 ? ["\\resumeSubHeadingListStart", ...items, "\\resumeSubHeadingListEnd", "\\vspace{-12pt}"].join("\n") : ""
  );
}

function renderProjects(resume: ResumeData, options: RenderOptions) {
  const items = resume.projects
    .map((item) => {
      const tech = item.technologies.length > 0 ? `\\emph{${escapeTex(item.technologies.join(", "))}}` : "";
      const title = item.title?.trim() ? `\\textbf{${escapeTex(item.title.trim())}}` : "\\textbf{Project}";
      const headingLeft = [title, tech].filter(Boolean).join(" $|$ ");
      const date = formatDateField(item.date).trim();
      const description = renderDescription(item.description, options);

      if (!item.title?.trim() && !description) {
        return "";
      }

      return [
        "\\resumeProjectHeading",
        `  {${headingLeft}}{${escapeTex(date)}}`,
        [renderLink(item.githubLink), renderLink(item.liveLink)].filter(Boolean).join(" \\\\ "),
        description,
        "\\vspace{-10pt}"
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean);

  return sectionBlock(
    getSectionTitle("projects", options, resume),
    items.length > 0 ? ["\\resumeSubHeadingListStart", ...items, "\\resumeSubHeadingListEnd", "\\vspace{-10pt}"].join("\n") : ""
  );
}

function renderCertifications(resume: ResumeData, options: RenderOptions) {
  const lines = resume.certifications
    .map((item) => {
      const parts = [item.title?.trim(), item.issuer?.trim(), item.description?.trim(), formatDateField(item.date), getLinkLabel(item.link)]
        .filter((value): value is string => Boolean(value))
        .map(escapeTex);
      return parts.join(" | ");
    })
    .filter(Boolean);

  return sectionBlock(
    getSectionTitle("certifications", options, resume),
    lines.length > 0 ? ["\\begin{itemize}[leftmargin=0.15in, label={}]", `\\small{\\item{${lines.join(" \\\\ ")}}}`, "\\end{itemize}", "\\vspace{-12pt}"].join("\n") : ""
  );
}

function renderCustomSection(sectionKey: ResumeSectionKey, section: CustomEntriesSection, options: RenderOptions, resume: ResumeData) {
  const items = section.entries
    .map((entry) => {
      const title = entry.title?.trim() || section.label;
      const subtitle = entry.subtitle?.trim() || "";
      const location = entry.location?.trim() || "";
      const date = formatDateField(entry.date).trim();
      const description = renderDescription(entry.description, options);

      if (!title && !description) {
        return "";
      }

      return [
        "\\resumeSubheading",
        `  {${escapeTex(title)}}{${escapeTex(date)}}`,
        `  {${escapeTex(subtitle)}}{${escapeTex(location)}}`,
        renderLink(entry.link),
        description
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean);

  return sectionBlock(
    getSectionTitle(sectionKey, options, resume),
    items.length > 0 ? ["\\resumeSubHeadingListStart", ...items, "\\resumeSubHeadingListEnd", "\\vspace{-12pt}"].join("\n") : ""
  );
}

function renderLanguages(resume: ResumeData, options: RenderOptions) {
  const content =
    resume.languages.mode === "grouped"
      ? resume.languages.groups
          .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
          .map((group) => `\\textbf{${escapeTex(group.groupLabel?.trim() || "Languages")}}{: ${escapeTex(group.items.join(", "))}} \\\\`)
          .join("\n")
      : resume.languages.items
          .map((item) =>
            [item.language?.trim(), item.proficiency?.trim()]
              .filter((value): value is string => Boolean(value))
              .map(escapeTex)
              .join(" | ")
          )
          .filter(Boolean)
          .join(" \\\\ ");

  return sectionBlock(
    getSectionTitle("languages", options, resume),
    content ? ["\\begin{itemize}[leftmargin=0.15in, label={}]", `\\small{\\item{${content}}}`, "\\end{itemize}", "\\vspace{-12pt}"].join("\n") : ""
  );
}

function renderHobbies(resume: ResumeData, options: RenderOptions) {
  const content =
    resume.hobbies.mode === "grouped"
      ? resume.hobbies.groups
          .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
          .map((group) => `\\textbf{${escapeTex(group.groupLabel?.trim() || "Interests")}}{: ${escapeTex(group.items.join(", "))}} \\\\`)
          .join("\n")
      : escapeTex(resume.hobbies.items.join(", "));

  return sectionBlock(
    getSectionTitle("hobbies", options, resume),
    content ? ["\\begin{itemize}[leftmargin=0.15in, label={}]", `\\small{\\item{${content}}}`, "\\end{itemize}", "\\vspace{-12pt}"].join("\n") : ""
  );
}

function renderSection(section: ResumeSectionKey, resume: ResumeData, options: RenderOptions) {
  switch (section) {
    case "summary":
      return renderSummary(resume, options);
    case "education":
      return renderEducation(resume, options);
    case "skills":
      return sectionBlock(
        getSectionTitle("skills", options, resume),
        flattenSkills(resume.skills).length > 0
          ? [
              "\\begin{itemize}[leftmargin=0.15in, label={}]",
              "\\small{\\item{",
              ...(
                resume.skills.mode === "grouped"
                  ? resume.skills.groups
                      .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
                      .map((group) => `\\textbf{${escapeTex(group.groupLabel?.trim() || "Skills")}}{: ${escapeTex(group.items.join(", "))}} \\\\`)
                  : [`\\textbf{Core Skills}{: ${escapeTex(flattenSkills(resume.skills).join(", "))}}`]
              ),
              "}}",
              "\\end{itemize}",
              "\\vspace{-12pt}"
            ].join("\n")
          : ""
      );
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
    "\\documentclass[letterpaper,11pt]{article}",
    "\\usepackage{latexsym}",
    "\\usepackage[empty]{fullpage}",
    "\\usepackage{titlesec}",
    "\\usepackage{marvosym}",
    "\\usepackage[usenames,dvipsnames]{color}",
    "\\usepackage{enumitem}",
    "\\usepackage[hidelinks]{hyperref}",
    "\\usepackage{fancyhdr}",
    "\\usepackage[english]{babel}",
    "\\usepackage{tabularx}",
    "\\pagestyle{fancy}",
    "\\fancyhf{}",
    "\\fancyfoot{}",
    "\\renewcommand{\\headrulewidth}{0pt}",
    "\\renewcommand{\\footrulewidth}{0pt}",
    `\\addtolength{\\oddsidemargin}{-${options.margin}}`,
    `\\addtolength{\\evensidemargin}{-${options.margin}}`,
    "\\addtolength{\\textwidth}{1.19in}",
    "\\addtolength{\\topmargin}{-.7in}",
    "\\addtolength{\\textheight}{1.4in}",
    "\\urlstyle{same}",
    "\\raggedbottom",
    "\\raggedright",
    "\\setlength{\\tabcolsep}{0in}",
    "\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]",
    "\\pdfgentounicode=1",
    "\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-2pt}}}}",
    "\\newcommand{\\resumeSubheading}[4]{\\vspace{-2pt}\\item\\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}\\textbf{#1} & \\textbf{\\small #2} \\\\ \\textit{\\small#3} & \\textit{\\small #4} \\\\ \\end{tabular*}\\vspace{-7pt}}",
    "\\newcommand{\\resumeProjectHeading}[2]{\\item\\begin{tabular*}{1.001\\textwidth}{l@{\\extracolsep{\\fill}}r}\\small#1 & \\textbf{\\small #2}\\\\\\end{tabular*}\\vspace{-7pt}}",
    "\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}",
    "\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}",
    "\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.0in, label={}]}}",
    "\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}",
    "\\newcommand{\\resumeItemListStart}{\\begin{itemize}}",
    "\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}"
  ].join("\n");
}

export function renderTemplate2ToTex(resume: ResumeData, options: RenderOptions) {
  const orderedSections = options.sectionOrder
    .map((section) => renderSection(section, resume, options))
    .filter(Boolean)
    .join("\n\n");

  return [
    "% Template: template2",
    buildPreamble(options),
    "\\begin{document}",
    renderHeader(resume),
    orderedSections,
    "\\end{document}"
  ]
    .filter(Boolean)
    .join("\n\n");
}

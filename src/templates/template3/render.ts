import {
  type CustomEntriesSection,
  type RenderOptions,
  type ResumeData,
  type ResumeSectionKey
} from "../../types/resume";
import {
  flattenSkills,
  formatDateField,
  getResumeContactLines,
  getSummaryText
} from "../../lib/resume";
import { escapeTex, getDescriptionLines, getTemplateSectionTitle, renderLink } from "../render-utils";

function formatUpdatedDate(isoString?: string) {
  if (!isoString) {
    return "";
  }

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function sectionBlock(title: string, content: string) {
  if (!content.trim()) {
    return "";
  }

  return [`\\section{${escapeTex(title)}}`, content].join("\n");
}

function renderBulletList(lines: string[]) {
  if (lines.length === 0) {
    return "";
  }

  return ["\\resumeItemListStart", ...lines.map((line) => `\\resumeItem{${escapeTex(line)}}`), "\\resumeItemListEnd"].join("\n");
}

function renderHeader(resume: ResumeData) {
  const updatedDate = formatUpdatedDate(resume.meta.updatedAt);
  const links = [renderLink(resume.header.github, true), renderLink(resume.header.website, true), renderLink(resume.header.linkedin, true)]
    .filter(Boolean)
    .join(" $\\cdot$ ");
  const contactLine = getResumeContactLines(resume)
    .filter((item) => {
      const trimmed = item.trim();
      return trimmed !== (resume.header.github.url?.trim() ?? "") && trimmed !== (resume.header.linkedin.url?.trim() ?? "") && trimmed !== (resume.header.website.url?.trim() ?? "");
    })
    .map((item) => escapeTex(item))
    .join(" $\\cdot$ ");

  return [
    updatedDate ? "\\begin{flushright}" : "",
    updatedDate ? `\\footnotesize\\color{gray} Updated ${escapeTex(updatedDate)}` : "",
    updatedDate ? "\\end{flushright}" : "",
    updatedDate ? "\\vspace{-6pt}" : "",
    "\\begin{center}",
    `\\textbf{\\Huge \\scshape ${escapeTex(resume.header.name?.trim() || "Your Name")}} \\\\ \\vspace{6pt}`,
    resume.header.role?.trim() ? `${escapeTex(resume.header.role.trim())} \\\\ \\vspace{2pt}` : "",
    [contactLine, links].filter(Boolean).join(" $\\cdot$ "),
    "\\end{center}",
    "\\vspace{-6pt}"
  ]
    .filter(Boolean)
    .join("\n");
}

function renderSummary(resume: ResumeData, options: RenderOptions) {
  const summary = getSummaryText(resume);
  const lines = summary ? [summary] : [];
  return sectionBlock(getTemplateSectionTitle("summary", options, resume), renderBulletList(lines));
}

function renderEducation(resume: ResumeData, options: RenderOptions) {
  const rows = resume.education
    .map((item) => {
      const school = item.institution?.trim() || item.boardOrUniversity?.trim() || "";
      const degree = [item.degree?.trim(), item.field?.trim()].filter((value): value is string => Boolean(value)).join(" in ");
      const right = formatDateField(item.date);
      const meta = [item.location?.trim(), item.result?.trim()].filter((value): value is string => Boolean(value)).join(" | ");

      if (!school && !degree && !right && !meta) {
        return "";
      }

      return [
        "\\resumeSubheading",
        `  {${escapeTex(school || "Education")}}{${escapeTex(right)}}`,
        `  {${escapeTex(degree)}}{${escapeTex(meta)}}`
      ].join("\n");
    })
    .filter(Boolean);

  return sectionBlock(
    getTemplateSectionTitle("education", options, resume),
    rows.length > 0 ? ["\\resumeSubHeadingListStart", ...rows, "\\resumeSubHeadingListEnd"].join("\n") : ""
  );
}

function renderSkills(resume: ResumeData, options: RenderOptions) {
  const grouped =
    resume.skills.mode === "grouped"
      ? resume.skills.groups
          .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
          .map((group) => `\\textbf{${escapeTex(group.groupLabel?.trim() || "Skills")}}{: ${escapeTex(group.items.join(", "))}} \\\\`)
      : [];
  const csv =
    resume.skills.mode === "csv" && flattenSkills(resume.skills).length > 0
      ? [`\\textbf{Core Skills}{: ${escapeTex(flattenSkills(resume.skills).join(", "))}}`]
      : [];
  const rows = grouped.length > 0 ? grouped : csv;

  return sectionBlock(
    getTemplateSectionTitle("skills", options, resume),
    rows.length > 0 ? ["\\begin{itemize}[leftmargin=0.15in, label={}]", `\\small{\\item{${rows.join(" ")}}}`, "\\end{itemize}"].join("\n") : ""
  );
}

function renderExperience(resume: ResumeData, options: RenderOptions) {
  const rows = resume.experience
    .map((item) => {
      const heading = [item.role?.trim(), item.company?.trim()].filter((value): value is string => Boolean(value));
      const title = heading.length > 0 ? heading.join(" at ") : "";
      const date = formatDateField(item.date);
      const subtitle = item.location?.trim() ?? "";
      const bullets = renderBulletList(getDescriptionLines(item.description, options));

      if (!title && !subtitle && !bullets) {
        return "";
      }

      return [
        "\\resumeSubheading",
        `  {${escapeTex(title || "Experience")}}{${escapeTex(date)}}`,
        `  {${escapeTex(subtitle)}}{}`,
        bullets
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean);

  return sectionBlock(
    getTemplateSectionTitle("experience", options, resume),
    rows.length > 0 ? ["\\resumeSubHeadingListStart", ...rows, "\\resumeSubHeadingListEnd"].join("\n") : ""
  );
}

function renderProjects(resume: ResumeData, options: RenderOptions) {
  const rows = resume.projects
    .map((item) => {
      const techLine = item.technologies.length > 0 ? `\\footnotesize\\emph{${escapeTex(item.technologies.join(", "))}}` : "";
      const links = [renderLink(item.githubLink, true), renderLink(item.liveLink, true)].filter(Boolean).join(" $\\cdot$ ");
      const title = item.title?.trim() ? `\\textbf{${escapeTex(item.title.trim())}}` : "\\textbf{Project}";
      const heading = [title, techLine].filter(Boolean).join(" $|$ ");
      const date = formatDateField(item.date);
      const bullets = renderBulletList(getDescriptionLines(item.description, options));

      if (!item.title?.trim() && !bullets) {
        return "";
      }

      return [
        "\\resumeProjectHeading",
        `  {${heading}}{${escapeTex(date)}}`,
        links,
        bullets
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean);

  return sectionBlock(
    getTemplateSectionTitle("projects", options, resume),
    rows.length > 0 ? ["\\resumeSubHeadingListStart", ...rows, "\\resumeSubHeadingListEnd"].join("\n") : ""
  );
}

function renderCertifications(resume: ResumeData, options: RenderOptions) {
  const rows = resume.certifications
    .map((item) =>
      [item.title?.trim(), item.issuer?.trim(), formatDateField(item.date), renderLink(item.link, true)]
        .filter((value): value is string => Boolean(value))
        .join(" | ")
    )
    .filter(Boolean);

  return sectionBlock(getTemplateSectionTitle("certifications", options, resume), renderBulletList(rows));
}

function renderCustomSection(sectionKey: ResumeSectionKey, section: CustomEntriesSection, options: RenderOptions, resume: ResumeData) {
  const rows = section.entries
    .map((entry) => {
      const title = [entry.title?.trim(), entry.subtitle?.trim()].filter((value): value is string => Boolean(value)).join(" | ");
      const date = formatDateField(entry.date);
      const subtitle = [entry.location?.trim(), renderLink(entry.link, true)].filter((value): value is string => Boolean(value)).join(" $\\cdot$ ");
      const bullets = renderBulletList(getDescriptionLines(entry.description, options));

      if (!title && !subtitle && !bullets) {
        return "";
      }

      return [
        "\\resumeSubheading",
        `  {${escapeTex(title || section.label)}}{${escapeTex(date)}}`,
        `  {${subtitle.startsWith("\\href") ? subtitle : escapeTex(subtitle)}}{}`,
        bullets
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean);

  return sectionBlock(
    getTemplateSectionTitle(sectionKey, options, resume),
    rows.length > 0 ? ["\\resumeSubHeadingListStart", ...rows, "\\resumeSubHeadingListEnd"].join("\n") : ""
  );
}

function renderLanguages(resume: ResumeData, options: RenderOptions) {
  const rows =
    resume.languages.mode === "grouped"
      ? resume.languages.groups
          .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
          .map((group) => `${group.groupLabel?.trim() || "Languages"}: ${group.items.join(", ")}`)
      : resume.languages.items
          .map((item) => [item.language?.trim(), item.proficiency?.trim()].filter((value): value is string => Boolean(value)).join(" | "))
          .filter(Boolean);

  return sectionBlock(getTemplateSectionTitle("languages", options, resume), renderBulletList(rows));
}

function renderHobbies(resume: ResumeData, options: RenderOptions) {
  const rows =
    resume.hobbies.mode === "grouped"
      ? resume.hobbies.groups
          .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
          .map((group) => `${group.groupLabel?.trim() || "Interests"}: ${group.items.join(", ")}`)
      : resume.hobbies.items.filter(Boolean);

  return sectionBlock(getTemplateSectionTitle("hobbies", options, resume), renderBulletList(rows));
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
    "\\documentclass[letterpaper,11pt]{article}",
    "\\usepackage[empty]{fullpage}",
    "\\usepackage{titlesec}",
    "\\usepackage{enumitem}",
    "\\usepackage[hidelinks]{hyperref}",
    "\\usepackage{xcolor}",
    "\\usepackage{tabularx}",
    "\\usepackage[T1]{fontenc}",
    `\\usepackage[margin=${options.margin}]{geometry}`,
    "\\urlstyle{same}",
    "\\raggedbottom",
    "\\raggedright",
    "\\setlength{\\tabcolsep}{0in}",
    "\\titleformat{\\section}{\\vspace{-3pt}\\scshape\\raggedright\\large\\bfseries}{}{0em}{}[\\color{black}\\titlerule\\vspace{-4pt}]",
    "\\pdfgentounicode=1",
    "\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-2pt}}}}",
    "\\newcommand{\\resumeSubheading}[4]{\\vspace{-1pt}\\item\\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}\\textbf{#1} & #2 \\\\ \\textit{\\small#3} & \\textit{\\small #4} \\\\ \\end{tabular*}\\vspace{-7pt}}",
    "\\newcommand{\\resumeProjectHeading}[2]{\\item\\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}\\small#1 & #2 \\\\ \\end{tabular*}\\vspace{-7pt}}",
    "\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}}",
    "\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}",
    "\\newcommand{\\resumeItemListStart}{\\begin{itemize}}",
    "\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}"
  ].join("\n");
}

export function renderTemplate3ToTex(resume: ResumeData, options: RenderOptions) {
  const orderedSections = options.sectionOrder
    .map((section) => renderSection(section, resume, options))
    .filter(Boolean)
    .join("\n\n");

  return [
    "% Template: template3",
    buildPreamble(options),
    "\\begin{document}",
    renderHeader(resume),
    orderedSections,
    "\\end{document}"
  ]
    .filter(Boolean)
    .join("\n\n");
}

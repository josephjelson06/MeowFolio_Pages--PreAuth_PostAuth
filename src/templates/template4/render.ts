import {
  type CustomEntriesSection,
  type RenderOptions,
  type ResumeData,
  type ResumeSectionKey
} from "../../types/resume";
import { formatDateField, getSummaryText } from "../../lib/resume";
import { escapeTex, getDescriptionLines, getDescriptionParagraph, getTemplateSectionTitle, renderLink } from "../render-utils";

function sectionBlock(title: string, content: string) {
  if (!content.trim()) {
    return "";
  }

  return [`\\begin{section}{${escapeTex(title)}}`, content, "\\end{section}"].join("\n");
}

function renderHeaderValue(value: string) {
  return value.trim() ? value : "\\mbox{}";
}

function renderHeader(resume: ResumeData) {
  const primaryLinks = [renderLink(resume.header.linkedin), renderLink(resume.header.email ? { displayMode: "hyperlinked-text", displayText: resume.header.email, url: `mailto:${resume.header.email}` } : null), renderLink(resume.header.github)]
    .filter(Boolean);
  const secondaryLinks = [escapeTex(resume.header.phone?.trim() ?? ""), renderLink(resume.header.website), escapeTex(resume.header.address?.trim() ?? "")]
    .filter(Boolean);

  return [
    `\\fullname{${escapeTex(resume.header.name?.trim() || "Your Name")}}`,
    resume.header.role?.trim() ? `\\jobtitle{${escapeTex(resume.header.role.trim())}}` : "",
    "\\begin{document}",
    "\\resumeheader",
    `{${renderHeaderValue(primaryLinks[0] ?? "")}}`,
    `{${renderHeaderValue(primaryLinks[1] ?? "")}}`,
    `{${renderHeaderValue(primaryLinks[2] ?? "")}}`,
    `{${renderHeaderValue(secondaryLinks[0] ?? "")}}`,
    `{${renderHeaderValue(secondaryLinks[1] ?? "")}}`,
    `{${renderHeaderValue(secondaryLinks[2] ?? "")}}`
  ]
    .filter(Boolean)
    .join("\n");
}

function renderSummary(resume: ResumeData, options: RenderOptions) {
  const summary = getSummaryText(resume);
  return sectionBlock(getTemplateSectionTitle("summary", options, resume), summary ? escapeTex(summary) : "");
}

function renderEducation(resume: ResumeData, options: RenderOptions) {
  const entries = resume.education
    .map((item) => {
      const title = [item.degree?.trim(), item.field?.trim()].filter((value): value is string => Boolean(value)).join(" in ");
      const subtitle = item.result?.trim() || item.level;
      const institution = [item.institution?.trim(), item.boardOrUniversity?.trim()].filter((value): value is string => Boolean(value)).join(" | ");
      const date = formatDateField(item.date);
      const notes = [item.location?.trim()].filter((value): value is string => Boolean(value));

      return [
        `\\begin{subsectionnobullet}{${escapeTex(title || "Education")}}{${escapeTex(subtitle)}}{${escapeTex(institution)}}{${escapeTex(date)}}`,
        ...notes.map((note) => `\\italicitem{${escapeTex(note)}}`),
        "\\end{subsectionnobullet}"
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean);

  return sectionBlock(getTemplateSectionTitle("education", options, resume), entries.join("\n\n"));
}

function renderListSubsection(title: string, subtitle: string, date: string, location: string, lines: string[], withBullets = true) {
  const environmentName = withBullets ? "subsection" : "subsectionnobullet";
  const bodyLines = withBullets ? lines.map((line) => `\\item ${escapeTex(line)}`) : lines.map((line) => `\\italicitem{${escapeTex(line)}}`);

  return [
    `\\begin{${environmentName}}{${escapeTex(title)}}{${escapeTex(subtitle)}}{${escapeTex(date)}}{${location || "\\mbox{}"}}`,
    ...bodyLines,
    `\\end{${environmentName}}`
  ]
    .filter(Boolean)
    .join("\n");
}

function renderExperience(resume: ResumeData, options: RenderOptions) {
  const entries = resume.experience
    .map((item) => {
      const title = item.company?.trim() || item.role?.trim() || "Experience";
      const subtitle = item.role?.trim() || "";
      const date = formatDateField(item.date);
      const location = escapeTex(item.location?.trim() || "");
      const lines = getDescriptionLines(item.description, options);

      return renderListSubsection(title, subtitle, date, location, lines, true);
    })
    .filter(Boolean);

  return sectionBlock(getTemplateSectionTitle("experience", options, resume), entries.join("\n\n"));
}

function renderProjects(resume: ResumeData, options: RenderOptions) {
  const entries = resume.projects
    .map((item) => {
      const links = [renderLink(item.githubLink), renderLink(item.liveLink)].filter(Boolean).join(" \\quad ");
      const subtitle = [item.technologies.join(", "), links].filter(Boolean).join(" | ");
      const date = formatDateField(item.date);
      const lines = getDescriptionLines(item.description, options);

      return renderListSubsection(item.title?.trim() || "Project", subtitle, date, "", lines, true);
    })
    .filter(Boolean);

  return sectionBlock(getTemplateSectionTitle("projects", options, resume), entries.join("\n\n"));
}

function renderEntryTable(title: string, rows: Array<{ label: string; value: string }>) {
  if (rows.length === 0) {
    return "";
  }

  return [
    `\\sectiontable{${escapeTex(title)}}{`,
    ...rows.map((row) => `\\entry{${escapeTex(row.label)}}{${row.value}}`),
    "}"
  ].join("\n");
}

function renderSkills(resume: ResumeData, options: RenderOptions) {
  const rows =
    resume.skills.mode === "grouped"
      ? resume.skills.groups
          .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
          .map((group) => ({ label: group.groupLabel?.trim() || "Skills", value: escapeTex(group.items.join(", ")) }))
      : resume.skills.items.length > 0
        ? [{ label: getTemplateSectionTitle("skills", options, resume), value: escapeTex(resume.skills.items.join(", ")) }]
        : [];

  return renderEntryTable(getTemplateSectionTitle("skills", options, resume), rows);
}

function renderCertifications(resume: ResumeData, options: RenderOptions) {
  const rows = resume.certifications
    .map((item) => {
      const value = [item.issuer?.trim(), item.description?.trim(), formatDateField(item.date), renderLink(item.link)]
        .filter((part): part is string => Boolean(part))
        .map((part) => (part.startsWith("\\href") ? part : escapeTex(part)))
        .join(" \\hfill ");

      return {
        label: item.title?.trim() || "Certification",
        value
      };
    })
    .filter((row) => row.value || row.label);

  return renderEntryTable(getTemplateSectionTitle("certifications", options, resume), rows);
}

function renderCustomSection(sectionKey: ResumeSectionKey, section: CustomEntriesSection, options: RenderOptions, resume: ResumeData) {
  const entries = section.entries
    .map((entry) => {
      const title = entry.title?.trim() || section.label;
      const subtitle = [entry.subtitle?.trim(), renderLink(entry.link)].filter((value): value is string => Boolean(value)).join(" | ");
      const date = formatDateField(entry.date);
      const location = escapeTex(entry.location?.trim() || "");
      const lines = getDescriptionLines(entry.description, options);
      const paragraph = getDescriptionParagraph(entry.description, options);

      return renderListSubsection(title, subtitle, date, location, lines.length > 0 ? lines : paragraph ? [paragraph] : [], lines.length > 0);
    })
    .filter(Boolean);

  return sectionBlock(getTemplateSectionTitle(sectionKey, options, resume), entries.join("\n\n"));
}

function renderLanguages(resume: ResumeData, options: RenderOptions) {
  const rows =
    resume.languages.mode === "grouped"
      ? resume.languages.groups
          .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
          .map((group) => ({ label: group.groupLabel?.trim() || "Languages", value: escapeTex(group.items.join(", ")) }))
      : resume.languages.items
          .map((item) => ({
            label: item.language?.trim() || "Language",
            value: escapeTex(item.proficiency?.trim() || "")
          }))
          .filter((row) => row.label);

  return renderEntryTable(getTemplateSectionTitle("languages", options, resume), rows);
}

function renderHobbies(resume: ResumeData, options: RenderOptions) {
  const rows =
    resume.hobbies.mode === "grouped"
      ? resume.hobbies.groups
          .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
          .map((group) => ({ label: group.groupLabel?.trim() || "Interests", value: escapeTex(group.items.join(", ")) }))
      : resume.hobbies.items.map((item) => ({ label: item, value: "" }));

  return renderEntryTable(getTemplateSectionTitle("hobbies", options, resume), rows);
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

function buildPreamble() {
  return [
    "% Template: template4",
    "\\documentclass[]{kyvernitis-resume}"
  ].join("\n");
}

export function renderTemplate4ToTex(resume: ResumeData, options: RenderOptions) {
  const orderedSections = options.sectionOrder
    .map((section) => renderSection(section, resume, options))
    .filter(Boolean)
    .join("\n\n");

  return [
    buildPreamble(),
    renderHeader(resume),
    orderedSections,
    "\\end{document}"
  ]
    .filter(Boolean)
    .join("\n\n");
}

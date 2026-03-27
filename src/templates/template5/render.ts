import {
  type CustomEntriesSection,
  type RenderOptions,
  type ResumeData,
  type ResumeSectionKey
} from "../../types/resume";
import { formatDateField, getLinkUrl, getSummaryText } from "../../lib/resume";
import { escapeHref, escapeTex, getDescriptionLines, getDescriptionParagraph, getTemplateSectionTitle } from "../render-utils";

function splitDisplayName(name?: string | null) {
  const parts = (name?.trim() ?? "").split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "Your", lastName: "Name" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "Name" };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1]
  };
}

function stripUrlPrefix(value: string, domainPattern?: RegExp) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (domainPattern) {
    return trimmed.replace(domainPattern, "").replace(/\/+$/, "");
  }

  return trimmed.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function renderCvItems(lines: string[]) {
  if (lines.length === 0) {
    return "{}";
  }

  return [
    "{",
    "\\begin{cvitems}",
    ...lines.map((line) => `\\item {${escapeTex(line)}}`),
    "\\end{cvitems}",
    "}"
  ].join("\n");
}

function renderSectionBlock(title: string, content: string) {
  if (!content.trim()) {
    return "";
  }

  return [`\\cvsection{${escapeTex(title)}}`, content].join("\n\n");
}

function renderSummary(resume: ResumeData, options: RenderOptions) {
  const summary = getSummaryText(resume);

  return renderSectionBlock(
    getTemplateSectionTitle("summary", options, resume),
    summary
      ? ["\\begin{cvparagraph}", escapeTex(summary), "\\end{cvparagraph}"].join("\n")
      : ""
  );
}

function renderEducation(resume: ResumeData, options: RenderOptions) {
  const entries = resume.education
    .map((item) => {
      const degree = [item.degree?.trim(), item.field?.trim()].filter((value): value is string => Boolean(value)).join(" in ");
      const institution = item.institution?.trim() || item.boardOrUniversity?.trim() || "";
      const location = item.location?.trim() || "";
      const date = formatDateField(item.date);
      const bullets = [item.result?.trim(), item.boardOrUniversity?.trim() && item.boardOrUniversity !== institution ? item.boardOrUniversity : ""]
        .filter((value): value is string => Boolean(value));

      return [
        "\\cventry",
        `  {${escapeTex(degree || item.level)}}`,
        `  {${escapeTex(institution)}}`,
        `  {${escapeTex(location)}}`,
        `  {${escapeTex(date)}}`,
        `  ${renderCvItems(bullets)}`
      ].join("\n");
    })
    .filter(Boolean);

  return renderSectionBlock(
    getTemplateSectionTitle("education", options, resume),
    entries.length > 0 ? ["\\begin{cventries}", ...entries, "\\end{cventries}"].join("\n\n") : ""
  );
}

function renderExperience(resume: ResumeData, options: RenderOptions) {
  const entries = resume.experience
    .map((item) => {
      const bullets = getDescriptionLines(item.description, options);

      return [
        "\\cventry",
        `  {${escapeTex(item.role?.trim() || "")}}`,
        `  {${escapeTex(item.company?.trim() || "Experience")}}`,
        `  {${escapeTex(item.location?.trim() || "")}}`,
        `  {${escapeTex(formatDateField(item.date))}}`,
        `  ${renderCvItems(bullets)}`
      ].join("\n");
    })
    .filter(Boolean);

  return renderSectionBlock(
    getTemplateSectionTitle("experience", options, resume),
    entries.length > 0 ? ["\\begin{cventries}", ...entries, "\\end{cventries}"].join("\n\n") : ""
  );
}

function renderProjects(resume: ResumeData, options: RenderOptions) {
  const entries = resume.projects
    .map((item) => {
      const bullets = getDescriptionLines(item.description, options);
      const linkText = [getLinkUrl(item.githubLink), getLinkUrl(item.liveLink)]
        .filter(Boolean)
        .map((url) => `\\href{${escapeHref(url)}}{${escapeTex(stripUrlPrefix(url))}}`)
        .join(" \\quad ");

      return [
        "\\cventry",
        `  {${escapeTex(item.technologies.join(", "))}}`,
        `  {${escapeTex(item.title?.trim() || "Project")}}`,
        `  {${linkText || escapeTex("")}}`,
        `  {${escapeTex(formatDateField(item.date))}}`,
        `  ${renderCvItems(bullets)}`
      ].join("\n");
    })
    .filter(Boolean);

  return renderSectionBlock(
    getTemplateSectionTitle("projects", options, resume),
    entries.length > 0 ? ["\\begin{cventries}", ...entries, "\\end{cventries}"].join("\n\n") : ""
  );
}

function renderSkillsLikeSection(sectionTitle: string, rows: Array<{ label: string; value: string }>) {
  if (rows.length === 0) {
    return "";
  }

  return renderSectionBlock(
    sectionTitle,
    ["\\begin{cvskills}", ...rows.map((row) => `  \\cvskill\n    {${escapeTex(row.label)}}\n    {${row.value}}`), "\\end{cvskills}"].join("\n\n")
  );
}

function renderSkills(resume: ResumeData, options: RenderOptions) {
  const rows =
    resume.skills.mode === "grouped"
      ? resume.skills.groups
          .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
          .map((group) => ({ label: group.groupLabel?.trim() || "Skills", value: escapeTex(group.items.join(", ")) }))
      : resume.skills.items.length > 0
        ? [{ label: "Core Skills", value: escapeTex(resume.skills.items.join(", ")) }]
        : [];

  return renderSkillsLikeSection(getTemplateSectionTitle("skills", options, resume), rows);
}

function renderCertifications(resume: ResumeData, options: RenderOptions) {
  const rows = resume.certifications
    .map((item) => ({
      date: formatDateField(item.date),
      label: item.title?.trim() || "Certification",
      location: item.issuer?.trim() || "",
      value: item.description?.trim() || getLinkUrl(item.link) || ""
    }))
    .filter((row) => row.label || row.value || row.location || row.date);

  if (rows.length === 0) {
    return "";
  }

  return renderSectionBlock(
    getTemplateSectionTitle("certifications", options, resume),
    ["\\begin{cvhonors}", ...rows.map((row) => `  \\cvhonor\n    {${escapeTex(row.value)}}\n    {${escapeTex(row.label)}}\n    {${escapeTex(row.location)}}\n    {${escapeTex(row.date)}}`), "\\end{cvhonors}"].join("\n\n")
  );
}

function renderCustomEntries(sectionKey: ResumeSectionKey, section: CustomEntriesSection, options: RenderOptions, resume: ResumeData) {
  const entries = section.entries
    .map((entry) => {
      const bullets = getDescriptionLines(entry.description, options);
      const paragraph = getDescriptionParagraph(entry.description, options);
      const detailLines = bullets.length > 0 ? bullets : paragraph ? [paragraph] : [];
      const link = getLinkUrl(entry.link);
      const location = [entry.location?.trim(), link ? stripUrlPrefix(link) : ""].filter(Boolean).join(" | ");

      return [
        "\\cventry",
        `  {${escapeTex(entry.subtitle?.trim() || "")}}`,
        `  {${escapeTex(entry.title?.trim() || section.label)}}`,
        `  {${escapeTex(location)}}`,
        `  {${escapeTex(formatDateField(entry.date))}}`,
        `  ${renderCvItems(detailLines)}`
      ].join("\n");
    })
    .filter(Boolean);

  return renderSectionBlock(
    getTemplateSectionTitle(sectionKey, options, resume),
    entries.length > 0 ? ["\\begin{cventries}", ...entries, "\\end{cventries}"].join("\n\n") : ""
  );
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

  return renderSkillsLikeSection(getTemplateSectionTitle("languages", options, resume), rows);
}

function renderHobbies(resume: ResumeData, options: RenderOptions) {
  const rows =
    resume.hobbies.mode === "grouped"
      ? resume.hobbies.groups
          .filter((group) => group.groupLabel?.trim() || group.items.length > 0)
          .map((group) => ({ label: group.groupLabel?.trim() || "Interests", value: escapeTex(group.items.join(", ")) }))
      : resume.hobbies.items.map((item) => ({
          label: item,
          value: ""
        }));

  return renderSkillsLikeSection(getTemplateSectionTitle("hobbies", options, resume), rows);
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
      return renderCustomEntries("leadership", resume.leadership, options, resume);
    case "achievements":
      return renderCustomEntries("achievements", resume.achievements, options, resume);
    case "competitions":
      return renderCustomEntries("competitions", resume.competitions, options, resume);
    case "extracurricular":
      return renderCustomEntries("extracurricular", resume.extracurricular, options, resume);
    case "publications":
      return renderCustomEntries("publications", resume.publications, options, resume);
    case "openSource":
      return renderCustomEntries("openSource", resume.openSource, options, resume);
    case "languages":
      return renderLanguages(resume, options);
    case "hobbies":
      return renderHobbies(resume, options);
    default:
      return "";
  }
}

function buildPreamble(resume: ResumeData) {
  const { firstName, lastName } = splitDisplayName(resume.header.name);
  const homepage = stripUrlPrefix(getLinkUrl(resume.header.website));
  const github = stripUrlPrefix(getLinkUrl(resume.header.github), /^https?:\/\/(www\.)?github\.com\//i);
  const linkedin = stripUrlPrefix(getLinkUrl(resume.header.linkedin), /^https?:\/\/(www\.)?linkedin\.com\/in\//i);

  return [
    "% Template: template5",
    "\\documentclass[11pt, a4paper]{russell}",
    "\\geometry{left=1.4cm, top=.8cm, right=1.4cm, bottom=1.8cm, footskip=.5cm}",
    "\\fontdir[font/]",
    "\\colorlet{russell}{russell-black}",
    "\\setbool{acvSectionColorHighlight}{true}",
    "\\renewcommand{\\acvHeaderSocialSep}{\\quad\\textbar\\quad}",
    `\\name{${escapeTex(firstName)}}{${escapeTex(lastName)}}`,
    resume.header.role?.trim() ? `\\position{${escapeTex(resume.header.role.trim())}}` : "",
    resume.header.address?.trim() ? `\\address{${escapeTex(resume.header.address.trim())}}` : "",
    resume.header.phone?.trim() ? `\\mobile{${escapeTex(resume.header.phone.trim())}}` : "",
    resume.header.email?.trim() ? `\\email{${escapeTex(resume.header.email.trim())}}` : "",
    homepage ? `\\homepage{${escapeTex(homepage)}}` : "",
    github ? `\\github{${escapeTex(github)}}` : "",
    linkedin ? `\\linkedin{${escapeTex(linkedin)}}` : "",
    "\\begin{document}",
    "\\makecvheader",
    "\\makecvfooter{\\today}{}{\\thepage}"
  ]
    .filter(Boolean)
    .join("\n");
}

export function renderTemplate5ToTex(resume: ResumeData, options: RenderOptions) {
  const orderedSections = options.sectionOrder
    .map((section) => renderSection(section, resume, options))
    .filter(Boolean)
    .join("\n\n");

  return [
    buildPreamble(resume),
    orderedSections,
    "\\vspace*{\\fill}",
    "\\centering{\\textbf{References available upon request.}}",
    "\\end{document}"
  ]
    .filter(Boolean)
    .join("\n\n");
}

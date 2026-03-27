import {
  RESUME_SECTION_LABELS,
  type DescriptionField,
  type LinkField,
  type RenderOptions,
  type ResumeData,
  type ResumeSectionKey
} from "../types/resume";
import { getLinkLabel, getLinkUrl, getProfileLabel, splitLineItems } from "../lib/resume";

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

export function escapeTex(value: string) {
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

export function escapeHref(value: string) {
  return normalizeTexText(value).replace(/\\/g, "/").replace(/ /g, "%20");
}

export function renderLink(link?: LinkField | null, underline = false) {
  if (!link) {
    return "";
  }

  const url = getLinkUrl(link);

  if (!url) {
    return "";
  }

  const label = getLinkLabel(link) || url;
  const safeLabel = underline ? `\\underline{${escapeTex(label)}}` : escapeTex(label);

  return `\\href{${escapeHref(url)}}{${safeLabel}}`;
}

export function getTemplateSectionTitle(section: ResumeSectionKey, options: RenderOptions, resume: ResumeData) {
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

export function getDescriptionLines(description: DescriptionField, options: RenderOptions) {
  if (description.mode === "paragraph") {
    return splitLineItems(description.paragraph ?? "");
  }

  return description.bullets
    .slice(0, options.maxBulletsPerEntry)
    .map((bullet) => bullet.trim())
    .filter(Boolean);
}

export function getDescriptionParagraph(description: DescriptionField, options: RenderOptions) {
  return getDescriptionLines(description, options).join(" ");
}

import { analyzeResumeForAts } from "../../src/lib/analysis";
import {
  flattenDescriptionLines,
  flattenSkills,
  formatDateField,
  getLinkLabel,
  getResumeContactLines,
  getSummaryText
} from "../../src/lib/resume";
import type { AtsAnalysisResult, JdAnalysisResult, KeywordBreakdown } from "../../src/types/analysis";
import type { ResumeImportMeta, ResumeImportResult, ResumeImportSummary } from "../../src/types/import";
import { MONTH_OPTIONS, createEmptyResumeData, type CustomEntriesSection, type DateField, type DescriptionField, type RenderOptions, type ResumeData, type ResumeSectionKey } from "../../src/types/resume";
import { atsCoachingSchema, type AiResumeParse, aiResumeParseSchema, jdParseSchema } from "./ai-schemas";
import { buildResumeParsePrompt } from "./ai-resume-prompts";
import { extractJsonObject, generateJsonText, generateStructuredObject, getAiServiceHealth } from "./ai-client";
import { createCacheKey, readJsonCache, writeJsonCache } from "./cache";

export class AiResumeParsingUnavailableError extends Error {
  constructor() {
    super("AI resume parsing is not configured. Add GROQ_API_KEY before importing resumes.");
    this.name = "AiResumeParsingUnavailableError";
  }
}

function countSkills(resume: ResumeData) {
  return flattenSkills(resume.skills).length;
}

function hasContent(resume: ResumeData) {
  return Boolean(
    resume.header.name?.trim() ||
      getSummaryText(resume) ||
      resume.experience.length ||
      resume.education.length ||
      resume.projects.length ||
      countSkills(resume)
  );
}

function cleanText(value?: string | null) {
  return value?.trim() ? value.trim() : "";
}

function normalizeUrl(value?: string | null) {
  const trimmed = cleanText(value);

  if (!trimmed) {
    return "";
  }

  if (/^(?:https?:\/\/|mailto:)/i.test(trimmed)) {
    return trimmed;
  }

  if (/^(?:www\.|[A-Za-z0-9.-]+\.[A-Za-z]{2,})(?:\/|$)/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

function dedupeList(values: string[]) {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = value.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function hasMeaningfulValue(values: Array<string | undefined | null | boolean>) {
  return values.some((value) => (typeof value === "string" ? Boolean(value.trim()) : Boolean(value)));
}

function createResumeSummary(resume: ResumeData): ResumeImportSummary {
  const detectedSections: ResumeSectionKey[] = [];

  if (getSummaryText(resume)) {
    detectedSections.push("summary");
  }

  if (countSkills(resume) > 0) {
    detectedSections.push("skills");
  }

  if (resume.education.length > 0) {
    detectedSections.push("education");
  }

  if (resume.experience.length > 0) {
    detectedSections.push("experience");
  }

  if (resume.projects.length > 0) {
    detectedSections.push("projects");
  }

  if (resume.certifications.length > 0) {
    detectedSections.push("certifications");
  }

  if (resume.leadership.entries.length > 0) {
    detectedSections.push("leadership");
  }

  if (resume.achievements.entries.length > 0) {
    detectedSections.push("achievements");
  }

  if (resume.competitions.entries.length > 0) {
    detectedSections.push("competitions");
  }

  if (resume.extracurricular.entries.length > 0) {
    detectedSections.push("extracurricular");
  }

  if (resume.publications.entries.length > 0) {
    detectedSections.push("publications");
  }

  if (resume.openSource.entries.length > 0) {
    detectedSections.push("openSource");
  }

  if (resume.languages.items.length > 0 || resume.languages.groups.length > 0) {
    detectedSections.push("languages");
  }

  if (resume.hobbies.items.length > 0 || resume.hobbies.groups.length > 0) {
    detectedSections.push("hobbies");
  }

  return {
    detectedSections,
    educationCount: resume.education.length,
    experienceCount: resume.experience.length,
    projectCount: resume.projects.length,
    skillCount: countSkills(resume)
  };
}

function dedupeWarnings(warnings: string[]) {
  return Array.from(new Set(warnings.map((warning) => warning.trim()).filter(Boolean)));
}

function normalizeSkills(skills: AiResumeParse["skills"]): ResumeData["skills"] {
  return {
    groups: skills.groups
      .map((group) => ({
        groupLabel: cleanText(group.groupLabel),
        items: dedupeList(group.items.map((skill) => skill.trim()).filter(Boolean))
      }))
      .filter((group) => Boolean(group.groupLabel || group.items.length)),
    items: dedupeList(skills.items.map((skill) => skill.trim()).filter(Boolean)),
    mode: skills.mode
  };
}

function normalizeLinkField(link: AiResumeParse["header"]["github"]): ResumeData["header"]["github"] {
  return {
    displayMode: link.displayMode,
    displayText: cleanText(link.displayText),
    url: normalizeUrl(link.url)
  };
}

function normalizeDateField(date: AiResumeParse["experience"][number]["date"]): DateField {
  return {
    endMonth: MONTH_OPTIONS.includes(date.endMonth as (typeof MONTH_OPTIONS)[number]) ? (date.endMonth as (typeof MONTH_OPTIONS)[number]) : "",
    endYear: cleanText(date.endYear),
    isOngoing: Boolean(date.isOngoing),
    mode: date.mode,
    startMonth: MONTH_OPTIONS.includes(date.startMonth as (typeof MONTH_OPTIONS)[number]) ? (date.startMonth as (typeof MONTH_OPTIONS)[number]) : "",
    startYear: cleanText(date.startYear)
  };
}

function normalizeDescriptionField(description: AiResumeParse["experience"][number]["description"]): DescriptionField {
  return {
    bullets: description.bullets.map((bullet) => bullet.trim()).filter(Boolean),
    mode: description.mode,
    paragraph: cleanText(description.paragraph)
  };
}

function normalizeCertificationItems(items: AiResumeParse["certifications"]): ResumeData["certifications"] {
  return items
    .map((item): ResumeData["certifications"][number] => ({
      date: normalizeDateField(item.date),
      description: cleanText(item.description),
      issuer: cleanText(item.issuer),
      link: normalizeLinkField(item.link),
      title: cleanText(item.title)
    }))
    .filter((item) => hasMeaningfulValue([item.title, item.issuer, item.description, item.link.url]));
}

function normalizeCustomSection(section: AiResumeParse["leadership"], fallbackLabel: string): CustomEntriesSection {
  return {
    entries: section.entries
      .map((entry): CustomEntriesSection["entries"][number] => ({
        date: normalizeDateField(entry.date),
        description: normalizeDescriptionField(entry.description),
        link: normalizeLinkField(entry.link),
        location: cleanText(entry.location),
        subtitle: cleanText(entry.subtitle),
        title: cleanText(entry.title)
      }))
      .filter((entry) =>
        hasMeaningfulValue([
          entry.title,
          entry.subtitle,
          entry.location,
          entry.description.paragraph,
          entry.description.bullets.length > 0,
          entry.link.url,
          entry.date.startYear,
          entry.date.endYear
        ])
      ),
    label: cleanText(section.label) || fallbackLabel
  };
}

function buildImportWarnings(resume: ResumeData) {
  const warnings: string[] = [];

  if (!resume.header.name?.trim()) {
    warnings.push("The parser could not confidently detect the candidate name. Review the header details.");
  }

  if (!resume.header.email?.trim() && !resume.header.phone?.trim()) {
    warnings.push("Contact details look incomplete. Review the header section before exporting.");
  }

  if (countSkills(resume) === 0) {
    warnings.push("No skills were extracted. Check whether the source resume contains a readable skills section.");
  }

  if (!resume.experience.length && !resume.education.length && !resume.projects.length) {
    warnings.push("Only limited structured sections were detected. Review the imported content carefully.");
  }

  if (!hasContent(resume)) {
    warnings.push("No structured resume content could be extracted from the supplied text.");
  }

  return dedupeWarnings(warnings);
}

function getImportConfidence(summary: ResumeImportSummary, warnings: string[]): ResumeImportMeta["confidence"] {
  if (summary.detectedSections.length >= 4 && warnings.length <= 1) {
    return "high";
  }

  if (summary.detectedSections.length >= 2) {
    return "medium";
  }

  return "low";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [value];
}

function toText(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return "";
}

function toNullableText(value: unknown) {
  const text = toText(value);
  return text || null;
}

function normalizedToken(value: unknown) {
  return toText(value).toLowerCase().replace(/[\s_]+/g, "-");
}

function pickValue(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) {
    return undefined;
  }
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function pickMode<T extends string>(value: unknown, allowed: readonly T[], fallback: T, aliases?: Record<string, T>) {
  const token = normalizedToken(value);
  if (aliases?.[token]) {
    return aliases[token];
  }
  const direct = allowed.find((item) => item === token);
  return direct ?? fallback;
}

function extractYears(value: unknown) {
  return toText(value).match(/(?:19|20)\d{2}/g) ?? [];
}

type AiDateField = AiResumeParse["experience"][number]["date"];
type AiLinkField = AiResumeParse["header"]["github"];
type AiDescriptionField = AiResumeParse["experience"][number]["description"];
type AiCustomSection = AiResumeParse["leadership"];
type AiCustomEntry = AiResumeParse["leadership"]["entries"][number];
type AiSkillGroup = AiResumeParse["skills"]["groups"][number];
type AiSkillsSection = AiResumeParse["skills"];
type AiLanguagesSection = AiResumeParse["languages"];
type AiHobbiesSection = AiResumeParse["hobbies"];

function coerceDateField(value: unknown, fallbackMode: AiDateField["mode"] = "mm-yyyy-range"): AiDateField {
  const record = asRecord(value);
  const fromStringYears = extractYears(value);
  const startDate = pickValue(record, ["startDate", "from"]);
  const endDate = pickValue(record, ["endDate", "to"]);
  const startYears = extractYears(startDate);
  const endYears = extractYears(endDate);
  const mergedYears = [...startYears, ...endYears, ...fromStringYears];
  const startYear = toNullableText(pickValue(record, ["startYear", "fromYear"])) ?? mergedYears[0] ?? null;
  const endYear = toNullableText(pickValue(record, ["endYear", "toYear"])) ?? mergedYears[1] ?? null;
  const currentToken = normalizedToken(pickValue(record, ["isOngoing", "current", "isCurrent"]));
  const stringToken = normalizedToken(value);
  const isOngoing =
    currentToken === "true" ||
    currentToken === "1" ||
    stringToken.includes("present") ||
    stringToken.includes("ongoing") ||
    normalizedToken(endDate).includes("present");
  const mode = pickMode(
    pickValue(record, ["mode"]),
    ["mm-yyyy", "yyyy", "mm-yyyy-range", "yyyy-range", "mm-yyyy-present", "yyyy-present"] as const,
    isOngoing ? "yyyy-present" : endYear ? "yyyy-range" : "yyyy"
  );

  return {
    endMonth: null,
    endYear,
    isOngoing,
    mode: mode || fallbackMode,
    startMonth: null,
    startYear
  };
}

function coerceLinkField(value: unknown): AiLinkField {
  const record = asRecord(value);
  const url = toNullableText(pickValue(record, ["url", "link", "href", "value"])) ?? toNullableText(value);
  const displayText = toNullableText(pickValue(record, ["displayText", "label", "text"]));
  const displayMode = pickMode(
    pickValue(record, ["displayMode"]),
    ["plain-url", "hyperlinked-text"] as const,
    "plain-url",
    { hyperlink: "hyperlinked-text", "hyperlinked": "hyperlinked-text", plain: "plain-url" }
  );

  return {
    displayMode,
    displayText,
    url
  };
}

function splitLines(value: unknown) {
  return toText(value)
    .split(/\r?\n|;/)
    .map((item) => item.replace(/^[•\-*]\s*/, "").trim())
    .filter(Boolean);
}

function coerceDescriptionField(value: unknown): AiDescriptionField {
  const record = asRecord(value);
  const rawBullets = pickValue(record, ["bullets", "items", "points"]);
  const bullets =
    Array.isArray(rawBullets) ? rawBullets.map((item) => toText(item)).filter(Boolean) : splitLines(rawBullets);
  const paragraph = toNullableText(pickValue(record, ["paragraph", "text", "summary", "description"])) ?? toNullableText(value);
  const mode = pickMode(
    pickValue(record, ["mode"]),
    ["bullets", "paragraph"] as const,
    bullets.length > 0 && !paragraph ? "bullets" : "paragraph"
  );

  return {
    bullets,
    mode,
    paragraph
  };
}

function coerceSkillGroup(value: unknown): AiSkillGroup {
  const record = asRecord(value);
  const label = toNullableText(pickValue(record, ["groupLabel", "category", "label", "title"]));
  const rawItems = pickValue(record, ["items", "skills", "list", "values"]);
  const items = Array.isArray(rawItems)
    ? rawItems.map((item) => toText(item)).filter(Boolean)
    : splitLines(rawItems || value);

  return {
    groupLabel: label,
    items
  };
}

function coerceSkillsSection(value: unknown): AiSkillsSection {
  const record = asRecord(value);

  if (Array.isArray(value)) {
    const stringItems = value.map((item) => toText(item)).filter(Boolean);
    return { groups: [], items: stringItems, mode: "csv" };
  }

  const items = toArray(pickValue(record, ["items"]))
    .map((item) => toText(item))
    .filter(Boolean);
  const groups = toArray(pickValue(record, ["groups", "categories", "grouped"])).map(coerceSkillGroup).filter((group) => group.items.length > 0 || group.groupLabel);

  if (items.length === 0 && groups.length === 0 && record) {
    const inferredGroups = Object.entries(record)
      .filter(([key]) => !["mode", "items", "groups", "categories", "grouped"].includes(key))
      .map(([key, itemValue]) => coerceSkillGroup({ groupLabel: key, items: toArray(itemValue) }))
      .filter((group) => group.items.length > 0);
    if (inferredGroups.length > 0) {
      return { groups: inferredGroups, items: [], mode: "grouped" };
    }
  }

  const mode = pickMode(pickValue(record, ["mode"]), ["csv", "grouped"] as const, groups.length > 0 ? "grouped" : "csv");
  return { groups, items, mode };
}

function coerceCustomEntry(value: unknown): AiCustomEntry {
  const record = asRecord(value);

  return {
    date: coerceDateField(
      pickValue(record, ["date", "duration"]) ?? {
        current: pickValue(record, ["current", "isCurrent", "isOngoing"]),
        endDate: pickValue(record, ["endDate", "to"]),
        endYear: pickValue(record, ["endYear"]),
        startDate: pickValue(record, ["startDate", "from"]),
        startYear: pickValue(record, ["startYear"])
      }
    ),
    description: coerceDescriptionField(pickValue(record, ["description", "details", "summary", "bullets"]) ?? value),
    link: coerceLinkField(pickValue(record, ["link", "url", "href"])),
    location: toNullableText(pickValue(record, ["location", "place"])),
    subtitle: toNullableText(pickValue(record, ["subtitle", "organization", "org", "company"])),
    title: toNullableText(pickValue(record, ["title", "name", "role"]))
  };
}

function coerceCustomSection(value: unknown, fallbackLabel: string): AiCustomSection {
  const record = asRecord(value);
  const entries = toArray(pickValue(record, ["entries", "items", "list"]) ?? value).map(coerceCustomEntry);

  return {
    entries,
    label: toNullableText(pickValue(record, ["label", "title"])) ?? fallbackLabel
  };
}

function coerceEducationLevel(value: unknown): AiResumeParse["education"][number]["level"] {
  return pickMode(
    value,
    ["degree-diploma", "class-12", "class-10", "other"] as const,
    "degree-diploma",
    {
      "12th": "class-12",
      "class12": "class-12",
      intermediate: "class-12",
      "10th": "class-10",
      "class10": "class-10",
      matriculation: "class-10",
      degree: "degree-diploma",
      diploma: "degree-diploma"
    }
  );
}

function coerceResultType(value: unknown, fallbackFromResult?: unknown): AiResumeParse["education"][number]["resultType"] {
  const direct = pickMode(
    value,
    ["cgpa-10", "gpa-4", "percentage", "grade", "not-disclosed"] as const,
    "not-disclosed",
    {
      cgpa: "cgpa-10",
      gpa: "gpa-4",
      percent: "percentage",
      "notdisclosed": "not-disclosed",
      na: "not-disclosed"
    }
  );
  if (value !== undefined && value !== null && toText(value)) {
    return direct;
  }
  const resultText = normalizedToken(fallbackFromResult);
  if (resultText.includes("%") || resultText.includes("percent")) {
    return "percentage";
  }
  if (resultText.includes("cgpa")) {
    return "cgpa-10";
  }
  if (resultText.includes("gpa")) {
    return "gpa-4";
  }
  if (resultText.includes("grade")) {
    return "grade";
  }
  return null;
}

function coerceResumePayloadShape(value: unknown): AiResumeParse {
  const root = asRecord(value);
  const headerSource = asRecord(pickValue(root, ["header", "personalDetails", "personal"]));

  const education = toArray(pickValue(root, ["education", "academics"])).map((item) => {
    const record = asRecord(item);
    const result = pickValue(record, ["result", "gpa", "cgpa", "percentage", "grade"]);
    return {
      boardOrUniversity: toNullableText(pickValue(record, ["boardOrUniversity", "board", "university"])),
      date: coerceDateField(
        pickValue(record, ["date", "duration"]) ?? {
          endDate: pickValue(record, ["endDate"]),
          endYear: pickValue(record, ["endYear"]),
          startDate: pickValue(record, ["startDate"]),
          startYear: pickValue(record, ["startYear"])
        },
        "yyyy-range"
      ),
      degree: toNullableText(pickValue(record, ["degree", "qualification"]) ?? item),
      field: toNullableText(pickValue(record, ["field", "stream", "specialization"])),
      institution: toNullableText(pickValue(record, ["institution", "school", "college"])),
      level: coerceEducationLevel(pickValue(record, ["level", "type"])),
      location: toNullableText(pickValue(record, ["location"])),
      result: toNullableText(result),
      resultType: coerceResultType(pickValue(record, ["resultType"]), result)
    };
  });

  const experience = toArray(pickValue(root, ["experience", "internships", "workExperience"])).map((item) => {
    const record = asRecord(item);
    return {
      company: toNullableText(pickValue(record, ["company", "organization"])),
      date: coerceDateField(
        pickValue(record, ["date", "duration"]) ?? {
          current: pickValue(record, ["current", "isCurrent"]),
          endDate: pickValue(record, ["endDate"]),
          endYear: pickValue(record, ["endYear"]),
          startDate: pickValue(record, ["startDate"]),
          startYear: pickValue(record, ["startYear"])
        }
      ),
      description: coerceDescriptionField(pickValue(record, ["description", "details", "bullets"]) ?? item),
      isCurrent: Boolean(pickValue(record, ["isCurrent", "current", "isOngoing"])),
      location: toNullableText(pickValue(record, ["location"])),
      role: toNullableText(pickValue(record, ["role", "title", "position"]))
    };
  });

  const projects = toArray(pickValue(root, ["projects", "project"])).map((item) => {
    const record = asRecord(item);
    return {
      date: coerceDateField(
        pickValue(record, ["date", "duration"]) ?? {
          endDate: pickValue(record, ["endDate"]),
          endYear: pickValue(record, ["endYear"]),
          startDate: pickValue(record, ["startDate"]),
          startYear: pickValue(record, ["startYear"])
        }
      ),
      description: coerceDescriptionField(pickValue(record, ["description", "details", "bullets"]) ?? item),
      githubLink: coerceLinkField(pickValue(record, ["githubLink", "github", "repo", "repository"])),
      liveLink: coerceLinkField(pickValue(record, ["liveLink", "live", "demo", "url", "link"])),
      technologies: toArray(pickValue(record, ["technologies", "tech", "stack"]))
        .flatMap((entry) => splitLines(entry))
        .filter(Boolean),
      title: toNullableText(pickValue(record, ["title", "name"]) ?? item)
    };
  });

  const certifications = toArray(pickValue(root, ["certifications", "certification"])).map((item) => {
    const record = asRecord(item);
    const title = toNullableText(pickValue(record, ["title", "name"]) ?? item);
    return {
      date: coerceDateField(
        pickValue(record, ["date", "issuedOn", "issueDate"]) ?? {
          startYear: pickValue(record, ["year"]),
          startDate: pickValue(record, ["date"])
        },
        "yyyy"
      ),
      description: toNullableText(pickValue(record, ["description"])),
      issuer: toNullableText(pickValue(record, ["issuer", "organization", "platform"])),
      link: coerceLinkField(pickValue(record, ["link", "url"])),
      title
    };
  });

  const summarySource = pickValue(root, ["summary", "objective", "profile"]);
  const summaryRecord = asRecord(summarySource);
  const summaryContent = toNullableText(pickValue(summaryRecord, ["content", "text"]) ?? summarySource);

  const skills = coerceSkillsSection(pickValue(root, ["skills", "technicalSkills", "skillset"]));
  const languagesSource = pickValue(root, ["languages", "languagesKnown"]);
  const languagesRecord = asRecord(languagesSource);
  const languageItems = toArray(pickValue(languagesRecord, ["items", "list"]) ?? languagesSource).map((item) => {
    const record = asRecord(item);
    return {
      language: toNullableText(pickValue(record, ["language", "name"]) ?? item),
      proficiency: pickMode(
        pickValue(record, ["proficiency", "level"]),
        ["native", "fluent", "conversational", "basic"] as const,
        "basic",
        { advanced: "fluent", intermediate: "conversational", beginner: "basic" }
      )
    };
  });
  const languages: AiLanguagesSection = {
    groups: toArray(pickValue(languagesRecord, ["groups"])).map(coerceSkillGroup),
    items: languageItems,
    mode: pickMode(pickValue(languagesRecord, ["mode"]), ["csv", "grouped"] as const, "csv")
  };

  const hobbiesSource = pickValue(root, ["hobbies", "interests"]);
  const hobbiesRecord = asRecord(hobbiesSource);
  const hobbies: AiHobbiesSection = {
    groups: toArray(pickValue(hobbiesRecord, ["groups"])).map(coerceSkillGroup),
    items: toArray(pickValue(hobbiesRecord, ["items", "list"]) ?? hobbiesSource).flatMap((item) => splitLines(item)),
    mode: pickMode(pickValue(hobbiesRecord, ["mode"]), ["csv", "grouped"] as const, "csv")
  };

  return {
    achievements: coerceCustomSection(pickValue(root, ["achievements", "awards"]), "Achievements"),
    certifications,
    competitions: coerceCustomSection(pickValue(root, ["competitions", "hackathons"]), "Competitions"),
    education,
    experience,
    extracurricular: coerceCustomSection(pickValue(root, ["extracurricular", "activities", "volunteerWork"]), "Extra-Curricular"),
    header: {
      address: toNullableText(pickValue(headerSource, ["address", "location"]) ?? pickValue(root, ["address", "location"])),
      email: toNullableText(pickValue(headerSource, ["email"]) ?? pickValue(root, ["email"])),
      github: coerceLinkField(pickValue(headerSource, ["github"]) ?? pickValue(root, ["github"])),
      linkedin: coerceLinkField(pickValue(headerSource, ["linkedin"]) ?? pickValue(root, ["linkedin"])),
      name: toNullableText(pickValue(headerSource, ["name"]) ?? pickValue(root, ["name"])),
      phone: toNullableText(pickValue(headerSource, ["phone"]) ?? pickValue(root, ["phone"])),
      role: toNullableText(pickValue(headerSource, ["role", "title"]) ?? pickValue(root, ["role", "title"])),
      website: coerceLinkField(pickValue(headerSource, ["website", "portfolio"]) ?? pickValue(root, ["website", "portfolio"]))
    },
    hobbies,
    languages,
    leadership: coerceCustomSection(pickValue(root, ["leadership", "positionsOfResponsibility"]), "Leaderships"),
    openSource: coerceCustomSection(pickValue(root, ["openSource", "opensource", "open_source"]), "Open-Source"),
    projects,
    publications: coerceCustomSection(pickValue(root, ["publications"]), "Publications"),
    skills,
    summary: {
      content: summaryContent,
      mode: pickMode(
        pickValue(summaryRecord, ["mode"]) ?? (normalizedToken(pickValue(root, ["objective"])) ? "career-objective" : "professional-summary"),
        ["career-objective", "professional-summary"] as const,
        "professional-summary",
        { objective: "career-objective", "career-objective": "career-objective" }
      )
    }
  };
}

function parseAiResumePayload(content: string) {
  try {
    const raw = JSON.parse(extractJsonObject(content));
    const coerced = coerceResumePayloadShape(raw);
    const parsed = aiResumeParseSchema.safeParse(coerced);

    if (parsed.success) {
      return {
        error: null,
        success: true as const,
        value: parsed.data
      };
    }

    return {
      error: parsed.error.issues.slice(0, 40).map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join("; "),
      success: false as const,
      value: null
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "The AI response could not be parsed as JSON.",
      success: false as const,
      value: null
    };
  }
}

async function requestAiParsedResume(text: string) {
  const initialPrompt = buildResumeParsePrompt(text);
  const initialResponse = await generateJsonText({ ...initialPrompt, debugLabel: "resume-parse-initial" });

  if (!initialResponse) {
    throw new AiResumeParsingUnavailableError();
  }

  const initialParse = parseAiResumePayload(initialResponse.content);

  if (initialParse.success) {
    return {
      modelUsed: initialResponse.modelUsed,
      value: initialParse.value
    };
  }

  throw new Error(`AI resume parsing returned invalid JSON. ${initialParse.error}`);
}

function normalizeAiResume(parsed: AiResumeParse): ResumeData {
  const base = createEmptyResumeData("ai");

  return {
    ...base,
    achievements: normalizeCustomSection(parsed.achievements, "Achievements"),
    certifications: normalizeCertificationItems(parsed.certifications),
    competitions: normalizeCustomSection(parsed.competitions, "Competitions"),
    education:
      parsed.education.map((item) => ({
        boardOrUniversity: cleanText(item.boardOrUniversity),
        date: normalizeDateField(item.date),
        degree: cleanText(item.degree),
        field: cleanText(item.field),
        institution: cleanText(item.institution),
        level: item.level,
        location: cleanText(item.location),
        result: cleanText(item.result),
        resultType: item.resultType ?? null
      }))
      .filter((item) => hasMeaningfulValue([item.degree, item.field, item.institution, item.location, item.result, item.date.startYear, item.date.endYear])),
    experience:
      parsed.experience.map((item) => ({
        company: cleanText(item.company),
        date: normalizeDateField(item.date),
        description: normalizeDescriptionField(item.description),
        isCurrent: Boolean(item.isCurrent),
        location: cleanText(item.location),
        role: cleanText(item.role)
      }))
      .filter((item) =>
        hasMeaningfulValue([
          item.role,
          item.company,
          item.location,
          item.description.paragraph,
          item.description.bullets.length > 0,
          item.date.startYear,
          item.date.endYear,
          item.isCurrent
        ])
      ),
    extracurricular: normalizeCustomSection(parsed.extracurricular, "Extra-Curricular"),
    header: {
      address: cleanText(parsed.header.address),
      email: cleanText(parsed.header.email),
      github: normalizeLinkField(parsed.header.github),
      linkedin: normalizeLinkField(parsed.header.linkedin),
      name: cleanText(parsed.header.name),
      phone: cleanText(parsed.header.phone),
      role: cleanText(parsed.header.role),
      website: normalizeLinkField(parsed.header.website)
    },
    hobbies: {
      groups: parsed.hobbies.groups
        .map((group) => ({
          groupLabel: cleanText(group.groupLabel),
          items: dedupeList(group.items.map((item) => item.trim()).filter(Boolean))
        }))
        .filter((group) => Boolean(group.groupLabel || group.items.length)),
      items: dedupeList(parsed.hobbies.items.map((item) => item.trim()).filter(Boolean)),
      mode: parsed.hobbies.mode
    },
    languages: {
      groups: parsed.languages.groups
        .map((group) => ({
          groupLabel: cleanText(group.groupLabel),
          items: dedupeList(group.items.map((item) => item.trim()).filter(Boolean))
        }))
        .filter((group) => Boolean(group.groupLabel || group.items.length)),
      items: parsed.languages.items
        .map((item) => ({
          language: cleanText(item.language),
          proficiency: item.proficiency ?? null
        }))
        .filter((item) => Boolean(item.language)),
      mode: parsed.languages.mode
    },
    leadership: normalizeCustomSection(parsed.leadership, "Leaderships"),
    meta: {
      ...base.meta,
      source: "ai"
    },
    openSource: normalizeCustomSection(parsed.openSource, "Open-Source"),
    projects:
      parsed.projects.map((item) => ({
        date: normalizeDateField(item.date),
        description: normalizeDescriptionField(item.description),
        githubLink: normalizeLinkField(item.githubLink),
        liveLink: normalizeLinkField(item.liveLink),
        technologies: item.technologies.map((tech) => tech.trim()).filter(Boolean),
        title: cleanText(item.title)
      }))
      .filter((item) =>
        hasMeaningfulValue([
          item.title,
          item.description.paragraph,
          item.description.bullets.length > 0,
          item.githubLink.url,
          item.liveLink.url,
          item.date.startYear,
          item.technologies.length > 0
        ])
      ),
    publications: normalizeCustomSection(parsed.publications, "Publications"),
    skills: normalizeSkills(parsed.skills),
    summary: {
      content: cleanText(parsed.summary.content),
      mode: parsed.summary.mode
    }
  };
}

function buildResumeImportMeta(method: ResumeImportMeta["method"], cached: boolean, confidence: ResumeImportMeta["confidence"]): ResumeImportMeta {
  return {
    cached,
    confidence,
    method
  };
}

export async function parseResumeTextWithAi(text: string): Promise<ResumeImportResult> {
  const aiHealth = getAiServiceHealth();
  const trimmedText = text.trim();
  const emptyResume = createEmptyResumeData("ai");

  if (!trimmedText) {
    return {
      meta: buildResumeImportMeta("ai", false, "low"),
      resume: emptyResume,
      summary: createResumeSummary(emptyResume),
      warnings: ["Paste or upload resume content before starting an AI parse."]
    };
  }

  if (!aiHealth.configured) {
    throw new AiResumeParsingUnavailableError();
  }

  const cacheKey = createCacheKey(JSON.stringify({ kind: "resume-parse", text: trimmedText, version: 4 }));
  const cached = await readJsonCache<ResumeImportResult>("resume-parse", cacheKey);

  if (cached) {
    return {
      ...cached,
      meta: {
        ...cached.meta,
        cached: true
      }
    };
  }

  try {
    const completion = await requestAiParsedResume(trimmedText);
    const parsedResume = normalizeAiResume(completion.value);
    const summary = createResumeSummary(parsedResume);
    const warnings = buildImportWarnings(parsedResume);
    const result: ResumeImportResult = {
      meta: buildResumeImportMeta("ai", false, getImportConfidence(summary, warnings)),
      resume: parsedResume,
      summary,
      warnings: dedupeWarnings(warnings)
    };

    await writeJsonCache("resume-parse", cacheKey, result);
    return result;
  } catch (error) {
    if (error instanceof AiResumeParsingUnavailableError) {
      throw error;
    }

    throw new Error(error instanceof Error ? `AI resume parsing failed: ${error.message}` : "AI resume parsing failed.");
  }
}

function resumeToAnalysisText(resume: ResumeData) {
  return [
    resume.header.name,
    resume.header.role,
    getResumeContactLines(resume).join(" | "),
    getSummaryText(resume),
    flattenSkills(resume.skills).join(", "),
    ...resume.experience.flatMap((item) => [
      [item.role, item.company, item.location, formatDateField(item.date)].filter(Boolean).join(" | "),
      ...flattenDescriptionLines(item.description)
    ]),
    ...resume.education.map((item) => [item.degree, item.field, item.institution, item.location, item.result, formatDateField(item.date)].filter(Boolean).join(" | ")),
    ...resume.projects.flatMap((item) => [
      [item.title, getLinkLabel(item.githubLink), getLinkLabel(item.liveLink), formatDateField(item.date)].filter(Boolean).join(" | "),
      ...flattenDescriptionLines(item.description),
      item.technologies.join(", "),
    ]),
    ...resume.certifications.map((item) => [item.title, item.issuer, item.description, getLinkLabel(item.link), formatDateField(item.date)].filter(Boolean).join(" | ")),
    ...[
      resume.leadership,
      resume.achievements,
      resume.competitions,
      resume.extracurricular,
      resume.publications,
      resume.openSource
    ].flatMap((section) =>
      section.entries.flatMap((entry) => [
        [section.label, entry.title, entry.subtitle, entry.location, formatDateField(entry.date), getLinkLabel(entry.link)].filter(Boolean).join(" | "),
        ...flattenDescriptionLines(entry.description)
      ])
    ),
    ...resume.languages.items.map((item) => [item.language, item.proficiency].filter(Boolean).join(" | ")),
    ...resume.languages.groups.map((group) => `${group.groupLabel}: ${group.items.join(", ")}`),
    ...resume.hobbies.items,
    ...resume.hobbies.groups.map((group) => `${group.groupLabel}: ${group.items.join(", ")}`)
  ]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join("\n");
}

export async function analyzeResumeForAtsWithAi(resume: ResumeData, options: RenderOptions): Promise<AtsAnalysisResult> {
  const base = analyzeResumeForAts(resume, options);
  const aiHealth = getAiServiceHealth();

  if (!aiHealth.configured) {
    return {
      ...base,
      aiSummary: null,
      modelUsed: null
    };
  }

  const cacheKey = createCacheKey(JSON.stringify({ options, resume, kind: "ats" }));
  const cached = await readJsonCache<AtsAnalysisResult>("ats-analysis", cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const completion = await generateStructuredObject({
      debugLabel: "ats-coaching",
      schema: atsCoachingSchema,
      system:
        "You are an ATS resume coach. Use the deterministic signals provided to write a concise summary and up to six actionable issues. Do not invent experience. Stay grounded in the supplied resume and checks. Return only JSON.",
      user: [
        "Resume text:",
        resumeToAnalysisText(resume),
        "",
        "Render options:",
        JSON.stringify(options),
        "",
        "Deterministic ATS analysis:",
        JSON.stringify(base)
      ].join("\n")
    });

    if (!completion) {
      return {
        ...base,
        aiSummary: null,
        modelUsed: null
      };
    }

    const result: AtsAnalysisResult = {
      ...base,
      aiSummary: completion.value.summary,
      issues: completion.value.issues.length > 0 ? completion.value.issues : base.issues,
      modelUsed: completion.modelUsed,
      summary: completion.value.summary
    };

    await writeJsonCache("ats-analysis", cacheKey, result);
    return result;
  } catch {
    return {
      ...base,
      aiSummary: null,
      modelUsed: null
    };
  }
}

function cosineSimilarity(left: number[], right: number[]) {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildResumeChunks(resume: ResumeData) {
  const chunks: Array<{ section: ResumeSectionKey | null; text: string }> = [];

  if (getSummaryText(resume)) {
    chunks.push({ section: "summary", text: getSummaryText(resume) });
  }

  const skillLines = flattenSkills(resume.skills);

  if (skillLines.length > 0) {
    chunks.push({ section: "skills", text: skillLines.join(", ") });
  }

  resume.experience.forEach((item) => {
    const text = [item.role, item.company, item.location, formatDateField(item.date), ...flattenDescriptionLines(item.description)]
      .filter(Boolean)
      .join(" | ");

    if (text.trim()) {
      chunks.push({ section: "experience", text });
    }
  });

  resume.projects.forEach((item) => {
    const text = [
      item.title,
      getLinkLabel(item.githubLink),
      getLinkLabel(item.liveLink),
      formatDateField(item.date),
      ...item.technologies,
      ...flattenDescriptionLines(item.description)
    ]
      .filter(Boolean)
      .join(" | ");

    if (text.trim()) {
      chunks.push({ section: "projects", text });
    }
  });

  resume.education.forEach((item) => {
    const text = [item.degree, item.field, item.institution, item.location, item.result, formatDateField(item.date)].filter(Boolean).join(" | ");

    if (text.trim()) {
      chunks.push({ section: "education", text });
    }
  });

  resume.certifications.forEach((item) => {
    const text = [item.title, item.issuer, item.description, getLinkLabel(item.link), formatDateField(item.date)].filter(Boolean).join(" | ");

    if (text.trim()) {
      chunks.push({ section: "certifications", text });
    }
  });

  ([
    ["leadership", resume.leadership],
    ["achievements", resume.achievements],
    ["competitions", resume.competitions],
    ["extracurricular", resume.extracurricular],
    ["publications", resume.publications],
    ["openSource", resume.openSource]
  ] as Array<[ResumeSectionKey, CustomEntriesSection]>).forEach(([sectionKey, section]) => {
    section.entries.forEach((entry) => {
      const text = [
        section.label,
        entry.title,
        entry.subtitle,
        entry.location,
        formatDateField(entry.date),
        getLinkLabel(entry.link),
        ...flattenDescriptionLines(entry.description)
      ]
        .filter(Boolean)
        .join(" | ");

      if (text.trim()) {
        chunks.push({ section: sectionKey as ResumeSectionKey, text });
      }
    });
  });

  if (resume.languages.items.length > 0 || resume.languages.groups.length > 0) {
    chunks.push({
      section: "languages",
      text: [
        ...resume.languages.items.map((item) => [item.language, item.proficiency].filter(Boolean).join(" | ")),
        ...resume.languages.groups.map((group) => `${group.groupLabel}: ${group.items.join(", ")}`)
      ]
        .filter(Boolean)
        .join(" | ")
    });
  }

  if (resume.hobbies.items.length > 0 || resume.hobbies.groups.length > 0) {
    chunks.push({
      section: "hobbies",
      text: [...resume.hobbies.items, ...resume.hobbies.groups.map((group) => `${group.groupLabel}: ${group.items.join(", ")}`)]
        .filter(Boolean)
        .join(" | ")
    });
  }

  return chunks;
}

function normalizeRequirementKeyword(value: string) {
  return value.trim().toLowerCase();
}

function truncateEvidence(value: string) {
  const trimmed = value.replace(/\s+/g, " ").trim();

  if (trimmed.length <= 140) {
    return trimmed;
  }

  return `${trimmed.slice(0, 137).trim()}...`;
}

function buildStructuredKeywordBreakdown(
  requirements: Array<{ keywords: string[] }>,
  resumeChunks: Array<{ section: ResumeSectionKey | null; text: string }>
) {
  const seen = new Set<string>();
  const indexedChunks = resumeChunks.map((chunk) => ({
    normalized: chunk.text.toLowerCase(),
    raw: chunk.text,
    section: chunk.section
  }));

  return requirements.flatMap((requirement) =>
    requirement.keywords
      .map((keyword) => normalizeRequirementKeyword(keyword))
      .filter((keyword) => {
        if (!keyword || seen.has(keyword)) {
          return false;
        }

        seen.add(keyword);
        return true;
      })
      .map<KeywordBreakdown>((keyword) => {
        const phraseTokens = keyword.split(/\s+/).filter(Boolean);
        let partialMatch: KeywordBreakdown | null = null;

        for (const chunk of indexedChunks) {
          if (chunk.normalized.includes(keyword)) {
            return {
              evidence: truncateEvidence(chunk.raw),
              keyword,
              section: chunk.section,
              status: "matched"
            };
          }

          const matchedTokenCount = phraseTokens.filter((token) => chunk.normalized.includes(token)).length;

          if (!partialMatch && matchedTokenCount > 0) {
            partialMatch = {
              evidence: truncateEvidence(chunk.raw),
              keyword,
              section: chunk.section,
              status: matchedTokenCount === phraseTokens.length ? "matched" : "partial"
            };
          }
        }

        return (
          partialMatch ?? {
            evidence: null,
            keyword,
            section: null,
            status: "missing"
          }
        );
      })
  );
}

function buildRequirementBreakdown(
  requirements: Array<{ keywords: string[]; title: string; type: "must" | "preferred"; weight: number }>,
  breakdown: KeywordBreakdown[],
  semanticScores: Array<{ score: number; section: ResumeSectionKey | null }>
) {
  return requirements.map((requirement, index) => {
    const requirementKeywords = requirement.keywords.map(normalizeRequirementKeyword);
    const matchingEntries = breakdown.filter((item) => requirementKeywords.includes(normalizeRequirementKeyword(item.keyword)));
    const matchedKeywords = matchingEntries.filter((item) => item.status === "matched").map((item) => item.keyword);
    const fallbackSection = matchingEntries.find((item) => item.section)?.section ?? semanticScores[index]?.section ?? null;

    return {
      matchedKeywords,
      section: fallbackSection,
      semanticScore: semanticScores[index]?.score ?? 0,
      title: requirement.title,
      type: requirement.type,
      weight: requirement.weight
    };
  });
}

function buildJdSummary(score: number) {
  if (score >= 85) {
    return {
      summaryCopy: "This resume aligns strongly with the selected job description. Focus next on polishing the strongest evidence rather than broad rewrites.",
      summaryTitle: "Strong role alignment"
    };
  }

  if (score >= 70) {
    return {
      summaryCopy: "The match is healthy, but a few missing themes are still holding back the final score. Tighten the wording around the strongest real overlaps.",
      summaryTitle: "Good match with room to sharpen"
    };
  }

  if (score >= 55) {
    return {
      summaryCopy: "There is meaningful overlap, but the resume still needs clearer evidence for the most important role requirements.",
      summaryTitle: "Partial match so far"
    };
  }

  return {
    summaryCopy: "The current resume does not yet map well to this JD. Start by surfacing the required skills and responsibilities that genuinely match your background.",
    summaryTitle: "Low match right now"
  };
}

export async function analyzeResumeAgainstJdWithAi(resume: ResumeData, jobDescription: string): Promise<JdAnalysisResult> {
  const aiHealth = getAiServiceHealth();
  const resumeChunks = buildResumeChunks(resume);

  if (!jobDescription.trim()) {
    return {
      aiSummary: null,
      embeddingStatus: aiHealth.embeddingProvider === "openai" ? "ready" : "disabled",
      keywordBreakdown: [],
      keywordScore: 0,
      keywords: [],
      matched: 0,
      matchedKeywords: [],
      missing: 0,
      missingKeywords: [],
      modelUsed: null,
      partial: 0,
      partialKeywords: [],
      requirementBreakdown: [],
      score: 0,
      suggestions: [],
      summaryCopy: "Paste a job description to compare your resume against role-specific requirements.",
      summaryTitle: "Add a job description to start",
      tags: [],
      semanticScore: aiHealth.embeddingProvider === "openai" ? 0 : undefined
    };
  }

  if (!aiHealth.configured) {
    const fallbackBreakdown = buildStructuredKeywordBreakdown(
      [{ keywords: jobDescription.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean) }],
      resumeChunks
    );

    return {
      aiSummary: null,
      embeddingStatus: "disabled",
      keywordBreakdown: fallbackBreakdown,
      keywordScore: 0,
      keywords: fallbackBreakdown.map((item) => item.keyword),
      matched: fallbackBreakdown.filter((item) => item.status === "matched").length,
      matchedKeywords: fallbackBreakdown.filter((item) => item.status === "matched").map((item) => item.keyword),
      missing: fallbackBreakdown.filter((item) => item.status === "missing").length,
      missingKeywords: fallbackBreakdown.filter((item) => item.status === "missing").map((item) => item.keyword),
      modelUsed: null,
      partial: fallbackBreakdown.filter((item) => item.status === "partial").length,
      partialKeywords: fallbackBreakdown.filter((item) => item.status === "partial").map((item) => item.keyword),
      requirementBreakdown: [],
      score: 0,
      suggestions: [],
      summaryCopy: "AI-assisted JD parsing is not configured, so only the manual JD input is available right now.",
      summaryTitle: "AI configuration required",
      tags: [],
      semanticScore: undefined
    };
  }

  const cacheKey = createCacheKey(JSON.stringify({ jd: jobDescription, kind: "jd", resume, version: 2 }));
  const cached = await readJsonCache<JdAnalysisResult>("jd-analysis", cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const parsedJd = await generateStructuredObject({
      debugLabel: "jd-parse",
      schema: jdParseSchema,
      system:
        "You extract structured job requirements from a job description. Return only the essential must-have and preferred requirements, with concise titles, supporting keywords, and weights from 1 to 10. Do not invent requirements that are not grounded in the JD. Return only JSON.",
      user: [
        "Return JSON with this exact shape:",
        '{ "roleTitle": "string", "summary": "string", "requirements": [ { "title": "string", "type": "must|preferred", "weight": 1, "keywords": ["string"] } ] }',
        "",
        "Job description:",
        jobDescription
      ].join("\n")
    });

    if (!parsedJd) {
      return {
        aiSummary: null,
        embeddingStatus: "disabled",
        keywordBreakdown: [],
        keywordScore: 0,
        keywords: [],
        matched: 0,
        matchedKeywords: [],
        missing: 0,
        missingKeywords: [],
        modelUsed: null,
        partial: 0,
        partialKeywords: [],
        requirementBreakdown: [],
        score: 0,
        suggestions: [],
        summaryCopy: "The JD could not be parsed into structured requirements yet. Review the input and run it again.",
        summaryTitle: "JD parsing needs another pass",
        tags: [],
        semanticScore: undefined
      };
    }

    const requirements = parsedJd.value.requirements.map((requirement) => ({
      ...requirement,
      keywords: Array.from(new Set([requirement.title, ...requirement.keywords].map((keyword) => keyword.trim()).filter(Boolean)))
    }));
    const breakdown = buildStructuredKeywordBreakdown(requirements, resumeChunks);
    const keywordSeed = breakdown.map((item) => item.keyword);
    let semanticScores: Array<{ score: number; section: ResumeSectionKey | null }> = requirements.map(() => ({
      score: 0,
      section: null
    }));
    let semanticAverage: number | undefined;
    let embeddingStatus: JdAnalysisResult["embeddingStatus"] = "disabled";

    const jdEmbeddingKey = createCacheKey(JSON.stringify({ kind: "jd-embeddings", requirements, resumeChunks }));
    const cachedEmbeddings = await readJsonCache<{
      requirementVectors: number[][];
      resumeVectors: number[][];
    }>("embeddings", jdEmbeddingKey);

    if (cachedEmbeddings) {
      const resolvedEmbeddings = cachedEmbeddings;

      if (resolvedEmbeddings) {
        embeddingStatus = "ready";
        semanticScores = resolvedEmbeddings.requirementVectors.map((vector: number[], requirementIndex: number) => {
          let best = { score: 0, section: null as ResumeSectionKey | null };

          resolvedEmbeddings.resumeVectors.forEach((resumeVector: number[], chunkIndex: number) => {
            const similarity = cosineSimilarity(vector, resumeVector);

            if (similarity > best.score) {
              best = {
                score: similarity,
                section: resumeChunks[chunkIndex]?.section ?? null
              };
            }
          });

          return {
            score: clampPercent(best.score * 100),
            section: best.section
          };
        });

        semanticAverage =
          semanticScores.reduce((total, item) => total + item.score, 0) / Math.max(semanticScores.length, 1);
      }
    }

    const requirementBreakdown = buildRequirementBreakdown(requirements, breakdown, semanticScores);
    const weightedRequirements = requirementBreakdown.map((requirement, index) => {
      const totalKeywords = requirements[index].keywords.length || 1;
      const partialKeywordCount = breakdown.filter(
        (item) =>
          requirements[index].keywords.map(normalizeRequirementKeyword).includes(normalizeRequirementKeyword(item.keyword)) &&
          item.status === "partial"
      ).length;
      const keywordCoverage = ((requirement.matchedKeywords.length + partialKeywordCount * 0.5) / totalKeywords) * 100;
      const combined =
        semanticAverage !== undefined
          ? keywordCoverage * 0.6 + requirement.semanticScore * 0.4
          : keywordCoverage;

      return {
        ...requirement,
        combinedScore: combined
      };
    });

    const totalWeight = weightedRequirements.reduce((total, requirement) => total + requirement.weight, 0) || 1;
    const weightedScore = weightedRequirements.reduce(
      (total, requirement) => total + requirement.combinedScore * requirement.weight,
      0
    );
    const matchedBreakdown = breakdown.filter((item) => item.status === "matched");
    const partialBreakdown = breakdown.filter((item) => item.status === "partial");
    const missingBreakdown = breakdown.filter((item) => item.status === "missing");
    const keywordScore = clampPercent(
      ((matchedBreakdown.length + partialBreakdown.length * 0.5) / Math.max(breakdown.length, 1)) * 100
    );
    const requirementScore = weightedScore / totalWeight;
    const finalScore = clampPercent(
      semanticAverage !== undefined ? requirementScore : requirementScore * 0.7 + keywordScore * 0.3
    );
    const summary = buildJdSummary(finalScore);

    const result: JdAnalysisResult = {
      aiSummary: parsedJd.value.summary?.trim() || null,
      embeddingStatus,
      keywordBreakdown: breakdown,
      keywordScore,
      keywords: keywordSeed,
      matched: matchedBreakdown.length,
      matchedKeywords: matchedBreakdown.map((item) => item.keyword),
      missing: missingBreakdown.length,
      missingKeywords: missingBreakdown.map((item) => item.keyword),
      modelUsed: parsedJd.modelUsed,
      partial: partialBreakdown.length,
      partialKeywords: partialBreakdown.map((item) => item.keyword),
      requirementBreakdown: requirementBreakdown.map((item) => ({
        matchedKeywords: item.matchedKeywords,
        section: item.section,
        semanticScore: item.semanticScore,
        title: item.title,
        type: item.type,
        weight: item.weight
      })),
      score: finalScore,
      semanticScore: semanticAverage !== undefined ? clampPercent(semanticAverage) : undefined,
      suggestions: weightedRequirements
        .filter((item) => item.matchedKeywords.length < 1)
        .slice(0, 5)
        .map((item) => ({
          detail:
            item.type === "must"
              ? "This is a core requirement in the JD. If it reflects real experience, surface it in a bullet, skills line, or summary statement."
              : "This is a secondary signal. Add it only where it honestly fits your experience and stack.",
          keyword: item.title,
          status: item.matchedKeywords.length > 0 ? "partial" : "missing"
        })),
      summaryCopy: summary.summaryCopy,
      summaryTitle: summary.summaryTitle,
      tags: matchedBreakdown.slice(0, 5).map((item) => item.keyword)
    };

    await writeJsonCache("jd-analysis", cacheKey, result);
    return result;
  } catch {
    const fallbackBreakdown = buildStructuredKeywordBreakdown(
      [{ keywords: jobDescription.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean) }],
      resumeChunks
    );

    return {
      aiSummary: null,
      embeddingStatus: aiHealth.embeddingProvider === "openai" ? "ready" : "disabled",
      keywordBreakdown: fallbackBreakdown,
      keywordScore: 0,
      keywords: fallbackBreakdown.map((item) => item.keyword),
      matched: fallbackBreakdown.filter((item) => item.status === "matched").length,
      matchedKeywords: fallbackBreakdown.filter((item) => item.status === "matched").map((item) => item.keyword),
      missing: fallbackBreakdown.filter((item) => item.status === "missing").length,
      missingKeywords: fallbackBreakdown.filter((item) => item.status === "missing").map((item) => item.keyword),
      modelUsed: null,
      partial: fallbackBreakdown.filter((item) => item.status === "partial").length,
      partialKeywords: fallbackBreakdown.filter((item) => item.status === "partial").map((item) => item.keyword),
      requirementBreakdown: [],
      score: 0,
      suggestions: [],
      summaryCopy: "The JD could not be parsed into structured requirements yet. Review the input and run it again.",
      summaryTitle: "JD parsing needs another pass",
      tags: [],
      semanticScore: undefined
    };
  }
}



import { isRenderTemplateId } from "../../data/templates";
import { createInitialRenderOptions } from "../../lib/tex";
import {
  DEFAULT_RESUME_SECTION_ORDER,
  GENERIC_CUSTOM_SECTION_LABELS,
  MONTH_OPTIONS,
  createEmptyCustomEntry,
  createEmptyDateField,
  createEmptyDescriptionField,
  createEmptyLinkField,
  createEmptyResumeData,
  isGenericCustomSectionKey,
  isResumeSectionKey,
  type CustomEntriesSection,
  type DateField,
  type DescriptionField,
  type GenericCustomSectionKey,
  type LanguageItem,
  type LinkField,
  type OrderedResumeSectionId,
  type RenderOptions,
  type ResumeData,
  type ResumeSectionKey
} from "../../types/resume";

const WORKSPACE_STORAGE_KEY = "meowfolio.workspace.v1";
const WORKSPACE_STORAGE_VERSION = 4;

interface WorkspaceSnapshot {
  jobDescription: string;
  renderOptions: RenderOptions;
  resume: ResumeData;
}

interface SerializedWorkspaceSnapshot extends WorkspaceSnapshot {
  savedAt: string;
  version: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toOptionalStringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeMonthValue(value: unknown) {
  return MONTH_OPTIONS.includes(value as (typeof MONTH_OPTIONS)[number]) ? (value as (typeof MONTH_OPTIONS)[number]) : "";
}

function mapLegacySectionKey(value: string): OrderedResumeSectionId | null {
  if (isResumeSectionKey(value)) {
    return value;
  }

  switch (value) {
    case "awards":
      return "achievements";
    case "extracurricular":
      return "extracurricular";
    case "leadership":
      return "leadership";
    default:
      return null;
  }
}

function normalizeSectionOrder(value: unknown) {
  const ordered = Array.isArray(value) ? value.map((item) => mapLegacySectionKey(toStringValue(item))).filter(Boolean) : [];
  const merged = [...ordered];

  DEFAULT_RESUME_SECTION_ORDER.forEach((section) => {
    if (!merged.includes(section)) {
      merged.push(section);
    }
  });

  return merged as OrderedResumeSectionId[];
}

function normalizeSectionTitles(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  const titles: Partial<Record<ResumeSectionKey, string>> = {};

  Object.entries(value).forEach(([rawKey, rawValue]) => {
    const mappedKey = mapLegacySectionKey(rawKey);
    const nextTitle = toStringValue(rawValue).trim();

    if (mappedKey && nextTitle) {
      titles[mappedKey] = nextTitle;
    }
  });

  return titles;
}

function normalizeLinkField(value: unknown) {
  if (typeof value === "string") {
    return {
      ...createEmptyLinkField(),
      url: value
    } satisfies LinkField;
  }

  if (!isRecord(value)) {
    return createEmptyLinkField();
  }

  return {
    displayMode: value.displayMode === "hyperlinked-text" ? "hyperlinked-text" : "plain-url",
    displayText: toOptionalStringValue(value.displayText),
    url: toOptionalStringValue(value.url)
  } satisfies LinkField;
}

function normalizeDateField(value: unknown, fallback: DateField["mode"]) {
  if (!isRecord(value)) {
    return createEmptyDateField(fallback);
  }

  return {
    endMonth: normalizeMonthValue(value.endMonth),
    endYear: toOptionalStringValue(value.endYear),
    isOngoing: typeof value.isOngoing === "boolean" ? value.isOngoing : fallback.endsWith("present"),
    mode: typeof value.mode === "string" ? (value.mode as DateField["mode"]) : fallback,
    startMonth: normalizeMonthValue(value.startMonth),
    startYear: toOptionalStringValue(value.startYear)
  } satisfies DateField;
}

function normalizeDescriptionField(value: unknown, fallbackMode: DescriptionField["mode"]): DescriptionField {
  if (typeof value === "string") {
    return {
      ...createEmptyDescriptionField("paragraph"),
      mode: "paragraph",
      paragraph: value
    } satisfies DescriptionField;
  }

  if (!isRecord(value)) {
    return createEmptyDescriptionField(fallbackMode);
  }

  return {
    bullets: toStringArray(value.bullets),
    mode: value.mode === "paragraph" ? "paragraph" : "bullets",
    paragraph: toOptionalStringValue(value.paragraph)
  } satisfies DescriptionField;
}

function normalizeSkillsSection(value: unknown): ResumeData["skills"] {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string")) {
      return {
        groups: [],
        items: value,
        mode: "csv"
      } as ResumeData["skills"];
    }

    return {
      groups: value
        .filter((item): item is Record<string, unknown> => isRecord(item))
        .map((item) => ({
          groupLabel: toOptionalStringValue(item.category ?? item.groupLabel),
          items: toStringArray(item.items)
        }))
        .filter((group) => Boolean(group.groupLabel) || group.items.length > 0),
      items: [],
      mode: "grouped"
    } as ResumeData["skills"];
  }

  if (!isRecord(value)) {
    return createEmptyResumeData().skills;
  }

  return {
    groups: Array.isArray(value.groups)
      ? value.groups
          .filter((item): item is Record<string, unknown> => isRecord(item))
          .map((item) => ({
            groupLabel: toOptionalStringValue(item.groupLabel),
            items: toStringArray(item.items)
          }))
          .filter((group) => Boolean(group.groupLabel) || group.items.length > 0)
      : [],
    items: toStringArray(value.items),
    mode: value.mode === "grouped" ? "grouped" : "csv"
  };
}

function normalizeLegacyCompactEntry(value: unknown): CustomEntriesSection["entries"][number] {
  if (!isRecord(value)) {
    return createEmptyCustomEntry();
  }

  return {
    ...createEmptyCustomEntry(),
    date: normalizeCompactDate(value.date),
    description: {
      ...createEmptyDescriptionField("paragraph"),
      mode: "paragraph",
      paragraph: toOptionalStringValue(value.description)
    },
    link: normalizeLinkField(value.link),
    title: toOptionalStringValue(value.description)
  };
}

function normalizeCompactDate(value: unknown): DateField {
  const text = toStringValue(value).trim();

  if (!text) {
    return createEmptyDateField("yyyy");
  }

  const years = text.match(/\b(19|20)\d{2}\b/g) ?? [];

  if (years.length >= 2) {
    return {
      ...createEmptyDateField("yyyy-range"),
      endYear: years[1],
      mode: "yyyy-range",
      startYear: years[0]
    };
  }

  if (/present/i.test(text) && years[0]) {
    return {
      ...createEmptyDateField("yyyy-present"),
      isOngoing: true,
      mode: "yyyy-present",
      startYear: years[0]
    };
  }

  return {
    ...createEmptyDateField("yyyy"),
    mode: "yyyy",
    startYear: years[0] ?? text
  };
}

function normalizeCustomEntriesSection(value: unknown, key: GenericCustomSectionKey): CustomEntriesSection {
  if (Array.isArray(value)) {
    return {
      entries: value.map(normalizeLegacyCompactEntry).filter((entry) => hasCustomEntryContent(entry)),
      label: GENERIC_CUSTOM_SECTION_LABELS[key]
    };
  }

  if (!isRecord(value)) {
    return {
      entries: [],
      label: GENERIC_CUSTOM_SECTION_LABELS[key]
    };
  }

  return {
    entries: Array.isArray(value.entries)
      ? value.entries
          .filter((item): item is Record<string, unknown> => isRecord(item))
          .map((item): CustomEntriesSection["entries"][number] => ({
            date: normalizeDateField(item.date, "mm-yyyy"),
            description: normalizeDescriptionField(item.description, "bullets"),
            link: normalizeLinkField(item.link),
            location: toOptionalStringValue(item.location),
            subtitle: toOptionalStringValue(item.subtitle),
            title: toOptionalStringValue(item.title)
          }))
          .filter((entry) => hasCustomEntryContent(entry))
      : [],
    label: toStringValue(value.label).trim() || GENERIC_CUSTOM_SECTION_LABELS[key]
  };
}

function hasCustomEntryContent(entry: CustomEntriesSection["entries"][number]) {
  return Boolean(
    entry.title?.trim() ||
      entry.subtitle?.trim() ||
      entry.location?.trim() ||
      entry.description.paragraph?.trim() ||
      entry.description.bullets.length ||
      entry.link.url?.trim() ||
      entry.date.startYear?.trim()
  );
}

function normalizeLanguagesSection(value: unknown): ResumeData["languages"] {
  if (!isRecord(value)) {
    return createEmptyResumeData().languages;
  }

  return {
    groups: Array.isArray(value.groups)
      ? value.groups
          .filter((item): item is Record<string, unknown> => isRecord(item))
          .map((item) => ({
            groupLabel: toOptionalStringValue(item.groupLabel),
            items: toStringArray(item.items)
          }))
      : [],
    items: Array.isArray(value.items)
      ? value.items
          .filter((item): item is Record<string, unknown> => isRecord(item))
          .map(
            (item): LanguageItem => ({
              language: toOptionalStringValue(item.language),
              proficiency:
                item.proficiency === "native" || item.proficiency === "fluent" || item.proficiency === "conversational" || item.proficiency === "basic"
                  ? item.proficiency
                  : null
            })
          )
          .filter((item) => Boolean(item.language))
      : [],
    mode: value.mode === "grouped" ? "grouped" : "csv"
  };
}

function normalizeHobbiesSection(value: unknown): ResumeData["hobbies"] {
  if (!isRecord(value)) {
    return createEmptyResumeData().hobbies;
  }

  return {
    groups: Array.isArray(value.groups)
      ? value.groups
          .filter((item): item is Record<string, unknown> => isRecord(item))
          .map((item) => ({
            groupLabel: toOptionalStringValue(item.groupLabel),
            items: toStringArray(item.items)
          }))
      : [],
    items: toStringArray(value.items),
    mode: value.mode === "grouped" ? "grouped" : "csv"
  };
}

function normalizeHeader(value: unknown): ResumeData["header"] {
  const header = isRecord(value) ? value : {};

  return {
    address: toOptionalStringValue(header.address ?? header.location),
    email: toOptionalStringValue(header.email),
    github: normalizeLinkField(header.github),
    linkedin: normalizeLinkField(header.linkedin),
    name: toOptionalStringValue(header.name),
    phone: toOptionalStringValue(header.phone),
    role: toOptionalStringValue(header.role ?? header.title),
    website: normalizeLinkField(header.website ?? header.portfolio)
  };
}

function normalizeResumeData(value: unknown): ResumeData {
  const fallback = createEmptyResumeData("scratch");

  if (!isRecord(value)) {
    return fallback;
  }

  const meta = isRecord(value.meta) ? value.meta : {};
  const summaryValue = value.summary;

  return {
    achievements: normalizeCustomEntriesSection(value.achievements ?? value.awards, "achievements"),
    certifications: Array.isArray(value.certifications)
      ? value.certifications
          .filter((item): item is Record<string, unknown> => isRecord(item))
          .map((item): ResumeData["certifications"][number] => ({
            date: normalizeDateField(item.date, "mm-yyyy"),
            description: toOptionalStringValue(item.description),
            issuer: toOptionalStringValue(item.issuer),
            link: normalizeLinkField(item.link),
            title: toOptionalStringValue(item.title ?? item.description)
          }))
          .filter((item) => Boolean(item.title?.trim() || item.issuer?.trim() || item.description?.trim() || item.link.url?.trim()))
      : [],
    competitions: normalizeCustomEntriesSection(value.competitions, "competitions"),
    education: Array.isArray(value.education)
      ? value.education
          .filter((item): item is Record<string, unknown> => isRecord(item))
          .map((item): ResumeData["education"][number] => ({
            boardOrUniversity: toOptionalStringValue(item.boardOrUniversity ?? item.board_or_univ),
            date: normalizeDateField(
              item.date ?? {
                endYear: item.endYear,
                mode: "yyyy-range",
                startYear: item.startYear
              },
              "yyyy-range"
            ),
            degree: toOptionalStringValue(item.degree),
            field: toOptionalStringValue(item.field),
            institution: toOptionalStringValue(item.institution),
            level:
              item.level === "degree-diploma" || item.level === "class-12" || item.level === "class-10" || item.level === "other"
                ? item.level
                : "degree-diploma",
            location: toOptionalStringValue(item.location),
            result: toOptionalStringValue(item.result ?? item.gpa),
            resultType:
              item.resultType === "cgpa-10" ||
              item.resultType === "gpa-4" ||
              item.resultType === "percentage" ||
              item.resultType === "grade" ||
              item.resultType === "not-disclosed"
                ? item.resultType
                : null
          }))
          .filter((item) => Boolean(item.degree?.trim() || item.field?.trim() || item.institution?.trim()))
      : [],
    experience: Array.isArray(value.experience)
      ? value.experience
          .filter((item): item is Record<string, unknown> => isRecord(item))
          .map((item): ResumeData["experience"][number] => {
            const legacyBullets = Array.isArray(item.bullets) ? item.bullets : [];

            return {
            company: toOptionalStringValue(item.company),
            date: normalizeDateField(
              item.date ?? {
                endYear: item.endDate,
                mode: item.current ? "mm-yyyy-present" : "mm-yyyy-range",
                startYear: item.startDate
              },
              "mm-yyyy-range"
            ),
            description: normalizeDescriptionField(isRecord(item.description) ? item.description : legacyBullets.length > 0 ? { bullets: legacyBullets, mode: "bullets" } : item.description, legacyBullets.length > 0 ? "bullets" : "paragraph"),
            isCurrent: typeof item.isCurrent === "boolean" ? item.isCurrent : typeof item.current === "boolean" ? item.current : false,
            location: toOptionalStringValue(item.location),
            role: toOptionalStringValue(item.role)
          };
          })
          .filter((item) => Boolean(item.role?.trim() || item.company?.trim() || item.description.paragraph?.trim() || item.description.bullets.length))
      : [],
    extracurricular: normalizeCustomEntriesSection(value.extracurricular, "extracurricular"),
    header: normalizeHeader(value.header),
    hobbies: normalizeHobbiesSection(value.hobbies),
    languages: normalizeLanguagesSection(value.languages),
    leadership: normalizeCustomEntriesSection(value.leadership, "leadership"),
    meta: {
      createdAt: toStringValue(meta.createdAt) || fallback.meta.createdAt,
      source:
        meta.source === "scratch" || meta.source === "upload" || meta.source === "ai" || meta.source === "import"
          ? meta.source
          : fallback.meta.source,
      updatedAt: toStringValue(meta.updatedAt) || fallback.meta.updatedAt,
      version: toStringValue(meta.version) || fallback.meta.version
    },
    openSource: normalizeCustomEntriesSection(value.openSource, "openSource"),
    projects: Array.isArray(value.projects)
      ? value.projects
          .filter((item): item is Record<string, unknown> => isRecord(item))
          .map((item): ResumeData["projects"][number] => {
            const legacyBullets = Array.isArray(item.bullets) ? item.bullets : [];

            return {
            date: normalizeDateField(
              item.date ?? {
                endYear: item.endDate,
                mode: "mm-yyyy-range",
                startYear: item.startDate
              },
              "mm-yyyy-range"
            ),
            description: normalizeDescriptionField(isRecord(item.description) ? item.description : legacyBullets.length > 0 ? { bullets: legacyBullets, mode: "bullets" } : item.description, legacyBullets.length > 0 ? "bullets" : "paragraph"),
            githubLink: normalizeLinkField(item.githubLink ?? item.link),
            liveLink: normalizeLinkField(item.liveLink),
            technologies: toStringArray(item.technologies),
            title: toOptionalStringValue(item.title)
          };
          })
          .filter((item) => Boolean(item.title?.trim() || item.description.paragraph?.trim() || item.description.bullets.length))
      : [],
    publications: normalizeCustomEntriesSection(value.publications, "publications"),
    skills: normalizeSkillsSection(value.skills),
    summary: isRecord(summaryValue)
      ? {
          content: toOptionalStringValue(summaryValue.content),
          mode: summaryValue.mode === "career-objective" ? "career-objective" : "professional-summary"
        }
      : {
          content: toOptionalStringValue(summaryValue),
          mode: "professional-summary"
        }
  };
}

function normalizeRenderOptions(value: unknown): RenderOptions {
  const fallback = createInitialRenderOptions();

  if (!isRecord(value)) {
    return fallback;
  }

  const pageLimit = value.pageLimit === 2 ? 2 : 1;
  const fontSize = typeof value.fontSize === "number" && Number.isFinite(value.fontSize) ? value.fontSize : fallback.fontSize;
  const maxBulletsPerEntry =
    typeof value.maxBulletsPerEntry === "number" && Number.isFinite(value.maxBulletsPerEntry)
      ? value.maxBulletsPerEntry
      : fallback.maxBulletsPerEntry;

  return {
    fontSize,
    margin: toStringValue(value.margin) || fallback.margin,
    maxBulletsPerEntry,
    pageLimit,
    sectionOrder: normalizeSectionOrder(value.sectionOrder),
    sectionTitles: normalizeSectionTitles(value.sectionTitles),
    templateId: isRenderTemplateId(value.templateId) ? value.templateId : fallback.templateId
  };
}

export function createDefaultWorkspaceSnapshot(): WorkspaceSnapshot {
  return {
    jobDescription: "",
    renderOptions: createInitialRenderOptions(),
    resume: createEmptyResumeData("scratch")
  };
}

export function loadWorkspaceSnapshot(): WorkspaceSnapshot {
  if (typeof window === "undefined") {
    return createDefaultWorkspaceSnapshot();
  }

  try {
    const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);

    if (!raw) {
      return createDefaultWorkspaceSnapshot();
    }

    const parsed = JSON.parse(raw) as Partial<SerializedWorkspaceSnapshot>;

    if (!isRecord(parsed)) {
      window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      return createDefaultWorkspaceSnapshot();
    }

    if (parsed.version !== WORKSPACE_STORAGE_VERSION && parsed.version !== 3) {
      window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      return createDefaultWorkspaceSnapshot();
    }

    return {
      jobDescription: toStringValue(parsed.jobDescription),
      renderOptions: normalizeRenderOptions(parsed.renderOptions),
      resume: normalizeResumeData(parsed.resume)
    };
  } catch {
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    return createDefaultWorkspaceSnapshot();
  }
}

export function saveWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: SerializedWorkspaceSnapshot = {
    ...snapshot,
    savedAt: new Date().toISOString(),
    version: WORKSPACE_STORAGE_VERSION
  };

  try {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    return;
  }
}

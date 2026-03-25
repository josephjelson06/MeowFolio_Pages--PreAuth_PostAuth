import { sampleJobDescription } from "../../data/analysis";
import { createMockResumeData } from "../../data/editor";
import { isRenderTemplateId } from "../../data/templates";
import { createInitialRenderOptions } from "../../lib/tex";
import { createEmptyResumeData, DEFAULT_RESUME_SECTION_ORDER, type RenderOptions, type ResumeData, type ResumeSectionKey } from "../../types/resume";

const WORKSPACE_STORAGE_KEY = "meowfolio.workspace.v1";
const WORKSPACE_STORAGE_VERSION = 1;

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

function normalizeSectionOrder(value: unknown) {
  const allowed = new Set(DEFAULT_RESUME_SECTION_ORDER);
  const cleaned = toStringArray(value).filter((item): item is ResumeSectionKey => allowed.has(item as ResumeSectionKey));

  return cleaned.length > 0 ? cleaned : [...DEFAULT_RESUME_SECTION_ORDER];
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
    templateId: isRenderTemplateId(value.templateId) ? value.templateId : fallback.templateId
  };
}

function normalizeSkills(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  if (value.every((item) => typeof item === "string")) {
    return value;
  }

  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      category: toStringValue(item.category),
      items: toStringArray(item.items)
    }))
    .filter((item) => item.category || item.items.length > 0);
}

function normalizeCompactSection(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      date: toOptionalStringValue(item.date),
      description: toOptionalStringValue(item.description),
      link: toOptionalStringValue(item.link)
    }));
}

function normalizeResumeData(value: unknown): ResumeData {
  const fallback = createEmptyResumeData("scratch");

  if (!isRecord(value)) {
    return createMockResumeData();
  }

  const header = isRecord(value.header) ? value.header : {};
  const meta = isRecord(value.meta) ? value.meta : {};

  return {
    awards: normalizeCompactSection(value.awards),
    certifications: normalizeCompactSection(value.certifications),
    education: Array.isArray(value.education)
      ? value.education
          .filter((item): item is Record<string, unknown> => isRecord(item))
          .map((item) => ({
            degree: toOptionalStringValue(item.degree),
            endYear: toOptionalStringValue(item.endYear),
            field: toOptionalStringValue(item.field),
            gpa: toOptionalStringValue(item.gpa),
            institution: toOptionalStringValue(item.institution),
            location: toOptionalStringValue(item.location),
            startYear: toOptionalStringValue(item.startYear)
          }))
      : [],
    experience: Array.isArray(value.experience)
      ? value.experience
          .filter((item): item is Record<string, unknown> => isRecord(item))
          .map((item) => ({
            bullets: toStringArray(item.bullets),
            company: toOptionalStringValue(item.company),
            current: typeof item.current === "boolean" ? item.current : false,
            description: toOptionalStringValue(item.description),
            endDate: toOptionalStringValue(item.endDate),
            id: toOptionalStringValue(item.id),
            location: toOptionalStringValue(item.location),
            role: toOptionalStringValue(item.role),
            startDate: toOptionalStringValue(item.startDate)
          }))
      : [],
    extracurricular: normalizeCompactSection(value.extracurricular),
    header: {
      email: toOptionalStringValue(header.email),
      github: toOptionalStringValue(header.github),
      linkedin: toOptionalStringValue(header.linkedin),
      location: toOptionalStringValue(header.location),
      name: toOptionalStringValue(header.name),
      phone: toOptionalStringValue(header.phone),
      portfolio: toOptionalStringValue(header.portfolio),
      title: toOptionalStringValue(header.title),
      website: toOptionalStringValue(header.website)
    },
    leadership: normalizeCompactSection(value.leadership),
    meta: {
      createdAt: toStringValue(meta.createdAt) || fallback.meta.createdAt,
      source:
        meta.source === "scratch" || meta.source === "upload" || meta.source === "ai" || meta.source === "import"
          ? meta.source
          : fallback.meta.source,
      updatedAt: toStringValue(meta.updatedAt) || fallback.meta.updatedAt,
      version: toStringValue(meta.version) || fallback.meta.version
    },
    projects: Array.isArray(value.projects)
      ? value.projects
          .filter((item): item is Record<string, unknown> => isRecord(item))
          .map((item) => ({
            bullets: toStringArray(item.bullets),
            description: toOptionalStringValue(item.description),
            endDate: toOptionalStringValue(item.endDate),
            link: toOptionalStringValue(item.link),
            startDate: toOptionalStringValue(item.startDate),
            technologies: toStringArray(item.technologies),
            title: toOptionalStringValue(item.title)
          }))
      : [],
    skills: normalizeSkills(value.skills),
    summary: toOptionalStringValue(value.summary)
  };
}

export function createDefaultWorkspaceSnapshot(): WorkspaceSnapshot {
  return {
    jobDescription: sampleJobDescription,
    renderOptions: createInitialRenderOptions(),
    resume: createMockResumeData()
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

    if (!isRecord(parsed) || parsed.version !== WORKSPACE_STORAGE_VERSION) {
      window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      return createDefaultWorkspaceSnapshot();
    }

    return {
      jobDescription: toStringValue(parsed.jobDescription) || sampleJobDescription,
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

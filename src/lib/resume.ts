import {
  MONTH_OPTIONS,
  createEmptyDescriptionField,
  type DateField,
  type DescriptionField,
  type LanguageItem,
  type LinkField,
  type ResumeData,
  type SkillGroup,
  type SkillsSection
} from "../types/resume";

function normalizeYear(value?: string | null) {
  return value?.trim() ?? "";
}

function normalizeMonth(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return MONTH_OPTIONS.includes(trimmed as (typeof MONTH_OPTIONS)[number]) ? trimmed : "";
}

function formatMonthYear(month?: string | null, year?: string | null) {
  const safeMonth = normalizeMonth(month);
  const safeYear = normalizeYear(year);

  if (safeMonth && safeYear) {
    return `${safeMonth} ${safeYear}`;
  }

  return safeYear || safeMonth;
}

export function getLinkLabel(link?: LinkField | null) {
  if (!link) {
    return "";
  }

  if (link.displayMode === "hyperlinked-text" && link.displayText?.trim()) {
    return link.displayText.trim();
  }

  return link.url?.trim() ?? "";
}

export function getLinkUrl(link?: LinkField | null) {
  return link?.url?.trim() ?? "";
}

export function hasLinkValue(link?: LinkField | null) {
  return Boolean(getLinkUrl(link));
}

export function formatDateField(date?: DateField | null) {
  if (!date) {
    return "";
  }

  switch (date.mode) {
    case "mm-yyyy":
      return formatMonthYear(date.startMonth, date.startYear);
    case "yyyy":
      return normalizeYear(date.startYear);
    case "mm-yyyy-range": {
      const start = formatMonthYear(date.startMonth, date.startYear);
      const end = formatMonthYear(date.endMonth, date.endYear);
      return [start, end].filter(Boolean).join(" - ");
    }
    case "yyyy-range": {
      const start = normalizeYear(date.startYear);
      const end = normalizeYear(date.endYear);
      return [start, end].filter(Boolean).join(" - ");
    }
    case "mm-yyyy-present": {
      const start = formatMonthYear(date.startMonth, date.startYear);
      return start ? `${start} - Present` : "Present";
    }
    case "yyyy-present": {
      const start = normalizeYear(date.startYear);
      return start ? `${start} - Present` : "Present";
    }
    default:
      return "";
  }
}

export function getResumeContactLines(resume: ResumeData) {
  const { header } = resume;
  const items = [
    header.address,
    header.email,
    header.phone,
    getLinkLabel(header.linkedin),
    getLinkLabel(header.github),
    getLinkLabel(header.website)
  ]
    .filter((item): item is string => Boolean(item && item.trim()))
    .map((item) => item.trim());
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function getSummaryText(resume: ResumeData) {
  return resume.summary.content?.trim() ?? "";
}

export function getProfileLabel(resume: ResumeData) {
  return resume.summary.mode === "career-objective" ? "Career Objective" : "Professional Summary";
}

export function splitLineItems(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function splitDelimitedItems(value: string) {
  return value
    .split(/[\r\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function skillsToText(skills: SkillsSection) {
  if (skills.mode === "grouped") {
    return skills.groups.map((group) => `${group.groupLabel ?? ""}: ${group.items.join(", ")}`.trim()).join("\n");
  }

  return skills.items.join("\n");
}

export function textToSkills(value: string): SkillsSection {
  const lines = splitLineItems(value);
  const hasCategories = lines.some((line) => line.includes(":"));

  if (!hasCategories) {
    return {
      groups: [],
      items: splitDelimitedItems(value),
      mode: "csv"
    };
  }

  const groups: SkillGroup[] = [];
  const items: string[] = [];

  lines.forEach((line) => {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      items.push(...splitDelimitedItems(line));
      return;
    }

    const groupLabel = line.slice(0, separatorIndex).trim();
    const groupItems = splitDelimitedItems(line.slice(separatorIndex + 1));

    if (groupLabel && groupItems.length > 0) {
      groups.push({ groupLabel, items: groupItems });
      return;
    }

    items.push(...groupItems);
  });

  if (items.length > 0) {
    groups.unshift({ groupLabel: "General", items });
  }

  return {
    groups,
    items: [],
    mode: "grouped"
  };
}

export function flattenSkills(skills: SkillsSection) {
  if (skills.mode === "grouped") {
    return skills.groups.flatMap((group) => group.items.map((item) => item.trim()).filter(Boolean));
  }

  return skills.items.map((item) => item.trim()).filter(Boolean);
}

export function languagesToText(items: LanguageItem[]) {
  return items
    .map((item) => {
      const language = item.language?.trim() ?? "";
      const proficiency = item.proficiency?.trim() ?? "";

      if (!language) {
        return "";
      }

      return proficiency ? `${language}: ${proficiency}` : language;
    })
    .filter(Boolean)
    .join("\n");
}

export function descriptionToText(description: DescriptionField) {
  return description.mode === "paragraph"
    ? description.paragraph?.trim() ?? ""
    : description.bullets.join("\n");
}

export function textToDescription(value: string, mode: DescriptionField["mode"] = "bullets"): DescriptionField {
  if (mode === "paragraph") {
    return {
      ...createEmptyDescriptionField("paragraph"),
      paragraph: value
    };
  }

  return {
    ...createEmptyDescriptionField("bullets"),
    bullets: splitLineItems(value)
  };
}

export function flattenDescriptionLines(description: DescriptionField) {
  return description.mode === "paragraph"
    ? splitLineItems(description.paragraph ?? "")
    : description.bullets.map((bullet) => bullet.trim()).filter(Boolean);
}

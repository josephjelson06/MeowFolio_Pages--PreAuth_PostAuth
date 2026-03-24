import { areSkillsGrouped, type ResumeData, type ResumeSkills, type SkillCategory } from "../types/resume";

export function getResumeContactLines(resume: ResumeData) {
  const { header } = resume;

  return [header.location, header.email, header.phone, header.website].filter(
    (item): item is string => Boolean(item && item.trim())
  );
}

export function formatDateRange(startDate?: string | null, endDate?: string | null, current?: boolean) {
  const endLabel = current ? "Present" : endDate;
  return [startDate, endLabel].filter(Boolean).join(" - ");
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

export function skillsToText(skills: ResumeSkills) {
  if (areSkillsGrouped(skills)) {
    return skills.map((group) => `${group.category}: ${group.items.join(", ")}`).join("\n");
  }

  return skills.join("\n");
}

export function textToSkills(value: string): ResumeSkills {
  const lines = splitLineItems(value);
  const hasCategories = lines.some((line) => line.includes(":"));

  if (!hasCategories) {
    return splitDelimitedItems(value);
  }

  const groupedSkills: SkillCategory[] = [];
  const generalItems: string[] = [];

  lines.forEach((line) => {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      generalItems.push(...splitDelimitedItems(line));
      return;
    }

    const category = line.slice(0, separatorIndex).trim();
    const items = splitDelimitedItems(line.slice(separatorIndex + 1));

    if (category && items.length > 0) {
      groupedSkills.push({ category, items });
      return;
    }

    if (items.length > 0) {
      generalItems.push(...items);
    }
  });

  if (generalItems.length > 0) {
    groupedSkills.push({ category: "General", items: generalItems });
  }

  return groupedSkills;
}

export function flattenSkills(skills: ResumeSkills) {
  return areSkillsGrouped(skills) ? skills.flatMap((group) => group.items) : skills;
}

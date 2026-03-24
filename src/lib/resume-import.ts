import {
  createEmptyResumeData,
  type CompactItem,
  type EducationItem,
  type ExperienceItem,
  type ProjectItem,
  type ResumeData,
  type ResumeSectionKey
} from "../types/resume";
import type { ResumeImportResult, ResumeImportSummary } from "../types/import";
import { textToSkills } from "./resume";

const SECTION_ALIASES: Record<ResumeSectionKey, string[]> = {
  summary: ["summary", "professional summary", "profile", "objective", "about"],
  skills: ["skills", "technical skills", "core competencies", "competencies", "technologies", "tech stack"],
  education: ["education", "academic background", "academics"],
  experience: ["experience", "work experience", "professional experience", "employment history", "career history"],
  projects: ["projects", "selected projects", "project experience", "personal projects"],
  certifications: ["certifications", "certificates", "licenses", "licenses and certifications"],
  awards: ["awards", "honors", "honours", "achievements"],
  leadership: ["leadership", "leadership experience"],
  extracurricular: ["extracurricular", "activities", "volunteering", "volunteer experience", "community involvement"]
};

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_REGEX = /(?:\+?\d[\d().\-\s]{7,}\d)/;
const URLISH_REGEX = /(?:https?:\/\/)?(?:www\.)?[A-Za-z0-9-]+\.[A-Za-z]{2,}(?:\/[^\s]*)?/i;
const DATE_RANGE_REGEX =
  /\b((?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?\d{4})\s*(?:-|–|—|to)\s*(present|current|now|(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?\d{4})\b/i;
const YEAR_REGEX = /\b(19|20)\d{2}\b/g;
const INSTITUTION_REGEX = /\b(university|college|institute|school|academy|polytechnic)\b/i;
const DEGREE_REGEX = /\b(b\.?s\.?|bachelor|m\.?s\.?|master|mba|ph\.?d\.?|doctor|associate|diploma|certificate|b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?|b\.?des|m\.?des)\b/i;
const PAGE_MARKER_REGEX = /^(?:--\s*)?\d+\s+of\s+\d+(?:\s*--)?$/i;

function normalizeLine(value: string) {
  return value
    .replace(/\t/g, " ")
    .replace(/[•●▪◦]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeading(value: string) {
  return normalizeLine(value)
    .toLowerCase()
    .replace(/[:]/g, "")
    .replace(/[^\w\s]/g, "")
    .trim();
}

function findSectionKey(value: string): ResumeSectionKey | null {
  const normalized = normalizeHeading(value);

  for (const [section, aliases] of Object.entries(SECTION_ALIASES) as Array<[ResumeSectionKey, string[]]>) {
    if (aliases.includes(normalized)) {
      return section;
    }
  }

  return null;
}

function isNoiseLine(value: string) {
  const normalized = normalizeLine(value);
  return PAGE_MARKER_REGEX.test(normalized) || /^page\s+\d+\s+of\s+\d+$/i.test(normalized);
}

function splitBlocks(lines: string[]) {
  const blocks: string[][] = [];
  let current: string[] = [];

  lines.forEach((line) => {
    const normalized = normalizeLine(line);

    if (!normalized) {
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }

      return;
    }

    current.push(normalized);
  });

  if (current.length > 0) {
    blocks.push(current);
  }

  return blocks;
}

function splitInlineParts(line: string) {
  return normalizeLine(line)
    .split(/\s*(?:\||·|•)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isBulletLine(line: string) {
  return /^[-*]\s+/.test(line);
}

function stripBulletMarker(line: string) {
  return line.replace(/^[-*]\s+/, "").trim();
}

function looksLikeContactLine(line: string) {
  return EMAIL_REGEX.test(line) || PHONE_REGEX.test(line) || /(linkedin|github|portfolio|https?:\/\/|www\.)/i.test(line) || /[|·•]/.test(line);
}

function cleanupMetadataText(value: string) {
  return value.replace(/^[|,\-–—\s]+|[|,\-–—\s]+$/g, "").trim();
}

function extractDateRange(value: string) {
  const match = value.match(DATE_RANGE_REGEX);

  if (!match) {
    return {
      cleaned: cleanupMetadataText(value),
      current: false,
      endDate: "",
      startDate: ""
    };
  }

  const endLabel = match[2].trim();

  return {
    cleaned: cleanupMetadataText(value.replace(match[0], " ")),
    current: /^(present|current|now)$/i.test(endLabel),
    endDate: /^(present|current|now)$/i.test(endLabel) ? "" : endLabel,
    startDate: match[1].trim()
  };
}

function assignLinkToken(token: string, header: ResumeData["header"]) {
  const normalized = token.trim();

  if (!normalized) {
    return;
  }

  if (/linkedin/i.test(normalized)) {
    header.linkedin = normalized;
    return;
  }

  if (/github/i.test(normalized)) {
    header.github = normalized;
    return;
  }

  if (/portfolio/i.test(normalized) && !header.portfolio) {
    header.portfolio = normalized;
    return;
  }

  if (!header.website) {
    header.website = normalized;
    return;
  }

  if (!header.portfolio) {
    header.portfolio = normalized;
  }
}

function parseIntro(introLines: string[], resume: ResumeData, warnings: string[]) {
  const lines = introLines.map(normalizeLine).filter(Boolean);

  if (lines.length === 0) {
    warnings.push("No clear header block was detected before section headings.");
    return;
  }

  resume.header.name = lines[0];

  const remaining = [...lines.slice(1)];
  const titleIndex = remaining.findIndex((line) => !looksLikeContactLine(line));

  if (titleIndex >= 0) {
    resume.header.title = remaining[titleIndex];
    remaining.splice(titleIndex, 1);
  }

  const leftoverTokens: string[] = [];

  remaining.forEach((line) => {
    const tokens = splitInlineParts(line);
    const parts = tokens.length > 1 ? tokens : [normalizeLine(line)];

    parts.forEach((part) => {
      let working = part.trim();

      if (!working) {
        return;
      }

      if (!resume.header.email) {
        const email = working.match(EMAIL_REGEX)?.[0];

        if (email) {
          resume.header.email = email;
          working = working.replace(email, " ").trim();
        }
      }

      if (!resume.header.phone) {
        const phone = working.match(PHONE_REGEX)?.[0];

        if (phone) {
          resume.header.phone = phone.trim();
          working = working.replace(phone, " ").trim();
        }
      }

      const urlMatch = working.match(URLISH_REGEX)?.[0];

      if (urlMatch || /(linkedin|github|portfolio)/i.test(working)) {
        assignLinkToken(urlMatch ?? working, resume.header);
        working = urlMatch ? working.replace(urlMatch, " ").trim() : "";
      }

      const cleaned = cleanupMetadataText(working);

      if (cleaned) {
        leftoverTokens.push(cleaned);
      }
    });
  });

  if (!resume.header.location && leftoverTokens.length > 0) {
    resume.header.location = leftoverTokens.join(" | ");
  }
}

function parseSummary(lines: string[]) {
  return lines.map(normalizeLine).filter(Boolean).join(" ");
}

function parseSkills(lines: string[]) {
  return textToSkills(lines.map(normalizeLine).filter(Boolean).join("\n"));
}

function parseExperienceHeading(line: string) {
  if (!line) {
    return { company: "", location: "", role: "" };
  }

  if (/\sat\s/i.test(line)) {
    const [role, company] = line.split(/\sat\s/i, 2);
    return {
      company: cleanupMetadataText(company?.trim() ?? ""),
      location: "",
      role: role?.trim() ?? ""
    };
  }

  const parts = splitInlineParts(line);

  if (parts.length >= 2) {
    return {
      company: parts[1] ?? "",
      location: parts.slice(2).join(" | "),
      role: parts[0] ?? ""
    };
  }

  return {
    company: "",
    location: "",
    role: line
  };
}

function parseExperience(lines: string[]) {
  return splitBlocks(lines)
    .map((block, index): ExperienceItem | null => {
      const bullets = block.filter(isBulletLine).map(stripBulletMarker);
      const textLines = block.filter((line) => !isBulletLine(line));

      if (textLines.length === 0 && bullets.length === 0) {
        return null;
      }

      const headingLine = textLines[0] ?? "";
      const metadataCandidate = textLines[1] ?? "";
      const headingDate = extractDateRange(headingLine);
      const metadataDate = extractDateRange(metadataCandidate);
      const headingParts = parseExperienceHeading(headingDate.cleaned);

      const descriptionLines =
        textLines.length <= 2
          ? textLines.slice(headingDate.cleaned === headingLine ? 1 : 0).filter((line) => line !== metadataCandidate)
          : textLines.slice(2);

      const role = headingParts.role;
      let company = headingParts.company;
      let location = headingParts.location;
      let startDate = headingDate.startDate;
      let endDate = headingDate.endDate;
      let current = headingDate.current;

      if (metadataCandidate) {
        const metadataParts = splitInlineParts(metadataDate.cleaned);

        if (!startDate && metadataDate.startDate) {
          startDate = metadataDate.startDate;
          endDate = metadataDate.endDate;
          current = metadataDate.current;
        }

        if (!company && metadataParts.length > 0) {
          company = metadataParts[0] ?? "";
        }

        if (!location && metadataParts.length > 1) {
          location = metadataParts.slice(1).join(" | ");
        } else if (!location && metadataDate.cleaned && metadataParts.length === 0 && !DATE_RANGE_REGEX.test(metadataCandidate)) {
          location = metadataDate.cleaned;
        }
      }

      const description = descriptionLines.join(" ");

      if (!role && !company && !description && bullets.length === 0) {
        return null;
      }

      return {
        bullets,
        company,
        current,
        description,
        endDate,
        id: `import-experience-${index + 1}`,
        location,
        role,
        startDate
      };
    })
    .filter((item): item is ExperienceItem => Boolean(item));
}

function parseEducation(lines: string[]) {
  return splitBlocks(lines)
    .map((block): EducationItem | null => {
      const combined = block.join(" | ");
      const gpaMatch = combined.match(/\bGPA[:\s]+([0-9.\/]+)\b/i);
      const dateMatch = combined.match(DATE_RANGE_REGEX);
      const yearValues = Array.from(combined.matchAll(YEAR_REGEX)).map((match) => match[0]);
      const cleanedParts = splitInlineParts(
        cleanupMetadataText(
          combined
            .replace(gpaMatch?.[0] ?? "", " ")
            .replace(dateMatch?.[0] ?? "", " ")
        )
      );

      let degree = "";
      let field = "";
      let institution = "";
      let location = "";

      cleanedParts.forEach((part) => {
        if (!institution && INSTITUTION_REGEX.test(part)) {
          institution = part;
          return;
        }

        if (!degree && DEGREE_REGEX.test(part)) {
          degree = part;
          return;
        }

        if (!field && degree && part !== institution) {
          field = part;
          return;
        }

        if (!location) {
          location = part;
        }
      });

      if (!degree && cleanedParts.length > 0) {
        degree = cleanedParts[0] ?? "";
      }

      if (!institution && cleanedParts.length > 1) {
        institution = cleanedParts[1] ?? "";
      }

      if (!degree && !institution) {
        return null;
      }

      return {
        degree,
        endYear:
          dateMatch?.[2] && !/^(present|current|now)$/i.test(dateMatch[2])
            ? dateMatch[2]
            : yearValues[yearValues.length - 1] ?? "",
        field,
        gpa: gpaMatch?.[1] ?? "",
        institution,
        location,
        startYear: dateMatch?.[1] ?? yearValues[0] ?? ""
      };
    })
    .filter((item): item is EducationItem => Boolean(item));
}

function parseProjects(lines: string[]) {
  return splitBlocks(lines)
    .map((block): ProjectItem | null => {
      const bullets = block.filter(isBulletLine).map(stripBulletMarker);
      const textLines = block.filter((line) => !isBulletLine(line));

      if (textLines.length === 0 && bullets.length === 0) {
        return null;
      }

      const firstLine = textLines[0] ?? "";
      const firstLineDates = extractDateRange(firstLine);
      const titleParts = splitInlineParts(firstLineDates.cleaned);
      const title = titleParts[0] ?? firstLineDates.cleaned;
      const technologiesLine = textLines.find((line) => /\b(technologies|tech stack|stack|tools)[:]/i.test(line));
      const technologiesMatch = technologiesLine?.match(/\b(?:technologies|tech stack|stack|tools)[:]\s*(.+)$/i);
      const technologies = technologiesMatch
        ? technologiesMatch[1]
            .split(/[,\|]/)
            .map((item) => item.trim())
            .filter(Boolean)
        : [];
      const linkLine = textLines.find((line) => URLISH_REGEX.test(line) || /(github|demo|portfolio)/i.test(line));
      const link = linkLine?.match(URLISH_REGEX)?.[0] ?? "";
      const description = textLines
        .slice(1)
        .filter((line) => line !== technologiesLine && line !== linkLine)
        .join(" ");

      if (!title && bullets.length === 0) {
        return null;
      }

      return {
        bullets,
        description,
        endDate: firstLineDates.endDate,
        link,
        startDate: firstLineDates.startDate,
        technologies,
        title
      };
    })
    .filter((item): item is ProjectItem => Boolean(item));
}

function parseCompactItems(lines: string[]) {
  const blocks = splitBlocks(lines);
  const sourceBlocks = blocks.length > 0 ? blocks : lines.filter((line) => normalizeLine(line)).map((line) => [line]);

  return sourceBlocks
    .map((block): CompactItem | null => {
      const combined = block.map(normalizeLine).filter(Boolean).join(" | ");

      if (!combined) {
        return null;
      }

      const dateInfo = extractDateRange(combined);
      const link = combined.match(URLISH_REGEX)?.[0] ?? "";
      const description = cleanupMetadataText(
        dateInfo.cleaned.replace(link, " ").replace(/\s+/g, " ")
      );

      return {
        date: dateInfo.startDate
          ? [dateInfo.startDate, dateInfo.current ? "Present" : dateInfo.endDate].filter(Boolean).join(" - ")
          : "",
        description,
        link
      };
    })
    .filter((item): item is CompactItem => Boolean(item && item.description));
}

function countSkills(resume: ResumeData) {
  return Array.isArray(resume.skills)
    ? resume.skills.reduce((total, item) => total + (typeof item === "string" ? 1 : item.items.length), 0)
    : 0;
}

function hasImportedContent(resume: ResumeData) {
  return Boolean(
    resume.header.name ||
      resume.summary ||
      resume.experience.length ||
      resume.education.length ||
      resume.projects.length ||
      countSkills(resume)
  );
}

export function importResumeFromText(value: string): ResumeImportResult {
  const resume = createEmptyResumeData("import");
  const warnings: string[] = [];
  const normalizedLines = value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => !isNoiseLine(line));
  const intro: string[] = [];
  const sectionLines: Partial<Record<ResumeSectionKey, string[]>> = {};
  const detectedSections: ResumeSectionKey[] = [];
  let activeSection: ResumeSectionKey | null = null;

  normalizedLines.forEach((line) => {
    const sectionKey = findSectionKey(line);

    if (sectionKey) {
      activeSection = sectionKey;

      if (!detectedSections.includes(sectionKey)) {
        detectedSections.push(sectionKey);
      }

      if (!sectionLines[sectionKey]) {
        sectionLines[sectionKey] = [];
      }

      return;
    }

    if (activeSection) {
      sectionLines[activeSection]!.push(line);
      return;
    }

    intro.push(line);
  });

  parseIntro(intro, resume, warnings);

  if (sectionLines.summary) {
    resume.summary = parseSummary(sectionLines.summary);
  }

  if (sectionLines.skills) {
    resume.skills = parseSkills(sectionLines.skills);
  }

  if (sectionLines.experience) {
    resume.experience = parseExperience(sectionLines.experience);
  }

  if (sectionLines.education) {
    resume.education = parseEducation(sectionLines.education);
  }

  if (sectionLines.projects) {
    resume.projects = parseProjects(sectionLines.projects);
  }

  if (sectionLines.certifications) {
    resume.certifications = parseCompactItems(sectionLines.certifications);
  }

  if (sectionLines.awards) {
    resume.awards = parseCompactItems(sectionLines.awards);
  }

  if (sectionLines.leadership) {
    resume.leadership = parseCompactItems(sectionLines.leadership);
  }

  if (sectionLines.extracurricular) {
    resume.extracurricular = parseCompactItems(sectionLines.extracurricular);
  }

  if (detectedSections.length === 0) {
    warnings.push("No explicit section headings were detected. Review the imported content carefully.");
  }

  if (sectionLines.skills && countSkills(resume) === 0) {
    warnings.push("A skills section was detected, but no skills were extracted from it.");
  }

  if (sectionLines.experience && resume.experience.length === 0) {
    warnings.push("An experience section was detected, but the entries need manual cleanup.");
  }

  if (!hasImportedContent(resume)) {
    warnings.push("No structured resume content could be imported from the pasted text.");
  }

  return {
    resume,
    summary: {
      detectedSections,
      educationCount: resume.education.length,
      experienceCount: resume.experience.length,
      projectCount: resume.projects.length,
      skillCount: countSkills(resume)
    },
    warnings
  };
}

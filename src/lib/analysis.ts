import type { AtsAnalysisResult, JdAnalysisResult, KeywordBreakdown } from "../types/analysis";
import type { RenderOptions, ResumeData, ResumeSectionKey } from "../types/resume";
import { flattenSkills, getResumeContactLines } from "./resume";

const STOPWORDS = new Set([
  "a",
  "about",
  "across",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "build",
  "building",
  "by",
  "candidate",
  "collaborate",
  "collaborating",
  "closely",
  "company",
  "consumer",
  "cross",
  "crossfunctional",
  "design",
  "designer",
  "develop",
  "drive",
  "end-to-end",
  "endtoend",
  "experience",
  "familiarity",
  "for",
  "from",
  "have",
  "help",
  "improve",
  "improvement",
  "in",
  "into",
  "is",
  "job",
  "lead",
  "looking",
  "modern",
  "must",
  "on",
  "or",
  "our",
  "partner",
  "presentation",
  "proficiency",
  "product",
  "requirements",
  "role",
  "senior",
  "shape",
  "skills",
  "scale",
  "strong",
  "team",
  "teams",
  "that",
  "the",
  "their",
  "this",
  "to",
  "use",
  "we",
  "will",
  "with",
  "work",
  "worked",
  "working",
  "workflows",
  "years",
  "you",
  "your"
]);

const SHORT_TOKEN_ALLOWLIST = new Set(["ai", "ml", "qa", "sql", "ui", "ux"]);
const ACTION_VERBS = [
  "built",
  "created",
  "delivered",
  "designed",
  "drove",
  "executed",
  "improved",
  "increased",
  "launched",
  "led",
  "optimized",
  "reduced",
  "shipped"
];

const SECTION_LABELS: Record<ResumeSectionKey | "header", string> = {
  awards: "Awards",
  certifications: "Certifications",
  education: "Education",
  experience: "Experience",
  extracurricular: "Extracurricular",
  header: "Header",
  leadership: "Leadership",
  projects: "Projects",
  skills: "Skills",
  summary: "Summary"
};

type SectionEntryMap = Record<ResumeSectionKey, string[]>;

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function wordCount(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function normalizeToken(token: string) {
  return token
    .toLowerCase()
    .replace(/^[^a-z0-9+#./-]+|[^a-z0-9+#./-]+$/g, "")
    .replace(/^[./-]+|[./-]+$/g, "");
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#./-\s]+/g, " ");
}

function stemToken(token: string) {
  const normalized = normalizeToken(token);

  if (normalized.length <= 4) {
    return normalized;
  }

  return normalized.replace(/(ing|ed|es|s)$/i, "");
}

function titleizeKeyword(keyword: string) {
  if (keyword.length <= 3) {
    return keyword.toUpperCase();
  }

  return keyword
    .split(/[\s/-]+/)
    .map((part) => (part.length <= 3 ? part.toUpperCase() : `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`))
    .join(" ");
}

function getResumeSectionsCount(resume: ResumeData) {
  return [
    resume.summary?.trim(),
    flattenSkills(resume.skills).length > 0,
    resume.education.length > 0,
    resume.experience.length > 0,
    resume.projects.length > 0,
    resume.certifications.length > 0,
    resume.awards.length > 0,
    resume.leadership.length > 0,
    resume.extracurricular.length > 0
  ].filter(Boolean).length;
}

function getResumeBullets(resume: ResumeData) {
  return [...resume.experience.flatMap((item) => item.bullets), ...resume.projects.flatMap((item) => item.bullets)]
    .map((bullet) => bullet.trim())
    .filter(Boolean);
}

function collectResumeText(resume: ResumeData) {
  return normalizeText(
    [
      resume.header.name,
      resume.header.title,
      resume.header.location,
      resume.header.email,
      resume.header.linkedin,
      resume.header.github,
      resume.header.website,
      resume.header.portfolio,
      resume.summary,
      ...flattenSkills(resume.skills),
      ...resume.experience.flatMap((item) => [item.role, item.company, item.location, item.description, ...item.bullets]),
      ...resume.education.flatMap((item) => [item.degree, item.field, item.institution, item.location]),
      ...resume.projects.flatMap((item) => [item.title, item.description, item.link, ...item.technologies, ...item.bullets]),
      ...resume.certifications.map((item) => item.description),
      ...resume.awards.map((item) => item.description),
      ...resume.leadership.map((item) => item.description),
      ...resume.extracurricular.map((item) => item.description)
    ]
      .filter((value): value is string => Boolean(value && value.trim()))
      .join(" ")
  );
}

function extractKeywords(value: string, limit = 24) {
  const matches = normalizeText(value).match(/[a-z0-9+#./-]+/g) ?? [];
  const counts = new Map<string, number>();

  matches.forEach((match) => {
    const token = normalizeToken(match);

    if (!token) {
      return;
    }

    if (!SHORT_TOKEN_ALLOWLIST.has(token) && token.length < 4) {
      return;
    }

    if (STOPWORDS.has(token)) {
      return;
    }

    counts.set(token, (counts.get(token) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return right[0].length - left[0].length;
    })
    .slice(0, limit)
    .map(([token]) => token);
}

function summarizeRating(score: number) {
  if (score >= 85) {
    return "Strong";
  }

  if (score >= 70) {
    return "Solid";
  }

  if (score >= 55) {
    return "Needs Work";
  }

  return "Weak";
}

function buildJdSummary(score: number, totalKeywords: number) {
  if (totalKeywords === 0) {
    return {
      summaryCopy: "Paste a job description to compare your imported resume against role-specific requirements.",
      summaryTitle: "Add a job description to start"
    };
  }

  if (score >= 85) {
    return {
      summaryCopy:
        "The current resume language overlaps strongly with the role. Focus next on sharpening the strongest evidence and quantified outcomes.",
      summaryTitle: "Strong role alignment"
    };
  }

  if (score >= 70) {
    return {
      summaryCopy:
        "The resume is already aligned with the job description, but a few missing terms are holding back the match score.",
      summaryTitle: "Good match with room to sharpen"
    };
  }

  if (score >= 55) {
    return {
      summaryCopy:
        "There is clear overlap, but the resume still needs stronger language around the target role's required skills and responsibilities.",
      summaryTitle: "Partial match so far"
    };
  }

  return {
    summaryCopy:
      "The resume and job description are not aligned yet. Start by surfacing the exact skills and responsibilities that genuinely match your background.",
    summaryTitle: "Low match right now"
  };
}

function parseMarginToCentimeters(value: string) {
  const trimmed = value.trim().toLowerCase();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)(cm|mm|in)$/);

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (unit === "cm") {
    return amount;
  }

  if (unit === "mm") {
    return amount / 10;
  }

  return amount * 2.54;
}

function buildSectionEntryMap(resume: ResumeData): SectionEntryMap {
  return {
    awards: resume.awards.map((item) => item.description ?? "").filter(Boolean),
    certifications: resume.certifications.map((item) => item.description ?? "").filter(Boolean),
    education: resume.education
      .map((item) => [item.degree, item.field, item.institution, item.location].filter(Boolean).join(" | "))
      .filter(Boolean),
    experience: resume.experience
      .map((item) => [item.role, item.company, item.location, item.description, ...item.bullets].filter(Boolean).join(" | "))
      .filter(Boolean),
    extracurricular: resume.extracurricular.map((item) => item.description ?? "").filter(Boolean),
    leadership: resume.leadership.map((item) => item.description ?? "").filter(Boolean),
    projects: resume.projects
      .map((item) => [item.title, item.description, item.link, ...item.technologies, ...item.bullets].filter(Boolean).join(" | "))
      .filter(Boolean),
    skills: flattenSkills(resume.skills),
    summary: resume.summary?.trim() ? [resume.summary.trim()] : []
  };
}

function truncateEvidence(value: string) {
  const trimmed = value.replace(/\s+/g, " ").trim();

  if (trimmed.length <= 120) {
    return trimmed;
  }

  return `${trimmed.slice(0, 117).trim()}...`;
}

function buildKeywordBreakdown(keywords: string[], entries: SectionEntryMap): KeywordBreakdown[] {
  const breakdown: KeywordBreakdown[] = [];
  const normalizedEntries = Object.fromEntries(
    (Object.entries(entries) as Array<[ResumeSectionKey, string[]]>).map(([section, sectionEntries]) => [
      section,
      sectionEntries.map((entry) => ({
        normalized: normalizeText(entry),
        raw: entry,
        stems: new Set((normalizeText(entry).match(/[a-z0-9+#./-]+/g) ?? []).map((token) => stemToken(token)))
      }))
    ])
  ) as Record<
    ResumeSectionKey,
    Array<{
      normalized: string;
      raw: string;
      stems: Set<string>;
    }>
  >;

  keywords.forEach((keyword) => {
    const normalizedKeyword = normalizeToken(keyword);
    const stemmedKeyword = stemToken(normalizedKeyword);
    let partialMatch: KeywordBreakdown | null = null;

    for (const [section, sectionEntries] of Object.entries(normalizedEntries) as Array<[ResumeSectionKey, typeof normalizedEntries[ResumeSectionKey]]>) {
      for (const entry of sectionEntries) {
        if (entry.normalized.includes(normalizedKeyword)) {
          breakdown.push({
            evidence: truncateEvidence(entry.raw),
            keyword: normalizedKeyword,
            section,
            status: "matched"
          });
          return;
        }

        if (!partialMatch && (entry.stems.has(stemmedKeyword) || Array.from(entry.stems).some((token) => token.startsWith(stemmedKeyword)))) {
          partialMatch = {
            evidence: truncateEvidence(entry.raw),
            keyword: normalizedKeyword,
            section,
            status: "partial"
          };
        }
      }
    }

    breakdown.push(
      partialMatch ?? {
        evidence: null,
        keyword: normalizedKeyword,
        section: null,
        status: "missing"
      }
    );
  });

  return breakdown;
}

function buildAtsSectionSignals(resume: ResumeData) {
  const summaryWords = wordCount(resume.summary ?? "");
  const skillsCount = flattenSkills(resume.skills).length;
  const experienceBullets = resume.experience.flatMap((item) => item.bullets).filter((bullet) => bullet.trim()).length;
  const projectBullets = resume.projects.flatMap((item) => item.bullets).filter((bullet) => bullet.trim()).length;

  return [
    {
      detail:
        resume.header.name?.trim() && resume.header.email?.trim()
          ? "The header exposes the essential identity and contact signals ATS parsers look for first."
          : "Add missing top-level contact details so the resume header is complete and easy to parse.",
      section: "header" as const,
      status: resume.header.name?.trim() && resume.header.email?.trim() ? ("strong" as const) : ("needs-work" as const)
    },
    {
      detail:
        summaryWords >= 20 && summaryWords <= 80
          ? "The summary has enough space to frame the role without becoming too dense."
          : "Tighten or expand the summary so it quickly communicates focus, strengths, and target direction.",
      section: "summary" as const,
      status: summaryWords >= 20 && summaryWords <= 80 ? ("strong" as const) : ("needs-work" as const)
    },
    {
      detail:
        skillsCount >= 6
          ? "The skills section is broad enough to support role matching and ATS keyword detection."
          : "The skills section is still thin. Add more role-relevant tools, domains, and methods.",
      section: "skills" as const,
      status: skillsCount >= 6 ? ("strong" as const) : ("needs-work" as const)
    },
    {
      detail:
        resume.experience.length > 0 && experienceBullets >= 4
          ? "Experience has enough bullet-level detail to support both recruiter review and deterministic scoring."
          : "Experience needs clearer bullet coverage with concrete responsibilities and outcomes.",
      section: "experience" as const,
      status:
        resume.experience.length > 0 && experienceBullets >= 4 ? ("strong" as const) : ("needs-work" as const)
    },
    {
      detail:
        resume.projects.length > 0 && projectBullets >= 2
          ? "Projects add extra evidence beyond work history and help surface tools or domains."
          : "Projects are missing or too light. Add stronger project proof if it reflects real work.",
      section: "projects" as const,
      status: resume.projects.length > 0 && projectBullets >= 2 ? ("strong" as const) : ("needs-work" as const)
    }
  ];
}

function buildRenderChecks(renderOptions: RenderOptions, resume: ResumeData) {
  const marginCm = parseMarginToCentimeters(renderOptions.margin);
  const bulletVolume = getResumeBullets(resume).length;
  const firstSections = renderOptions.sectionOrder.slice(0, 3);

  return [
    {
      detail:
        renderOptions.fontSize >= 10
          ? "The current font size should remain readable for both PDF review and applicant-screening passes."
          : "Font size below 10pt risks a cramped one-page PDF and weaker readability.",
      label: "Readable font size",
      passed: renderOptions.fontSize >= 10
    },
    {
      detail:
        renderOptions.pageLimit === 1 && renderOptions.maxBulletsPerEntry <= 4
          ? "Bullet density is constrained appropriately for a one-page resume."
          : renderOptions.pageLimit === 2 && renderOptions.maxBulletsPerEntry <= 5
            ? "Bullet density is acceptable for a two-page resume."
            : "Bullet caps are high for the chosen page limit and may lead to cramped PDF output.",
      label: "Bullet density fits page target",
      passed:
        (renderOptions.pageLimit === 1 && renderOptions.maxBulletsPerEntry <= 4) ||
        (renderOptions.pageLimit === 2 && renderOptions.maxBulletsPerEntry <= 5)
    },
    {
      detail:
        marginCm !== null && marginCm >= 0.7 && marginCm <= 1.5
          ? "Margin settings are within a safe range for a clean resume layout."
          : "Margin settings may be too tight or too loose for stable PDF output.",
      label: "Margins are in a safe range",
      passed: marginCm !== null && marginCm >= 0.7 && marginCm <= 1.5
    },
    {
      detail:
        firstSections.some((section) => section === "summary" || section === "skills" || section === "experience")
          ? "The strongest career signal appears early in the section order."
          : "Bring summary, skills, or experience earlier so the top third of the resume lands faster.",
      label: "Section order starts strong",
      passed: firstSections.some((section) => section === "summary" || section === "skills" || section === "experience")
    },
    {
      detail:
        renderOptions.pageLimit === 2 || bulletVolume <= 14
          ? "Current content volume is reasonable for the selected page target."
          : "One-page mode plus the current bullet volume may make the PDF feel crowded.",
      label: "Content volume matches page limit",
      passed: renderOptions.pageLimit === 2 || bulletVolume <= 14
    }
  ];
}

export function analyzeResumeForAts(resume: ResumeData, renderOptions: RenderOptions): AtsAnalysisResult {
  const contactLines = getResumeContactLines(resume);
  const skills = flattenSkills(resume.skills);
  const bullets = getResumeBullets(resume);
  const summaryWords = wordCount(resume.summary ?? "");
  const bulletsWithMetrics = bullets.filter((bullet) => /\b\d+(?:\.\d+)?(?:%|x|k|m|b|\+)?\b/i.test(bullet)).length;
  const bulletsWithAction = bullets.filter((bullet) => ACTION_VERBS.some((verb) => bullet.toLowerCase().includes(verb))).length;
  const longBullets = bullets.filter((bullet) => wordCount(bullet) > 28).length;
  const sectionsCount = getResumeSectionsCount(resume);
  const renderChecks = buildRenderChecks(renderOptions, resume);
  const failedRenderChecks = renderChecks.filter((check) => !check.passed).length;

  const formatting = clampScore(
    100 -
      (resume.header.name?.trim() ? 0 : 40) -
      (resume.header.email?.trim() ? 0 : 20) -
      (resume.header.phone?.trim() ? 0 : 8) -
      (resume.header.location?.trim() ? 0 : 6) -
      Math.max(0, longBullets - 1) * 5 -
      failedRenderChecks * 5
  );
  const keywords = clampScore(
    32 + Math.min(skills.length * 6, 30) + Math.min(bulletsWithAction * 6, 20) + Math.min(bulletsWithMetrics * 7, 18)
  );
  const structure = clampScore(
    24 +
      sectionsCount * 8 +
      (resume.experience.length > 0 ? 16 : 0) +
      (resume.education.length > 0 ? 12 : 0) +
      (resume.projects.length > 0 ? 10 : 0) +
      (skills.length > 0 ? 10 : 0)
  );
  const readability = clampScore(
    100 -
      (summaryWords === 0 ? 18 : 0) -
      (summaryWords > 90 ? 12 : 0) -
      (summaryWords > 0 && summaryWords < 18 ? 8 : 0) -
      longBullets * 8 -
      Math.max(0, bullets.length - 14) * 2 -
      (renderOptions.fontSize < 10 ? 10 : 0)
  );
  const score = clampScore(formatting * 0.28 + keywords * 0.26 + structure * 0.22 + readability * 0.24);
  const rating = summarizeRating(score);
  const sectionSignals = buildAtsSectionSignals(resume);

  const issues = [
    !resume.summary?.trim()
      ? {
          detail: "Add a concise summary that anchors the role, strengths, and target direction near the top of the resume.",
          severity: "Moderate" as const,
          title: "Summary is missing"
        }
      : null,
    bulletsWithMetrics === 0
      ? {
          detail: "Add measurable outcomes to at least two bullets so the resume reads stronger in ATS filters and recruiter review.",
          severity: "Critical" as const,
          title: "Impact is not quantified"
        }
      : null,
    skills.length < 5
      ? {
          detail: "Expand the skills section with role-relevant tools, domains, and methods that honestly reflect your background.",
          severity: "Moderate" as const,
          title: "Skills section is thin"
        }
      : null,
    resume.experience.length === 0
      ? {
          detail: "Add at least one experience entry with role, company, dates, and bullet points before running ATS checks.",
          severity: "Critical" as const,
          title: "Experience section is missing"
        }
      : null,
    longBullets > 1
      ? {
          detail: "Trim dense bullets so each one lands faster and stays easier for both ATS parsing and recruiter scanning.",
          severity: "Low" as const,
          title: "Several bullets are too dense"
        }
      : null,
    contactLines.length < 3
      ? {
          detail: "Make sure the header clearly exposes the core contact details recruiters and parsers expect.",
          severity: "Moderate" as const,
          title: "Contact details can be clearer"
        }
      : null,
    failedRenderChecks > 1
      ? {
          detail: "Current render settings are likely making the PDF denser than it needs to be. Adjust font size, margins, or bullet caps before exporting.",
          severity: "Moderate" as const,
          title: "Render settings are working against readability"
        }
      : null
  ]
    .filter(Boolean)
    .sort((left, right) => {
      const severityRank = { Critical: 3, Low: 1, Moderate: 2 } as const;
      return severityRank[right!.severity] - severityRank[left!.severity];
    });

  return {
    categories: [
      { label: "Formatting", tone: "tertiary", value: formatting },
      { label: "Keywords", tone: "primary", value: keywords },
      { label: "Structure", tone: "secondary", value: structure },
      { label: "Readability", tone: "surface", value: readability }
    ],
    issues: issues as AtsAnalysisResult["issues"],
    rating,
    renderChecks,
    rules: [
      {
        detail: "ATS parsers and recruiters both rely on a complete top header for contact and identity signals.",
        label: "Clear contact details",
        passed: contactLines.length >= 3
      },
      {
        detail: "A short top summary helps anchor target role language before the scan reaches deeper sections.",
        label: "Role-focused summary",
        passed: Boolean(resume.summary?.trim())
      },
      {
        detail: "Experience bullets provide the strongest raw material for deterministic ATS checks.",
        label: "Bullet-led experience",
        passed: bullets.length >= 3
      },
      {
        detail: "Quantified outcomes improve credibility and make the strongest bullets easier to recognize.",
        label: "Quantified impact",
        passed: bulletsWithMetrics >= 2
      },
      {
        detail: "A clear skills block helps surface the tools and domains most likely to be matched.",
        label: "Skills section included",
        passed: skills.length >= 5
      }
    ],
    score,
    sectionSignals,
    summary:
      rating === "Strong"
        ? "The resume is structurally healthy for ATS and recruiter review. The next gains will come from sharpening the strongest evidence, not from rebuilding the layout."
        : rating === "Solid"
          ? "The resume has a strong foundation, but a few section-level and render-level choices are still limiting how clearly the strongest experience comes through."
          : rating === "Needs Work"
            ? "The resume has a usable base, but it still needs clearer section coverage, stronger evidence, and cleaner output settings."
            : "The resume needs more core structure before ATS scoring will be reliable. Start with contact details, experience bullets, and role-specific skills."
  };
}

export function analyzeResumeAgainstJobDescription(resume: ResumeData, jobDescription: string): JdAnalysisResult {
  const keywords = extractKeywords(jobDescription, 18);

  if (keywords.length === 0) {
    const summary = buildJdSummary(0, 0);

    return {
      keywordBreakdown: [],
      keywords: [],
      matched: 0,
      matchedKeywords: [],
      missing: 0,
      missingKeywords: [],
      partial: 0,
      partialKeywords: [],
      score: 0,
      suggestions: [],
      summaryCopy: summary.summaryCopy,
      summaryTitle: summary.summaryTitle,
      tags: []
    };
  }

  const entries = buildSectionEntryMap(resume);
  const breakdown = buildKeywordBreakdown(keywords, entries);
  const matchedKeywords = breakdown.filter((item) => item.status === "matched").map((item) => item.keyword);
  const partialKeywords = breakdown.filter((item) => item.status === "partial").map((item) => item.keyword);
  const missingKeywords = breakdown.filter((item) => item.status === "missing").map((item) => item.keyword);
  const score = clampScore(((matchedKeywords.length + partialKeywords.length * 0.5) / keywords.length) * 100);
  const summary = buildJdSummary(score, keywords.length);

  return {
    keywordBreakdown: breakdown,
    keywords,
    matched: matchedKeywords.length,
    matchedKeywords,
    missing: missingKeywords.length,
    missingKeywords,
    partial: partialKeywords.length,
    partialKeywords,
    score,
    suggestions: breakdown
      .filter((item) => item.status !== "matched")
      .slice(0, 5)
      .map((item) => ({
        detail:
          item.status === "missing"
            ? "If this reflects real experience, surface it in the summary, skills section, or a specific bullet where the evidence is strongest."
            : `This theme already appears in ${item.section ? SECTION_LABELS[item.section] : "the resume"}, but the wording can be tightened so the match reads more explicitly.`,
        keyword: titleizeKeyword(item.keyword),
        status: item.status as "missing" | "partial"
      })),
    summaryCopy: summary.summaryCopy,
    summaryTitle: summary.summaryTitle,
    tags: breakdown
      .filter((item) => item.status === "matched")
      .slice(0, 5)
      .map((item) => titleizeKeyword(item.keyword))
  };
}

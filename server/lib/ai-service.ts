import { analyzeResumeForAts } from "../../src/lib/analysis";
import { flattenSkills, getResumeContactLines } from "../../src/lib/resume";
import type { AtsAnalysisResult, JdAnalysisResult, KeywordBreakdown } from "../../src/types/analysis";
import type { ResumeImportMeta, ResumeImportResult, ResumeImportSummary } from "../../src/types/import";
import { createEmptyResumeData, type RenderOptions, type ResumeData, type ResumeSectionKey } from "../../src/types/resume";
import { atsCoachingSchema, type AiResumeParse, aiResumeParseSchema, jdParseSchema } from "./ai-schemas";
import { buildResumeParsePrompt, buildResumeRepairPrompt } from "./ai-resume-prompts";
import { createEmbeddings, extractJsonObject, generateJsonText, generateStructuredObject, getAiServiceHealth } from "./ai-client";
import { createCacheKey, readJsonCache, writeJsonCache } from "./cache";

export class AiResumeParsingUnavailableError extends Error {
  constructor() {
    super("AI resume parsing is not configured. Add GROQ_API_KEY or OPENAI_API_KEY before importing resumes.");
    this.name = "AiResumeParsingUnavailableError";
  }
}

function countSkills(resume: ResumeData) {
  return flattenSkills(resume.skills).length;
}

function hasContent(resume: ResumeData) {
  return Boolean(
    resume.header.name?.trim() ||
      resume.summary?.trim() ||
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

  if (resume.summary?.trim()) {
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

  if (resume.awards.length > 0) {
    detectedSections.push("awards");
  }

  if (resume.leadership.length > 0) {
    detectedSections.push("leadership");
  }

  if (resume.extracurricular.length > 0) {
    detectedSections.push("extracurricular");
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
  const generalSkills: string[] = [];
  const groupedSkills: Array<{ category: string; items: string[] }> = [];

  skills.forEach((item) => {
    if (typeof item === "string") {
      generalSkills.push(...item.split(/[\n,]+/).map((skill) => skill.trim()).filter(Boolean));
      return;
    }

    const items = item.items.map((skill) => skill.trim()).filter(Boolean);

    if (items.length === 0) {
      return;
    }

    groupedSkills.push({
      category: cleanText(item.category) || "General",
      items: dedupeList(items)
    });
  });

  if (groupedSkills.length > 0) {
    if (generalSkills.length > 0) {
      groupedSkills.unshift({
        category: "General",
        items: dedupeList(generalSkills)
      });
    }

    return groupedSkills;
  }

  return dedupeList(generalSkills);
}

function normalizeCompactItems(items: AiResumeParse["awards"]) {
  return items
    .map((item) => ({
      date: cleanText(item.date),
      description: cleanText(item.description),
      link: normalizeUrl(item.link)
    }))
    .filter((item) => hasMeaningfulValue([item.description, item.date, item.link]));
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

function parseAiResumePayload(content: string) {
  try {
    const parsed = aiResumeParseSchema.safeParse(JSON.parse(extractJsonObject(content)));

    if (parsed.success) {
      return {
        error: null,
        success: true as const,
        value: parsed.data
      };
    }

    return {
      error: parsed.error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join("; "),
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
  const initialResponse = await generateJsonText(initialPrompt);

  if (!initialResponse) {
    throw new AiResumeParsingUnavailableError();
  }

  const initialParse = parseAiResumePayload(initialResponse.content);

  if (initialParse.success) {
    return {
      modelUsed: initialResponse.modelUsed,
      repairApplied: false,
      value: initialParse.value
    };
  }

  const repairPrompt = buildResumeRepairPrompt(text, initialResponse.content, initialParse.error);
  const repairedResponse = await generateJsonText(repairPrompt);

  if (!repairedResponse) {
    throw new Error("AI resume repair could not be completed.");
  }

  const repairedParse = parseAiResumePayload(repairedResponse.content);

  if (!repairedParse.success) {
    throw new Error(`AI resume parsing returned invalid JSON after repair. ${repairedParse.error}`);
  }

  return {
    modelUsed: repairedResponse.modelUsed,
    repairApplied: true,
    value: repairedParse.value
  };
}

function normalizeAiResume(parsed: AiResumeParse): ResumeData {
  const base = createEmptyResumeData("ai");

  return {
    ...base,
    awards: normalizeCompactItems(parsed.awards),
    certifications: normalizeCompactItems(parsed.certifications),
    education:
      parsed.education.map((item) => ({
        degree: cleanText(item.degree),
        endYear: cleanText(item.endYear),
        field: cleanText(item.field),
        gpa: cleanText(item.gpa),
        institution: cleanText(item.institution),
        location: cleanText(item.location),
        startYear: cleanText(item.startYear)
      }))
      .filter((item) => hasMeaningfulValue([item.degree, item.field, item.institution, item.location, item.startYear, item.endYear])),
    experience:
      parsed.experience.map((item, index) => ({
        bullets: item.bullets.map((bullet) => bullet.trim()).filter(Boolean),
        company: cleanText(item.company),
        current: Boolean(item.current),
        description: cleanText(item.description),
        endDate: cleanText(item.endDate),
        id: cleanText(item.id) || `ai-experience-${index + 1}`,
        location: cleanText(item.location),
        role: cleanText(item.role),
        startDate: cleanText(item.startDate)
      }))
      .filter((item) => hasMeaningfulValue([item.role, item.company, item.location, item.description, item.startDate, item.endDate, item.current, item.bullets.length > 0])),
    extracurricular: normalizeCompactItems(parsed.extracurricular),
    header: {
      email: cleanText(parsed.header.email),
      github: normalizeUrl(parsed.header.github),
      linkedin: normalizeUrl(parsed.header.linkedin),
      location: cleanText(parsed.header.location),
      name: cleanText(parsed.header.name),
      phone: cleanText(parsed.header.phone),
      portfolio: normalizeUrl(parsed.header.portfolio),
      title: cleanText(parsed.header.title),
      website: normalizeUrl(parsed.header.website)
    },
    leadership: normalizeCompactItems(parsed.leadership),
    meta: {
      ...base.meta,
      source: "ai"
    },
    projects:
      parsed.projects.map((item) => ({
        bullets: item.bullets.map((bullet) => bullet.trim()).filter(Boolean),
        description: cleanText(item.description),
        endDate: cleanText(item.endDate),
        link: normalizeUrl(item.link),
        startDate: cleanText(item.startDate),
        technologies: item.technologies.map((tech) => tech.trim()).filter(Boolean),
        title: cleanText(item.title)
      }))
      .filter((item) => hasMeaningfulValue([item.title, item.description, item.link, item.startDate, item.endDate, item.bullets.length > 0, item.technologies.length > 0])),
    skills: normalizeSkills(parsed.skills),
    summary: cleanText(parsed.summary)
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

  const cacheKey = createCacheKey(JSON.stringify({ kind: "resume-parse", text: trimmedText, version: 3 }));
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
      warnings: dedupeWarnings(
        completion.repairApplied
          ? [...warnings, `AI resume JSON needed one repair pass before it fit the schema.`]
          : warnings
      )
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
    resume.header.title,
    getResumeContactLines(resume).join(" | "),
    resume.summary,
    flattenSkills(resume.skills).join(", "),
    ...resume.experience.flatMap((item) => [
      [item.role, item.company, item.location].filter(Boolean).join(" | "),
      item.description,
      item.bullets.join(" ")
    ]),
    ...resume.education.map((item) => [item.degree, item.field, item.institution, item.location].filter(Boolean).join(" | ")),
    ...resume.projects.flatMap((item) => [
      [item.title, item.link].filter(Boolean).join(" | "),
      item.description,
      item.technologies.join(", "),
      item.bullets.join(" ")
    ])
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

  if (resume.summary?.trim()) {
    chunks.push({ section: "summary", text: resume.summary.trim() });
  }

  const skillLines = flattenSkills(resume.skills);

  if (skillLines.length > 0) {
    chunks.push({ section: "skills", text: skillLines.join(", ") });
  }

  resume.experience.forEach((item) => {
    const text = [item.role, item.company, item.location, item.description, ...item.bullets].filter(Boolean).join(" | ");

    if (text.trim()) {
      chunks.push({ section: "experience", text });
    }
  });

  resume.projects.forEach((item) => {
    const text = [item.title, item.description, item.link, ...item.technologies, ...item.bullets].filter(Boolean).join(" | ");

    if (text.trim()) {
      chunks.push({ section: "projects", text });
    }
  });

  resume.education.forEach((item) => {
    const text = [item.degree, item.field, item.institution, item.location].filter(Boolean).join(" | ");

    if (text.trim()) {
      chunks.push({ section: "education", text });
    }
  });

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

    if (cachedEmbeddings || aiHealth.embeddingProvider === "openai") {
      const embeddingPayload =
        cachedEmbeddings ??
        (async () => {
          const inputs = [
            ...requirements.map((requirement) => `${requirement.title}: ${requirement.keywords.join(", ")}`),
            ...resumeChunks.map((chunk) => chunk.text)
          ];
          const embeddingResponse = await createEmbeddings(inputs);

          if (!embeddingResponse) {
            return null;
          }

          const requirementVectors = embeddingResponse.vectors.slice(0, requirements.length);
          const resumeVectors = embeddingResponse.vectors.slice(requirements.length);
          const payload = { requirementVectors, resumeVectors };

          await writeJsonCache("embeddings", jdEmbeddingKey, payload);
          return payload;
        })();

      const resolvedEmbeddings = embeddingPayload instanceof Promise ? await embeddingPayload : embeddingPayload;

      if (resolvedEmbeddings) {
        embeddingStatus = "ready";
        semanticScores = resolvedEmbeddings.requirementVectors.map((vector, requirementIndex) => {
          let best = { score: 0, section: null as ResumeSectionKey | null };

          resolvedEmbeddings.resumeVectors.forEach((resumeVector, chunkIndex) => {
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

import type { ResumeSectionKey } from "./resume";

export type AnalysisIssueSeverity = "Critical" | "Moderate" | "Low";
export type AnalysisCategoryTone = "primary" | "secondary" | "tertiary" | "surface";
export type AnalysisSignalStatus = "strong" | "needs-work";
export type KeywordMatchStatus = "matched" | "partial" | "missing";

export interface AnalysisIssue {
  detail: string;
  severity: AnalysisIssueSeverity;
  title: string;
}

export interface AtsCategoryScore {
  label: "Formatting" | "Keywords" | "Structure" | "Readability";
  tone: AnalysisCategoryTone;
  value: number;
}

export interface AtsRuleCheck {
  detail: string;
  label: string;
  passed: boolean;
}

export interface AtsSectionSignal {
  detail: string;
  section: ResumeSectionKey | "header";
  status: AnalysisSignalStatus;
}

export interface AtsAnalysisResult {
  aiSummary: string | null;
  categories: AtsCategoryScore[];
  issues: AnalysisIssue[];
  modelUsed: string | null;
  rating: string;
  renderChecks: AtsRuleCheck[];
  rules: AtsRuleCheck[];
  score: number;
  sectionSignals: AtsSectionSignal[];
  summary: string;
}

export interface KeywordBreakdown {
  evidence: string | null;
  keyword: string;
  section: ResumeSectionKey | null;
  status: KeywordMatchStatus;
}

export interface JdSuggestion {
  detail: string;
  keyword: string;
  status: Exclude<KeywordMatchStatus, "matched">;
}

export interface JdRequirementBreakdown {
  matchedKeywords: string[];
  section: ResumeSectionKey | null;
  semanticScore: number;
  title: string;
  type: "must" | "preferred";
  weight: number;
}

export interface JdAnalysisResult {
  aiSummary: string | null;
  embeddingStatus: "disabled" | "ready";
  keywordBreakdown: KeywordBreakdown[];
  keywordScore: number;
  keywords: string[];
  matched: number;
  matchedKeywords: string[];
  missing: number;
  missingKeywords: string[];
  modelUsed: string | null;
  partial: number;
  partialKeywords: string[];
  requirementBreakdown: JdRequirementBreakdown[];
  score: number;
  semanticScore?: number;
  suggestions: JdSuggestion[];
  summaryCopy: string;
  summaryTitle: string;
  tags: string[];
}

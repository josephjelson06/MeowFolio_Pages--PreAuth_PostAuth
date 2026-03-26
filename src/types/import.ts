import type { ResumeData, ResumeSectionKey } from "./resume";

export interface ResumeImportMeta {
  cached: boolean;
  confidence: "low" | "medium" | "high";
  method: "ai";
}

export interface ResumeImportSummary {
  detectedSections: ResumeSectionKey[];
  educationCount: number;
  experienceCount: number;
  projectCount: number;
  skillCount: number;
}

export interface ResumeImportResult {
  resume: ResumeData;
  summary: ResumeImportSummary;
  warnings: string[];
}

export interface ImportResumeFileResponse {
  extractedText: string;
  fileName: string;
  mimeType: string;
  result: ResumeImportResult;
}

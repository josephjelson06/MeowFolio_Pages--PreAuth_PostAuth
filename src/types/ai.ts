import type { ResumeData } from "./resume";

export interface ImportResumeTextPayload {
  text: string;
}

export interface AiServiceHealth {
  configured: boolean;
  embeddingProvider: "none" | "openai";
  provider: "none" | "groq" | "openai";
  textModel: string | null;
}

export interface AnalyzeAtsPayload {
  options: {
    fontSize: number;
    margin: string;
    maxBulletsPerEntry: number;
    pageLimit: 1 | 2;
    sectionOrder: string[];
    sectionTitles?: Record<string, string>;
    templateId: string;
  };
  resume: ResumeData;
}

export interface AnalyzeJdPayload {
  jobDescription: string;
  resume: ResumeData;
}

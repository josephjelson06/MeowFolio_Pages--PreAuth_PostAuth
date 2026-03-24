import type { RenderOptions, ResumeData } from "./resume";

export interface RenderResumePayload {
  options: RenderOptions;
  resume: ResumeData;
}

export interface RenderTexResponse {
  templateId: string;
  texSource: string;
}

export interface CompilerHealthResponse {
  engineAvailable: boolean;
  engineCommand: string;
  status: "ok";
}

export interface ApiErrorResponse {
  error: string;
}

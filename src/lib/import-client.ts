import type { ImportResumeFileResponse, ImportResumeTextPayload, ImportResumeTextResponse } from "../types/import";
import type { ApiErrorResponse } from "../types/render";

const API_BASE = "";

function toUrl(path: string) {
  return `${API_BASE}${path}`;
}

async function readApiError(response: Response) {
  try {
    const payload = (await response.json()) as ApiErrorResponse;
    return payload.error || `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}

export async function requestImportedResumeFile(file: File) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(toUrl("/api/import/file"), {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as ImportResumeFileResponse;
}

export async function requestImportedResumeText(text: string) {
  const payload: ImportResumeTextPayload = { text };
  const response = await fetch(toUrl("/api/import/text"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as ImportResumeTextResponse;
}

export async function requestExtractedTextFile(file: File) {
  const response = await requestImportedResumeFile(file);

  return {
    extractedText: response.extractedText,
    fileName: response.fileName,
    mimeType: response.mimeType
  };
}

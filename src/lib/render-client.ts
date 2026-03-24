import type {
  ApiErrorResponse,
  CompilerHealthResponse,
  RenderResumePayload,
  RenderTexResponse
} from "../types/render";

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

export async function fetchCompilerHealth() {
  const response = await fetch(toUrl("/api/health"));

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as CompilerHealthResponse;
}

export async function requestTexDraft(payload: RenderResumePayload) {
  const response = await fetch(toUrl("/api/render/tex"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as RenderTexResponse;
}

export async function requestCompiledPdf(payload: RenderResumePayload) {
  const response = await fetch(toUrl("/api/render/pdf"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return await response.blob();
}

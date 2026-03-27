import cors from "cors";
import express from "express";
import { loadServerEnv } from "./lib/env";
import { compileLatexToPdf, getCompilerHealth, TexCompilationError, TexEngineUnavailableError } from "./lib/compile";
import multer from "multer";
import { EmptyImportFileError, extractResumeTextFromFile, UnsupportedImportFileError } from "./lib/import-file";
import { renderResumeToTex } from "../src/lib/tex";
import type { RenderResumePayload } from "../src/types/render";
import type { ImportResumeTextPayload } from "../src/types/ai";
import {
  AiResumeParsingUnavailableError,
  parseResumeTextWithAi
} from "./lib/ai-service";

loadServerEnv();

const app = express();
const PORT = Number(process.env.PORT ?? 8787);
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  storage: multer.memoryStorage()
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function isRenderPayload(value: unknown): value is RenderResumePayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<RenderResumePayload>;
  return Boolean(payload.resume && payload.options);
}

function isImportTextPayload(value: unknown): value is ImportResumeTextPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<ImportResumeTextPayload>;
  return typeof payload.text === "string";
}

app.get("/api/health", async (_request, response) => {
  try {
    response.json(await getCompilerHealth());
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Health check failed."
    });
  }
});

app.post("/api/render/tex", (request, response) => {
  if (!isRenderPayload(request.body)) {
    response.status(400).json({ error: "Invalid render payload." });
    return;
  }

  const texSource = renderResumeToTex(request.body.resume, request.body.options);
  response.json({
    templateId: request.body.options.templateId,
    texSource
  });
});

app.post("/api/import/text", async (request, response) => {
  if (!isImportTextPayload(request.body)) {
    response.status(400).json({ error: "Invalid import payload." });
    return;
  }

  try {
    const result = await parseResumeTextWithAi(request.body.text);
    response.json({ result });
  } catch (error) {
    if (error instanceof AiResumeParsingUnavailableError) {
      response.status(503).json({
        error: error.message
      });
      return;
    }

    response.status(500).json({
      error: error instanceof Error ? error.message : "Unknown text import error."
    });
  }
});

app.post("/api/render/pdf", async (request, response) => {
  if (!isRenderPayload(request.body)) {
    response.status(400).json({ error: "Invalid render payload." });
    return;
  }

  try {
    const texSource = renderResumeToTex(request.body.resume, request.body.options);
    const pdfBuffer = await compileLatexToPdf(texSource, request.body.options.templateId);

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", 'inline; filename="resume.pdf"');
    response.send(pdfBuffer);
  } catch (error) {
    if (error instanceof TexEngineUnavailableError) {
      response.status(503).json({ error: error.message });
      return;
    }

    if (error instanceof TexCompilationError) {
      response.status(500).json({ error: `${error.message}\n\n${error.output}` });
      return;
    }

    response.status(500).json({
      error: error instanceof Error ? error.message : "Unknown PDF compilation error."
    });
  }
});

app.post("/api/import/file", upload.single("file"), async (request, response) => {
  if (!request.file) {
    response.status(400).json({ error: "No file was uploaded." });
    return;
  }

  try {
    const extractedText = await extractResumeTextFromFile(request.file);
    const result = await parseResumeTextWithAi(extractedText);

    response.json({
      extractedText,
      fileName: request.file.originalname,
      mimeType: request.file.mimetype,
      result
    });
  } catch (error) {
    if (error instanceof UnsupportedImportFileError || error instanceof EmptyImportFileError) {
      response.status(400).json({ error: error.message });
      return;
    }

    if (error instanceof AiResumeParsingUnavailableError) {
      response.status(503).json({ error: error.message });
      return;
    }

    response.status(500).json({
      error: error instanceof Error ? error.message : "Unknown file import error."
    });
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      response.status(400).json({ error: "Uploaded file is too large. Keep resume files under 5 MB." });
      return;
    }

    response.status(400).json({ error: error.message });
    return;
  }

  response.status(500).json({
    error: error instanceof Error ? error.message : "Unknown server error."
  });
});

app.listen(PORT, () => {
  console.log(`MeowFolio render service listening on http://localhost:${PORT}`);
});

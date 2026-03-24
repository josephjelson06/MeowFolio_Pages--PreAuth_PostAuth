import cors from "cors";
import express from "express";
import { compileLatexToPdf, getCompilerHealth, TexCompilationError, TexEngineUnavailableError } from "./lib/compile";
import { renderResumeToTex } from "../src/lib/tex";
import type { RenderResumePayload } from "../src/types/render";

const app = express();
const PORT = Number(process.env.PORT ?? 8787);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function isRenderPayload(value: unknown): value is RenderResumePayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<RenderResumePayload>;
  return Boolean(payload.resume && payload.options);
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

app.post("/api/render/pdf", async (request, response) => {
  if (!isRenderPayload(request.body)) {
    response.status(400).json({ error: "Invalid render payload." });
    return;
  }

  try {
    const texSource = renderResumeToTex(request.body.resume, request.body.options);
    const pdfBuffer = await compileLatexToPdf(texSource);

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

app.listen(PORT, () => {
  console.log(`MeowFolio render service listening on http://localhost:${PORT}`);
});

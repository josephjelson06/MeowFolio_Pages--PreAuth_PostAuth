import { randomUUID } from "node:crypto";
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import type { RenderTemplateId } from "../../src/types/resume";

const DEFAULT_ENGINE_COMMAND = process.env.TEX_ENGINE ?? "tectonic";
const TEMPLATE_ASSET_DIRECTORIES: Partial<Record<RenderTemplateId, string>> = {
  template4: path.resolve(process.cwd(), "Template4"),
  template5: path.resolve(process.cwd(), "Template5")
};

export class TexEngineUnavailableError extends Error {
  constructor(public readonly command: string) {
    super(`TeX engine "${command}" is not installed or not available in PATH.`);
    this.name = "TexEngineUnavailableError";
  }
}

export class TexCompilationError extends Error {
  constructor(
    public readonly command: string,
    public readonly exitCode: number | null,
    public readonly output: string
  ) {
    super(`TeX compilation failed using "${command}".`);
    this.name = "TexCompilationError";
  }
}

function getEngineArgs(command: string, texFileName: string, outputDirectory: string) {
  const normalized = path.basename(command).toLowerCase();

  if (normalized.includes("tectonic")) {
    return ["-X", "compile", texFileName, "--outdir", outputDirectory];
  }

  if (normalized.includes("xelatex") || normalized.includes("pdflatex")) {
    return ["-interaction=nonstopmode", "-halt-on-error", "-output-directory", outputDirectory, texFileName];
  }

  return ["-X", "compile", texFileName, "--outdir", outputDirectory];
}

async function copyTemplateAssets(templateId: RenderTemplateId | undefined, workdir: string) {
  if (!templateId) {
    return;
  }

  const sourceDirectory = TEMPLATE_ASSET_DIRECTORIES[templateId];

  if (!sourceDirectory) {
    return;
  }

  const entries = await readdir(sourceDirectory, { withFileTypes: true });

  await Promise.all(
    entries.map((entry) =>
      cp(path.join(sourceDirectory, entry.name), path.join(workdir, entry.name), {
        force: true,
        recursive: true
      })
    )
  );

  if (templateId === "template5") {
    const russellClassPath = path.join(workdir, "russell.cls");

    try {
      const russellClassSource = await readFile(russellClassPath, "utf8");
      const sanitizedRussellClassSource = russellClassSource.replace(
        /\n\s*%-------------------------------------------------------------------------------\n\s*%                Bibliography[\s\S]*$/m,
        "\n"
      );

      if (sanitizedRussellClassSource !== russellClassSource) {
        await writeFile(russellClassPath, sanitizedRussellClassSource, "utf8");
      }
    } catch {
      return;
    }
  }
}

function getEngineCandidates(templateId?: RenderTemplateId) {
  const preferredCommands = templateId === "template4" || templateId === "template5" ? ["xelatex", DEFAULT_ENGINE_COMMAND] : [DEFAULT_ENGINE_COMMAND];
  return [...new Set(preferredCommands)];
}

async function runProcess(command: string, args: string[], cwd: string) {
  return await new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, { cwd });
    let output = "";

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });

    child.on("error", (error) => {
      const nodeError = error as NodeJS.ErrnoException;

      if (nodeError.code === "ENOENT") {
        reject(new TexEngineUnavailableError(command));
        return;
      }

      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(output);
        return;
      }

      reject(new TexCompilationError(command, code, output));
    });
  });
}

export async function getCompilerHealth() {
  try {
    await runProcess(DEFAULT_ENGINE_COMMAND, ["--version"], process.cwd());

    return {
      engineAvailable: true,
      engineCommand: DEFAULT_ENGINE_COMMAND,
      status: "ok" as const
    };
  } catch (error) {
    if (error instanceof TexEngineUnavailableError) {
      return {
        engineAvailable: false,
        engineCommand: DEFAULT_ENGINE_COMMAND,
        status: "ok" as const
      };
    }

    throw error;
  }
}

export async function compileLatexToPdf(texSource: string, templateId?: RenderTemplateId) {
  const workdir = await mkdtemp(path.join(tmpdir(), "meowfolio-tex-"));
  const outputDirectory = path.join(workdir, "out");
  const texFileName = `resume-${randomUUID()}.tex`;
  const texFilePath = path.join(workdir, texFileName);
  const pdfFilePath = path.join(outputDirectory, texFileName.replace(/\.tex$/, ".pdf"));

  try {
    await mkdir(outputDirectory, { recursive: true });
    await copyTemplateAssets(templateId, workdir);
    await writeFile(texFilePath, texSource, "utf8");
    let lastError: unknown;

    for (const command of getEngineCandidates(templateId)) {
      try {
        await runProcess(command, getEngineArgs(command, texFileName, outputDirectory), workdir);
        return await readFile(pdfFilePath);
      } catch (error) {
        lastError = error;

        if (error instanceof TexEngineUnavailableError) {
          continue;
        }

        if (!(error instanceof TexCompilationError) || command === DEFAULT_ENGINE_COMMAND) {
          throw error;
        }
      }
    }

    if (lastError) {
      throw lastError;
    }

    return await readFile(pdfFilePath);
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}

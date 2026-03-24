import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const DEFAULT_ENGINE_COMMAND = process.env.TEX_ENGINE ?? "tectonic";

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

export async function compileLatexToPdf(texSource: string) {
  const workdir = await mkdtemp(path.join(tmpdir(), "meowfolio-tex-"));
  const outputDirectory = path.join(workdir, "out");
  const texFileName = `resume-${randomUUID()}.tex`;
  const texFilePath = path.join(workdir, texFileName);
  const pdfFilePath = path.join(outputDirectory, texFileName.replace(/\.tex$/, ".pdf"));

  try {
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(texFilePath, texSource, "utf8");
    await runProcess(DEFAULT_ENGINE_COMMAND, getEngineArgs(DEFAULT_ENGINE_COMMAND, texFileName, outputDirectory), workdir);
    return await readFile(pdfFilePath);
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}

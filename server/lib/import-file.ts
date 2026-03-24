import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import path from "node:path";

const SUPPORTED_EXTENSIONS = new Set([".txt", ".md", ".pdf", ".docx"]);

export class UnsupportedImportFileError extends Error {
  constructor(public readonly fileName: string) {
    super(`Unsupported file type for "${fileName}". Supported formats are .txt, .md, .pdf, and .docx.`);
    this.name = "UnsupportedImportFileError";
  }
}

export class EmptyImportFileError extends Error {
  constructor(public readonly fileName: string) {
    super(`No extractable text was found in "${fileName}".`);
    this.name = "EmptyImportFileError";
  }
}

function normalizeExtractedText(value: string) {
  return value.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
}

function getFileExtension(fileName: string) {
  return path.extname(fileName).toLowerCase();
}

async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export function getSupportedImportFormats() {
  return Array.from(SUPPORTED_EXTENSIONS);
}

export async function extractResumeTextFromFile(file: Express.Multer.File) {
  const extension = getFileExtension(file.originalname);

  if (!SUPPORTED_EXTENSIONS.has(extension) && !file.mimetype.startsWith("text/")) {
    throw new UnsupportedImportFileError(file.originalname);
  }

  let extractedText = "";

  if (extension === ".pdf") {
    extractedText = await extractPdfText(file.buffer);
  } else if (extension === ".docx") {
    extractedText = await extractDocxText(file.buffer);
  } else {
    extractedText = file.buffer.toString("utf8");
  }

  const normalized = normalizeExtractedText(extractedText);

  if (!normalized) {
    throw new EmptyImportFileError(file.originalname);
  }

  return normalized;
}

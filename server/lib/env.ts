import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

let loaded = false;

function parseEnvLine(line: string) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const equalIndex = trimmed.indexOf("=");

  if (equalIndex <= 0) {
    return null;
  }

  const key = trimmed.slice(0, equalIndex).trim();
  let value = trimmed.slice(equalIndex + 1).trim();

  if (!key) {
    return null;
  }

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

function loadFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line) => {
    const parsed = parseEnvLine(line);

    if (!parsed) {
      return;
    }

    if (process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value;
    }
  });
}

export function loadServerEnv() {
  if (loaded) {
    return;
  }

  const root = process.cwd();

  loadFile(path.join(root, ".env"));
  loadFile(path.join(root, ".env.local"));

  loaded = true;
}


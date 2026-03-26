import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CACHE_ROOT = path.resolve(process.cwd(), ".meowfolio-cache");

function getCachePath(namespace: string, key: string) {
  return path.join(CACHE_ROOT, namespace, `${key}.json`);
}

export function createCacheKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function readJsonCache<T>(namespace: string, key: string): Promise<T | null> {
  try {
    const raw = await readFile(getCachePath(namespace, key), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJsonCache(namespace: string, key: string, value: unknown) {
  const filePath = getCachePath(namespace, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

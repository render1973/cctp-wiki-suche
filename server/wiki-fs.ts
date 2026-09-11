import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));

// Repo-Root relativ zu dieser Datei bestimmt, nicht relativ zu process.cwd() —
// MCP-Clients starten den Server oft mit unbekanntem Arbeitsverzeichnis.
export const DEFAULT_REPO_ROOT = path.resolve(SERVER_DIR, "..");

// Neue, wachsende Wiki-Struktur unter <repo>/wiki/. Bewusst getrennt vom
// festen Fünf-Seiten-Bestand in server/wiki/, den corpus.ts einliest.
export const WIKI_DIRNAME = "wiki";

export function wikiRootFor(repoRoot: string): string {
  return path.join(repoRoot, WIKI_DIRNAME);
}

export async function findMarkdownFiles(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findMarkdownFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files.sort();
}

export function extractTitle(markdown: string): string | undefined {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
}

export function extractStatus(markdown: string): string | undefined {
  return markdown.match(/^- Status: (.+)$/m)?.[1]?.trim();
}

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseTitle, parseStatus, parseQuelle } from "./markdown.js";

// Sieben Bereiche der CCTP-Wiki-Taxonomie. `schreibe_wiki_seite` validiert
// gegen genau diese Liste; neue Bereiche gehören hier ergänzt und im README
// dokumentiert.
export const BEREICHE = [
  "entscheidungen",
  "buero",
  "projekte",
  "lehre",
  "forschung",
  "dienstleistungen",
  "foerdergeber",
] as const;

export type Bereich = (typeof BEREICHE)[number];

export type WikiPage = {
  id: string;
  bereich: string;
  title: string;
  status: string;
  path: string;
  body: string;
  quelle?: string;
};

const serverDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(serverDir, "..");
export const wikiRoot = path.join(repoRoot, "wiki");

function loadPagesFromDisk(): WikiPage[] {
  const pages: WikiPage[] = [];
  for (const bereich of BEREICHE) {
    const dir = path.join(wikiRoot, bereich);
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.endsWith(".md")) continue;
      const filePath = path.join(dir, entry);
      const body = readFileSync(filePath, "utf-8");
      const id = entry.replace(/\.md$/, "");
      pages.push({
        id,
        bereich,
        title: parseTitle(body),
        status: parseStatus(body),
        path: path.relative(path.resolve(serverDir, ".."), filePath).split(path.sep).join("/"),
        body,
        quelle: parseQuelle(body),
      });
    }
  }
  return pages;
}

// Liest die Seiten bei jedem Aufruf neu von der Platte, damit ein gerade
// per `schreibe_wiki_seite` geschriebener Artikel sofort über `such_cctp_wiki`
// auffindbar ist, ohne den Server neu zu starten.
export function getPages(): WikiPage[] {
  return loadPagesFromDisk();
}

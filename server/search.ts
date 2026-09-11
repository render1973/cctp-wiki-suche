import { promises as fs } from "node:fs";
import path from "node:path";
import { PAGES, type WikiPage } from "./corpus.js";
import {
  DEFAULT_REPO_ROOT,
  findMarkdownFiles,
  extractTitle,
  extractStatus,
  wikiRootFor,
} from "./wiki-fs.js";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9äöüß]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

// Gemeinsame Form für beide Quellen: die fünf festen Seiten aus corpus.ts
// UND alle Markdown-Dateien unter wiki/ (dort legt schreibe_wiki_seite neue
// Einträge an). Scoring/Extraktion laufen für beide identisch darüber.
type SearchablePage = {
  titel: string;
  status: string;
  datei: string;
  rohquellePfad: string;
  body: string;
};

function scorePage(query: string, page: SearchablePage): number {
  const terms = tokenize(query);
  const hay = `${page.titel} ${page.body}`.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (hay.includes(term)) score += 2;
    const count = hay.split(term).length - 1;
    score += Math.min(count, 6);
  }
  return score;
}

function extractPassages(query: string, page: SearchablePage, limit = 3): string[] {
  const terms = new Set(tokenize(query));
  const blocks = page.body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 40 && !block.startsWith("# "));
  return blocks
    .map((block) => {
      const tokens = tokenize(block);
      const hits = tokens.filter((token) => terms.has(token)).length;
      return { block, hits };
    })
    .filter((item) => item.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit)
    .map((item) => item.block.replace(/\s+/g, " ").slice(0, 420));
}

// Die Seite selbst liegt in einem 10-wiki/-Pfad (page.path), das ist aber nur
// die verdichtete Wiki-Seite. Die eigentliche Belegstelle ist die unveränderte
// Originalquelle im Roharchiv (00-roharchiv/…), auf die "sources" verweist.
function rawSourcePath(page: WikiPage): string {
  for (const entry of page.sources) {
    const candidate = entry.split(" — ")[0]?.trim();
    if (candidate?.startsWith("00-roharchiv/")) {
      return candidate;
    }
  }
  // Fallback, falls eine Seite (noch) keine Roharchiv-Quelle nennt.
  return page.sources[0]?.split(" — ")[0]?.trim() ?? page.path;
}

function fixedPages(): SearchablePage[] {
  return PAGES.map((page) => ({
    titel: page.title,
    status: page.status,
    datei: `server/wiki/${page.id}.md`,
    rohquellePfad: rawSourcePath(page),
    body: page.body,
  }));
}

// wiki/-Seiten haben keine separate Roharchiv-Quelle wie die fünf festen
// Seiten — sie sind selbst der primäre Eintrag. Rohquelle-Pfad zeigt hier
// deshalb auf die Datei selbst, nicht auf ein zweites, referenziertes Dokument.
async function dynamicPages(repoRoot: string): Promise<SearchablePage[]> {
  const wikiRoot = wikiRootFor(repoRoot);
  const files = await findMarkdownFiles(wikiRoot);
  const pages: SearchablePage[] = [];
  for (const file of files) {
    const content = await fs.readFile(file, "utf-8");
    const titel = extractTitle(content) ?? path.basename(file, ".md");
    const status = extractStatus(content) ?? "entwurf";
    const datei = path.relative(repoRoot, file);
    pages.push({ titel, status, datei, rohquellePfad: datei, body: content });
  }
  return pages;
}

export type WikiQuellOptions = {
  repoRoot?: string;
};

async function alleSeiten(opts: WikiQuellOptions): Promise<SearchablePage[]> {
  const repoRoot = opts.repoRoot ?? DEFAULT_REPO_ROOT;
  return [...fixedPages(), ...(await dynamicPages(repoRoot))];
}

export type WikiSearchHit = {
  titel: string;
  status: string;
  rohquellePfad: string;
  textauszug: string;
};

export async function searchWiki(
  query: string,
  limit = 3,
  opts: WikiQuellOptions = {},
): Promise<WikiSearchHit[]> {
  const seiten = await alleSeiten(opts);
  const ranked = seiten
    .map((page) => ({ page, score: scorePage(query, page) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const hits: WikiSearchHit[] = [];
  for (const { page } of ranked) {
    const passages = extractPassages(query, page);
    if (passages.length === 0) continue;
    hits.push({
      titel: page.titel,
      status: page.status,
      rohquellePfad: page.rohquellePfad,
      textauszug: passages.join(" […] "),
    });
    if (hits.length >= limit) break;
  }
  return hits;
}

export type WikiPageSummary = {
  titel: string;
  datei: string;
  status: string;
};

export async function listWikiPages(opts: WikiQuellOptions = {}): Promise<WikiPageSummary[]> {
  const seiten = await alleSeiten(opts);
  return seiten.map((page) => ({
    titel: page.titel,
    datei: page.datei,
    status: page.status,
  }));
}

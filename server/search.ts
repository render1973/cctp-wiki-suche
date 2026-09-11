import { getPages, type WikiPage } from "./corpus.js";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9äöüß]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function scorePage(query: string, page: WikiPage): number {
  const terms = tokenize(query);
  const hay = `${page.title} ${page.body}`.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (hay.includes(term)) score += 2;
    const count = hay.split(term).length - 1;
    score += Math.min(count, 6);
  }
  return score;
}

function extractPassages(query: string, page: WikiPage, limit = 3): string[] {
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

export type WikiSearchHit = {
  titel: string;
  bereich: string;
  status: string;
  rohquellePfad: string;
  textauszug: string;
};

export function searchWiki(query: string, limit = 3): WikiSearchHit[] {
  const ranked = getPages()
    .map((page) => ({ page, score: scorePage(query, page) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const hits: WikiSearchHit[] = [];
  for (const { page } of ranked) {
    const passages = extractPassages(query, page);
    if (passages.length === 0) continue;
    hits.push({
      titel: page.title,
      bereich: page.bereich,
      status: page.status,
      rohquellePfad: page.path,
      textauszug: passages.join(" […] "),
    });
    if (hits.length >= limit) break;
  }
  return hits;
}

export type WikiPageSummary = {
  titel: string;
  bereich: string;
  datei: string;
  status: string;
};

export function listWikiPages(bereich?: string): WikiPageSummary[] {
  return getPages()
    .filter((page) => !bereich || page.bereich === bereich)
    .map((page) => ({
      titel: page.title,
      bereich: page.bereich,
      datei: page.path,
      status: page.status,
    }));
}

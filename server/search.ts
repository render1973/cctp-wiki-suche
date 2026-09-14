import { getPages, type WikiPage } from "./corpus.js";
import { rankPages, extractPassages } from "./search-core.js";

export type WikiSearchHit = {
  titel: string;
  bereich: string;
  status: string;
  rohquellePfad: string;
  quelle?: string;
  textauszug: string;
};

export function searchWiki(query: string, limit = 3): WikiSearchHit[] {
  const ranked = rankPages(getPages(), query);

  const hits: WikiSearchHit[] = [];
  for (const page of ranked) {
    const passages = extractPassages(query, page);
    if (passages.length === 0) continue;
    hits.push({
      titel: page.title,
      bereich: page.bereich,
      status: page.status,
      rohquellePfad: page.path,
      quelle: page.quelle,
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

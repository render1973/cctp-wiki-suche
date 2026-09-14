import { getVaultPages } from "./vault-corpus.js";
import { rankPages, extractPassages } from "./search-core.js";

export type VaultSearchHit = {
  titel: string;
  bereich: string;
  status: string;
  rohquellePfad: string;
  quelle?: string;
  textauszug: string;
};

export function searchVault(query: string, bereich?: string, limit = 3): VaultSearchHit[] {
  const pages = getVaultPages().filter((page) => !bereich || page.bereich === bereich);
  const ranked = rankPages(pages, query);

  const hits: VaultSearchHit[] = [];
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

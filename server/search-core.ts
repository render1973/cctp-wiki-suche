// Gemeinsame Textsuche-Logik für wiki/ (such_cctp_wiki) und den Vault
// (such_cctp_vault). Teil-1-Skalierungstest (600 Dateien, Vault) hat gezeigt:
// brauchbar in Antwortzeit und Top-Treffern, mit einer bekannten Schwäche
// (lange Katalog-/Index-Seiten scoren durch ihre Länge tendenziell zu hoch) —
// für v1 bewusst akzeptiert, siehe PR-Beschreibung.
export type SearchablePage = { title: string; body: string };

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9äöüß]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

export function scorePage(query: string, page: SearchablePage): number {
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

export function extractPassages(query: string, page: SearchablePage, limit = 3): string[] {
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

export function rankPages<T extends SearchablePage>(pages: T[], query: string): T[] {
  return pages
    .map((page) => ({ page, score: scorePage(query, page) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.page);
}

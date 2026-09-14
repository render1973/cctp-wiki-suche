// Gemeinsame Frontmatter-/Titel-Erkennung für wiki/ (eigene Konvention:
// "- Status: x") und den Obsidian-Vault (YAML-Frontmatter: "status: x").
export function parseTitle(body: string): string {
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "(ohne Titel)";
}

export function parseStatus(body: string): string {
  const frontmatter = body.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatter) {
    const yamlStatus = frontmatter[1].match(/^status:\s*(.+)$/im);
    if (yamlStatus) return yamlStatus[1].trim();
  }
  const listStatus = body.match(/^-\s*Status:\s*(.+)$/im);
  return listStatus ? listStatus[1].trim() : "unbekannt";
}

// Original-Quell-URL einer Seite (Frontmatter/Metadaten-Feld "quelle"/"link").
// Jeder Suchtreffer MUSS diesen Link sichtbar mitliefern, siehe README/Briefing
// "Ergänzung: Quellenlinks bei Suchergebnissen".
//
// Das Feld muss immer eine klickbare, vollständige URL sein — keine reine
// Textbeschreibung der Quelle (siehe Briefing "Quelle immer als klickbare
// URL"). Enthält der Rohtext bereits eine URL, wird er unverändert
// übernommen. Fehlt eine URL, aber liegt eine LinkedIn-`urn:li:activity`-
// Kennung vor, wird daraus die volle LinkedIn-URL rekonstruiert. Lässt sich
// keine URL ableiten, liefert die Funktion `undefined` statt einer
// Text-Näherung, die wie ein Link aussieht, aber keiner ist.
export function parseQuelle(body: string): string | undefined {
  const frontmatter = body.match(/^---\n([\s\S]*?)\n---/);
  let raw: string | undefined;
  if (frontmatter) {
    const yamlQuelle = frontmatter[1].match(/^(?:quelle|link):\s*(.+)$/im);
    if (yamlQuelle) raw = yamlQuelle[1].trim();
  }
  if (!raw) {
    const listQuelle = body.match(/^-\s*(?:Quelle|Link):\s*(.+)$/im);
    raw = listQuelle ? listQuelle[1].trim() : undefined;
  }
  if (!raw) return undefined;

  if (/https?:\/\/\S+/.test(raw)) return raw;

  const urnMatch = raw.match(/urn:li:activity:(\d+)/);
  if (urnMatch) {
    return `https://www.linkedin.com/feed/update/urn:li:activity:${urnMatch[1]}/`;
  }

  return undefined;
}

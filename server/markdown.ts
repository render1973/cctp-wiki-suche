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
export function parseQuelle(body: string): string | undefined {
  const frontmatter = body.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatter) {
    const yamlQuelle = frontmatter[1].match(/^(?:quelle|link):\s*(.+)$/im);
    if (yamlQuelle) return yamlQuelle[1].trim();
  }
  const listQuelle = body.match(/^-\s*(?:Quelle|Link):\s*(.+)$/im);
  return listQuelle ? listQuelle[1].trim() : undefined;
}

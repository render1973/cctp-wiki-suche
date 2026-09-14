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

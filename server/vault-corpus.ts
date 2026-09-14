import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseTitle, parseStatus, parseQuelle } from "./markdown.js";

// Bewusste Entscheidung (siehe Briefing "MCP-Vault-Lesezugriff"): dieser
// Server LIEST den Obsidian-Vault nur, aus dessen eigenem Checkout. Keine
// Kopie, keine Synchronisation, kein Schreibzugriff — `schreibe_wiki_seite`
// bleibt exklusiv für das eigene `wiki/`. Nur `10-wiki/` wird gelesen, nie
// `00-roharchiv` (Rohquellen) oder `99-admin` (Vault-interne Verwaltung).
export const VAULT_BEREICHE = [
  "forschung",
  "lehre",
  "personen",
  "entscheidungen",
  "buero",
  "dienstleistungen",
  "projekte",
] as const;

export type VaultBereich = (typeof VAULT_BEREICHE)[number];

export type VaultPage = {
  id: string;
  bereich: string;
  title: string;
  status: string;
  path: string;
  body: string;
  quelle?: string;
};

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(serverDir, "..");

/**
 * Pfad zum Vault-Checkout (Repo `cctp-knowledge-lab-vault`, lokal z. B.
 * `cctp-knowledge-lab`). Default: Geschwisterordner von diesem Repo, passend
 * zu Thomas' lokalem Setup. Per `CCTP_VAULT_PATH` überschreibbar, z. B. für
 * einen anderen Checkout-Ort oder (künftig) einen Cloud-Container.
 */
export function resolveVaultRoot(): string {
  const override = process.env.CCTP_VAULT_PATH?.trim();
  if (override) return override;
  return path.resolve(repoRoot, "..", "cctp-knowledge-lab");
}

export function vaultWikiRoot(): string {
  return path.join(resolveVaultRoot(), "10-wiki");
}

export function isVaultAvailable(): boolean {
  return existsSync(vaultWikiRoot());
}

function walkMarkdownFiles(dir: string, acc: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkMarkdownFiles(full, acc);
    } else if (entry.endsWith(".md")) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Liest den Vault bei jedem Aufruf neu von der Platte (wie `getPages()` für
 * `wiki/`) — kein In-Memory-Index, kein Caching zwischen Aufrufen.
 */
export function getVaultPages(): VaultPage[] {
  const wikiRoot = vaultWikiRoot();
  const pages: VaultPage[] = [];
  for (const bereich of VAULT_BEREICHE) {
    const dir = path.join(wikiRoot, bereich);
    for (const filePath of walkMarkdownFiles(dir)) {
      const body = readFileSync(filePath, "utf-8");
      pages.push({
        id: path.basename(filePath, ".md"),
        bereich,
        title: parseTitle(body),
        status: parseStatus(body),
        path: "10-wiki/" + path.relative(wikiRoot, filePath).split(path.sep).join("/"),
        body,
        quelle: parseQuelle(body),
      });
    }
  }
  return pages;
}

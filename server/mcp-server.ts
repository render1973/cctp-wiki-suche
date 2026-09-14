import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchWiki, listWikiPages } from "./search.js";
import { searchVault } from "./vault-search.js";
import { isVaultAvailable, resolveVaultRoot, vaultWikiRoot, VAULT_BEREICHE } from "./vault-corpus.js";
import { ensureVaultCloned } from "./vault-git.js";
import { schreibeWikiSeite, type SchreibeWikiSeiteResult } from "./write.js";
import { BEREICHE } from "./corpus.js";

export type WikiServerContext = {
  /** Nur im HTTP-Modus gesetzt: aus dem Bearer-Token aufgelöste Identität. */
  autor?: { name: string; email: string };
  /** Nur im HTTP-Modus gesetzt: committet+pusht nach erfolgreichem Schreiben. */
  afterWrite?: (result: Extract<SchreibeWikiSeiteResult, { ok: true }>) => Promise<void>;
};

/**
 * Baut einen frischen McpServer mit den drei CCTP-Wiki-Tools. Im stdio-Modus
 * (lokal, Thomas) wird ohne Context aufgerufen: Verhalten unverändert wie vor
 * dem Cloud-Umbau, kein Autor-Feld, kein automatischer Commit/Push. Im
 * HTTP-Modus wird pro Request ein neuer Server mit der aufgelösten Identität
 * im Closure gebaut.
 */
export function createWikiMcpServer(context: WikiServerContext = {}): McpServer {
  const server = new McpServer({
    name: "cctp-wiki-suche",
    version: "2.0.0",
  });

  const bereichEnum = z.enum(BEREICHE);

  server.tool(
    "such_cctp_wiki",
    "Durchsucht das CCTP-Wiki (alle sieben Bereiche unter wiki/) und gibt pro Treffer Seitentitel, Bereich, Status, Rohquelle-Pfad, Quell-URL (Feld `quelle`) und den relevanten Textausschnitt zurück. " +
      "Gib bei jedem Treffer die vollständige Quell-URL aus dem Feld `quelle` mit aus, sichtbar im Ergebnis — nicht nur den Titel und Textauszug. Zeig die Links immer direkt an, ohne dass danach gefragt werden muss.",
    { query: z.string().trim().min(2).describe("Suchbegriff oder Frage an das Wiki") },
    async ({ query }) => {
      const hits = searchWiki(query);
      if (hits.length === 0) {
        return { content: [{ type: "text", text: "Keine Treffer im CCTP-Wiki." }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(hits, null, 2) }] };
    },
  );

  const vaultBereichEnum = z.enum(VAULT_BEREICHE);

  server.tool(
    "such_cctp_vault",
    "Durchsucht LESEND den Obsidian-Vault cctp-knowledge-lab (10-wiki/, Bereiche " +
      VAULT_BEREICHE.join(", ") +
      ") und gibt pro Treffer Seitentitel, Bereich, Status, Rohquelle-Pfad und den relevanten " +
      "Textausschnitt zurück. Enthält das eigentliche CCTP-Wissen (Forschungsprojekte, Personen, " +
      "Lehre, Methoden-Katalog) — viel umfangreicher als such_cctp_wiki. Nur Lesezugriff: dieses " +
      "Werkzeug schreibt nie in den Vault, dafür bleibt schreibe_wiki_seite exklusiv für das " +
      "eigene wiki/. " +
      "Gib bei jedem Treffer die vollständige Quell-URL aus dem Feld `quelle` mit aus, sichtbar im " +
      "Ergebnis — nicht nur den Titel und Textauszug. Zeig die Links immer direkt an, ohne dass " +
      "danach gefragt werden muss.",
    {
      query: z.string().trim().min(2).describe("Suchbegriff oder Frage an den Vault"),
      bereich: vaultBereichEnum
        .optional()
        .describe("Auf einen Vault-Bereich einschränken: " + VAULT_BEREICHE.join(", ")),
    },
    async ({ query, bereich }) => {
      try {
        await ensureVaultCloned(resolveVaultRoot());
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Vault-Checkout konnte nicht angelegt werden: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
      if (!isVaultAvailable()) {
        return {
          content: [
            {
              type: "text",
              text:
                `Vault nicht gefunden unter ${vaultWikiRoot()}. Lokalen Checkout von ` +
                "cctp-knowledge-lab prüfen oder Pfad über die Umgebungsvariable CCTP_VAULT_PATH setzen.",
            },
          ],
          isError: true,
        };
      }
      const hits = searchVault(query, bereich);
      if (hits.length === 0) {
        return { content: [{ type: "text", text: "Keine Treffer im Vault." }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(hits, null, 2) }] };
    },
  );

  server.tool(
    "liste_cctp_wiki_seiten",
    "Gibt die Tabelle aller CCTP-Wiki-Seiten mit Titel, Bereich, Datei und Status zurück, optional gefiltert auf einen Bereich.",
    {
      bereich: bereichEnum
        .optional()
        .describe("Auf einen Bereich einschränken: " + BEREICHE.join(", ")),
    },
    async ({ bereich }) => {
      return { content: [{ type: "text", text: JSON.stringify(listWikiPages(bereich), null, 2) }] };
    },
  );

  server.tool(
    "schreibe_wiki_seite",
    "Schreibt eine neue Wiki-Seite (oder überschreibt eine bestehende) unter wiki/<bereich>/<dateiname>.md. " +
      "Bereich muss einer der sieben Bereiche sein: " + BEREICHE.join(", ") + ". " +
      "`projekte/` ist Meta-only: nur Förderer, Methoden, Learnings, keine vertraulichen Projektinhalte. " +
      "`inhalt` ist der vollständige Markdown-Text inkl. `# Titel` und einer Metadaten-Liste " +
      "(u. a. `- Status: entwurf`); nur Thomas Heim vergibt die Status `geprueft` oder `freigegeben`, " +
      "das Werkzeug lehnt diese Status ab. Der Autor wird serverseitig aus dem Token bestimmt, " +
      "eine mitgelieferte \"- Autor:\"-Zeile wird ignoriert. " +
      "Bei inhaltlichen Widersprüchen zu einer bestehenden Seite die exakte Formulierung verwenden: " +
      '"Stand [Datum]: X. Update [Datum]: Y — Widerspruch/Weiterentwicklung."',
    {
      bereich: bereichEnum.describe("Zielbereich, einer der sieben Wiki-Bereiche"),
      dateiname: z
        .string()
        .trim()
        .min(1)
        .describe("Dateiname als Slug ohne .md, z. B. \"innosuisse-innocheck\""),
      inhalt: z.string().trim().min(1).describe("Vollständiger Markdown-Inhalt der Seite"),
      ueberschreiben: z
        .boolean()
        .optional()
        .describe("true, um eine bestehende Datei am selben Pfad zu überschreiben"),
    },
    async ({ bereich, dateiname, inhalt, ueberschreiben }) => {
      const result = schreibeWikiSeite({ bereich, dateiname, inhalt, ueberschreiben, autor: context.autor });
      if (!result.ok) {
        return { content: [{ type: "text", text: `Fehler: ${result.fehler}` }], isError: true };
      }
      if (context.afterWrite) {
        try {
          await context.afterWrite(result);
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Seite lokal geschrieben (${result.pfad}), aber Commit/Push fehlgeschlagen: ${(error as Error).message}. Bitte erneut versuchen.`,
              },
            ],
            isError: true,
          };
        }
        return { content: [{ type: "text", text: `Seite geschrieben und veröffentlicht: ${result.pfad}` }] };
      }
      return { content: [{ type: "text", text: `Seite geschrieben: ${result.pfad}` }] };
    },
  );

  return server;
}

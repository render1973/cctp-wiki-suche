#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchWiki, listWikiPages } from "./search.js";
import { schreibeWikiSeite } from "./write-wiki.js";

const server = new McpServer({
  name: "cctp-wiki-suche",
  version: "1.0.0",
});

server.tool(
  "such_cctp_wiki",
  "Durchsucht die fünf freigegebenen CCTP-Wiki-Seiten sowie alle Entwurfsseiten unter wiki/ (rekursiv, von schreibe_wiki_seite angelegt) und gibt pro Treffer Seitentitel, Status, Rohquelle-Pfad und den relevanten Textausschnitt zurück.",
  { query: z.string().trim().min(2).describe("Suchbegriff oder Frage an das Wiki") },
  async ({ query }) => {
    const hits = await searchWiki(query);
    if (hits.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "Keine Treffer im Wiki-Bestand (fünf freigegebene Seiten plus Entwürfe unter wiki/).",
          },
        ],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(hits, null, 2) }],
    };
  },
);

server.tool(
  "liste_cctp_wiki_seiten",
  "Gibt die Tabelle aller CCTP-Wiki-Seiten mit Titel, Datei und Status zurück — die fünf freigegebenen Seiten sowie alle Entwurfsseiten unter wiki/ (rekursiv).",
  {},
  async () => {
    return {
      content: [{ type: "text", text: JSON.stringify(await listWikiPages(), null, 2) }],
    };
  },
);

server.tool(
  "schreibe_wiki_seite",
  "Legt eine neue Wiki-Entwurfsseite an oder ergänzt eine bestehende Seite (Titel-Treffer) im CCTP-Wiki. Überschreibt nie, sondern ergänzt mit einem datierten Update-Abschnitt. Neue Seiten erhalten immer Status 'entwurf' — nie automatisch 'geprueft' oder 'freigegeben'. Committet und pusht die Änderung. Danach sofort über such_cctp_wiki / liste_cctp_wiki_seiten auffindbar.",
  {
    bereich: z
      .string()
      .trim()
      .min(1)
      .describe("Ordner innerhalb des Wikis, z. B. 'entscheidungen' oder 'forschung'"),
    titel: z.string().trim().min(1).describe("Titel der Wiki-Seite (dient auch als Treffer für Ergänzungen)"),
    inhalt: z.string().trim().min(1).describe("Neuer Inhalt bzw. Ergänzung als Markdown/Text"),
    autor: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe("Autor:in; falls nicht angegeben, aus dem Git-Commit-Kontext abgeleitet"),
  },
  async ({ bereich, titel, inhalt, autor }) => {
    try {
      const result = await schreibeWikiSeite({ bereich, titel, inhalt, autor });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);

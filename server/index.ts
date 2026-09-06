#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchWiki, listWikiPages } from "./search.js";

const server = new McpServer({
  name: "cctp-wiki-suche",
  version: "1.0.0",
});

server.tool(
  "such_cctp_wiki",
  "Durchsucht die fünf freigegebenen CCTP-Wiki-Seiten und gibt pro Treffer Seitentitel, Status, Rohquelle-Pfad und den relevanten Textausschnitt zurück.",
  { query: z.string().trim().min(2).describe("Suchbegriff oder Frage an das Wiki") },
  async ({ query }) => {
    const hits = searchWiki(query);
    if (hits.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "Keine Treffer in den fünf freigegebenen Wiki-Seiten.",
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
  "Gibt die Tabelle aller fünf freigegebenen CCTP-Wiki-Seiten mit Titel, Datei und Status zurück.",
  {},
  async () => {
    return {
      content: [{ type: "text", text: JSON.stringify(listWikiPages(), null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);

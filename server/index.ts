#!/usr/bin/env node
// Lokaler stdio-Einstiegspunkt. Unverändert seit dem Struktur-Umbau: kein
// Token, kein Autor-Feld, kein automatischer Commit/Push - das bleibt
// Thomas' manueller Schritt (bzw. der begleitenden Claude-Code-Session).
// Für den gehosteten Mehrpersonen-Betrieb siehe server/http.ts.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createWikiMcpServer } from "./mcp-server.js";

const server = createWikiMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);

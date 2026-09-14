#!/usr/bin/env node
// Gehosteter HTTP-Einstiegspunkt (Railway). Pro-Person-Bearer-Token -> Klarname,
// pro Request ein frischer McpServer mit dieser Identität im Closure, Commit+
// Push nach jedem erfolgreichen schreibe_wiki_seite. Stateless Streamable HTTP
// (kein Session-Handshake) - aktuell empfohlene MCP-HTTP-Transportvariante,
// siehe README.
import { createServer, type IncomingHttpHeaders } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createWikiMcpServer } from "./mcp-server.js";
import { resolveToken, assertTokenConfigPresent } from "./auth.js";
import { commitAndPushWikiChange, pullLatest } from "./git.js";
import { pullVaultLatest } from "./vault-git.js";
import { resolveVaultRoot } from "./vault-corpus.js";

const PORT = Number(process.env.PORT ?? 8080);
const HINTERGRUND_PULL_INTERVALL_MS = 5 * 60 * 1000;
const MCP_PFAD = "/mcp";

// Beim Start hart scheitern, wenn WIKI_TOKENS fehlt/kaputt ist, statt erst bei
// der ersten Anfrage - macht Fehlkonfiguration sofort im Railway-Log sichtbar.
assertTokenConfigPresent();

function extractBearerToken(header: IncomingHttpHeaders["authorization"]): string | undefined {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value?.startsWith("Bearer ")) return undefined;
  const token = value.slice("Bearer ".length).trim();
  return token.length > 0 ? token : undefined;
}

function sendJson(res: import("node:http").ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" }).end(JSON.stringify(body));
}

const httpServer = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" }).end(
      "cctp-wiki-suche MCP-Server läuft.\nEndpunkt: POST /mcp\nAuthorization: Bearer <token> erforderlich.\n",
    );
    return;
  }

  if (req.method !== "POST" || req.url !== MCP_PFAD) {
    sendJson(res, 404, { error: `Nicht gefunden. Endpunkt: POST ${MCP_PFAD}` });
    return;
  }

  let user;
  try {
    user = resolveToken(extractBearerToken(req.headers.authorization));
  } catch (error) {
    console.error("Token-Konfigurationsfehler:", error);
    sendJson(res, 500, { error: "Server-Konfigurationsfehler (Tokens). Administrator informieren." });
    return;
  }
  if (!user) {
    sendJson(res, 401, { error: "Ungültiges oder fehlendes Token. Header: Authorization: Bearer <token>" });
    return;
  }

  const mcpServer = createWikiMcpServer({
    autor: user,
    afterWrite: async (result) => {
      await commitAndPushWikiChange({
        relPath: result.pfad,
        author: user,
        message: `Wiki: ${result.pfad} (${user.name})`,
      });
    },
  });
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on("close", () => {
    transport.close();
    mcpServer.close();
  });

  try {
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("MCP-Request-Fehler:", error);
    if (!res.headersSent) {
      sendJson(res, 500, { error: "Interner Serverfehler." });
    }
  }
});

httpServer.listen(PORT, () => {
  console.log(`cctp-wiki-suche (HTTP) läuft auf Port ${PORT}, Endpunkt POST ${MCP_PFAD}`);
});

setInterval(() => {
  pullLatest().catch((error) => console.error("Hintergrund-Pull fehlgeschlagen:", error));
}, HINTERGRUND_PULL_INTERVALL_MS);

// Rein lesend, unabhängig vom Wiki-Repo-Pull oben: läuft ins Leere, bis der
// erste such_cctp_vault-Aufruf den Vault-Checkout angelegt hat.
setInterval(() => {
  pullVaultLatest(resolveVaultRoot()).catch((error) =>
    console.error("Vault-Hintergrund-Pull fehlgeschlagen:", error),
  );
}, HINTERGRUND_PULL_INTERVALL_MS);

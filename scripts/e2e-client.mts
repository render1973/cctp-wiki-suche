// Echter MCP-Client (offizielles SDK, Streamable HTTP) für die End-to-End-
// Verifikation aus dem README: Anfrage ohne Token -> abgewiesen, Token A
// schreibt, Token B liest, ungültiges Token -> abgewiesen.
//
// Aufruf: MCP_URL=http://localhost:8091/mcp TOKEN_A=... TOKEN_B=... npx tsx scripts/e2e-client.mts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const BASE_URL = process.env.MCP_URL ?? "http://localhost:8091/mcp";
const TOKEN_A = process.env.TOKEN_A ?? "tok-a-geheim";
const TOKEN_B = process.env.TOKEN_B ?? "tok-b-geheim";

async function callTool(token: string | undefined, name: string, args: Record<string, unknown>) {
  const transport = new StreamableHTTPClientTransport(new URL(BASE_URL), {
    requestInit: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
  });
  const client = new Client({ name: "e2e-verifikations-client", version: "1.0.0" });
  await client.connect(transport);
  try {
    return await client.callTool({ name, arguments: args });
  } finally {
    await client.close();
  }
}

let exitCode = 0;
const marker = `E2EVerifikationsmarker${Date.now()}`;

console.log(`--- Ziel: ${BASE_URL} ---`);

console.log("\n--- Schritt 1: Anfrage ohne Token muss abgewiesen werden ---");
try {
  await callTool(undefined, "such_cctp_wiki", { query: "Test" });
  console.log("FEHLER: Anfrage ohne Token wurde NICHT abgewiesen!");
  exitCode = 1;
} catch (error) {
  console.log("OK: abgewiesen:", (error as Error).message);
}

console.log("\n--- Schritt 2: Token A schreibt eine echte Seite ---");
const schreibResultat = await callTool(TOKEN_A, "schreibe_wiki_seite", {
  bereich: "foerdergeber",
  dateiname: `e2e-verifikation-${Date.now()}`,
  inhalt:
    `# E2E-Verifikation Cloud-Umbau\n\n- Status: entwurf\n- Autor: Behauptete Fremdperson (sollte überschrieben werden)\n\n` +
    `Testinhalt zur Verifikation von HTTP-Transport, Token-Auth und Git-Commit/Push. Marker: ${marker}\n`,
});
console.log(JSON.stringify(schreibResultat, null, 2));

console.log("\n--- Schritt 3: Token B findet die Seite über such_cctp_wiki ---");
const sucheResultat = await callTool(TOKEN_B, "such_cctp_wiki", { query: marker });
console.log(JSON.stringify(sucheResultat, null, 2));
const gefunden = JSON.stringify(sucheResultat).includes(marker);
console.log(gefunden ? "OK: Token B hat die Seite gefunden." : "FEHLER: Token B hat die Seite NICHT gefunden.");
if (!gefunden) exitCode = 1;

console.log("\n--- Schritt 4: Ungültiges Token muss abgewiesen werden ---");
try {
  await callTool("dieses-token-existiert-nicht", "such_cctp_wiki", { query: "Test" });
  console.log("FEHLER: Ungültiges Token wurde NICHT abgewiesen!");
  exitCode = 1;
} catch (error) {
  console.log("OK: abgewiesen:", (error as Error).message);
}

process.exit(exitCode);

# CCTP Wiki-Suche

Lokaler MCP-Server (stdio, [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk)) für die fünf freigegebenen Wiki-Seiten des CCTP Knowledge Lab. Der Server liefert nur Rohtreffer aus diesem Bestand — Seitentitel, Status, Rohquelle-Pfad und Textausschnitt. Das Formulieren der Antwort übernimmt der MCP-Client (z. B. Claude Desktop oder Claude Code), nicht dieses Repo.

CDE und DMS bleiben für verbindliche Projekt-, Rechts- und Normunterlagen führend.

## Bestand

| Seite | Datei |
| --- | --- |
| Entscheidung: Roharchiv plus Wiki statt nur Chat-Suche | `server/wiki/entscheidung.md` |
| Lektion: Wissensarchitekturen in Digital Construction | `server/wiki/lektion.md` |
| Forschungsfall: Qualität, Auffindbarkeit und Wartbarkeit von Wissen | `server/wiki/forschungsfall.md` |
| Demo 2026-08-15: Chat, Dateisuche, Wiki | `server/wiki/demo.md` |
| Knowledge Architecture Sprint | `server/wiki/sprint.md` |

Status der Seiten: `freigegeben`. Status und fachliche Prüfung setzt allein Thomas Heim.

## Tools

- `such_cctp_wiki(query: string)` — durchsucht die fünf Seiten und gibt pro Treffer Titel, Status, Rohquelle-Pfad und den relevanten Textausschnitt zurück.
- `liste_cctp_wiki_seiten()` — gibt die Tabelle aller fünf Seiten mit Titel, Datei und Status zurück.

## Lokal starten

Voraussetzungen: Node.js 20 oder neuer.

```bash
npm install
npm test    # Tests für beide Tools
npm start   # startet den MCP-Server auf stdio (zum manuellen Testen)
```

`npm start` allein ist zum Ausprobieren gedacht — im Alltag startet der MCP-Client (Claude Desktop / Claude Code) den Server selbst, siehe unten.

## In Claude Desktop einbinden

In der `claude_desktop_config.json` (Claude Desktop → Einstellungen → Developer → Edit Config) einen Eintrag ergänzen:

```json
{
  "mcpServers": {
    "cctp-wiki-suche": {
      "command": "npx",
      "args": ["tsx", "/absoluter/pfad/zu/cctp-wiki-suche/server/index.ts"]
    }
  }
}
```

Absoluten Pfad anpassen, Claude Desktop neu starten. Die beiden Tools erscheinen danach im Werkzeug-Menü.

## In Claude Code einbinden

```bash
claude mcp add cctp-wiki-suche -- npx tsx /absoluter/pfad/zu/cctp-wiki-suche/server/index.ts
```

Oder per `.mcp.json` im Projekt, das die Suche nutzen soll:

```json
{
  "mcpServers": {
    "cctp-wiki-suche": {
      "command": "npx",
      "args": ["tsx", "/absoluter/pfad/zu/cctp-wiki-suche/server/index.ts"]
    }
  }
}
```

## Was dieses Repo nicht ist

- Kein Ersatz für CDE oder DMS
- Kein Roharchiv. Originalquellen bleiben unverändert
- Keine Freigabe-Instanz. `geprueft` und `freigegeben` setzt nur Thomas Heim
- Kein Chat und kein Antwortgenerator. Der MCP-Server liefert Rohtreffer, formuliert aber keine Antwort — das macht der anfragende MCP-Client

## Lizenz

MIT. Siehe `LICENSE`.

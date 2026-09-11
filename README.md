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

Der Rohquelle-Pfad, den `such_cctp_wiki` zurückgibt, zeigt auf die unveränderte Originalquelle im Roharchiv (`00-roharchiv/…`) — nicht auf die Wiki-Seite selbst. Das ist die eigentliche Belegstelle; die Wiki-Seite ist nur die daraus verdichtete Fassung.

## Tools

- `such_cctp_wiki(query: string)` — durchsucht die fünf Seiten und gibt pro Treffer Titel, Status, Rohquelle-Pfad (im Roharchiv) und den relevanten Textausschnitt zurück.
- `liste_cctp_wiki_seiten()` — gibt die Tabelle aller fünf Seiten mit Titel, Datei und Status zurück.
- `schreibe_wiki_seite(bereich, titel, inhalt, autor?)` — legt eine neue Wiki-Entwurfsseite an oder ergänzt eine bestehende Seite bei Titel-Treffer. Details siehe unten.

### `schreibe_wiki_seite` im Detail

Schreibt in eine neue, separate Wiki-Struktur unter `wiki/` im Repo-Root — bewusst getrennt vom festen Fünf-Seiten-Bestand oben, den `such_cctp_wiki` durchsucht. Diese neuen Seiten fliessen (noch) nicht in die Suche ein; das ist ein bewusst offener, späterer Schritt.

- **Neue Seite:** wird unter `wiki/<bereich>/<titel-als-dateiname>.md` angelegt, mit Titel, Datum, Autor:in und Status `entwurf`. Der Server setzt nie automatisch `geprueft` oder `freigegeben` — das bleibt Menschenarbeit, wie beim übrigen Bestand.
- **Bestehende Seite (exakter Titel-Treffer, irgendwo unter `wiki/`):** wird nicht überschrieben. Stattdessen wird ein datierter Abschnitt `## Update <Datum> (<Autor:in>)` angehängt, der den bisherigen Stand referenziert und den neuen Inhalt explizit als Ergänzung oder Widerspruch kennzeichnet — nach dem Muster „Stand [Datum]: … Update [Datum]: … — Widerspruch/Weiterentwicklung.“
- **Autor:in:** wird, falls nicht angegeben, aus dem lokalen Git-Kontext abgeleitet (`git config user.name`, sonst `user.email`) — nicht erfragt.
- **Nach dem Schreiben:** committet und pusht der Server die Änderung automatisch (nur die betroffene Datei, nicht andere offene Änderungen im Repo). Schlägt der Push fehl (z. B. kein Remote, kein Netz), bleibt der Commit lokal stehen und die Antwort weist darauf hin.
- **Rückgabe:** Pfad der Datei, ob eine neue Seite entstand oder eine bestehende ergänzt wurde, eine kurze Bestätigung, sowie der Git-Status (`committed`, `pushed`, ggf. `hinweis`).

## Lokal starten

Voraussetzungen: Node.js 20 oder neuer.

```bash
npm install
npm test    # Tests für alle drei Tools
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

Absoluten Pfad anpassen, Claude Desktop neu starten. Die drei Tools erscheinen danach im Werkzeug-Menü.

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

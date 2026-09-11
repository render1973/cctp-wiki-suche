# CCTP Wiki-Suche

Lokaler MCP-Server (stdio, [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk)) für das CCTP-Wiki. Der Server liest die Markdown-Seiten unter `wiki/` von der Platte, durchsucht sie und liefert nur Rohtreffer — Seitentitel, Bereich, Status, Rohquelle-Pfad und Textausschnitt. Das Formulieren der Antwort übernimmt der MCP-Client (z. B. Claude Desktop oder Claude Code), nicht dieses Repo.

CDE und DMS bleiben für verbindliche Projekt-, Rechts- und Normunterlagen führend.

## Ordnerstruktur `wiki/`

```
wiki/
├── entscheidungen/    Architektur- und Governance-Entscheide
├── buero/             Interne Büro-/Betriebsthemen
├── projekte/          Meta-only: Förderer, Methoden, Learnings
├── lehre/             Lektionen, Module, Kursmaterial
├── forschung/         Forschungsfälle, Demos, Befunde
├── dienstleistungen/  Angebote, Sprints, Leistungsmodule
└── foerdergeber/      Eine Seite pro Förderstelle (Innosuisse, SNF, …)
```

Sechs Hauptbereiche stammen aus der primären CCTP-Taxonomie (cctp-knowledge-lab-Obsidian-Vault); `foerdergeber/` kommt aus dem separaten Wiki-2-Konzept — übernommen wurde dort nur die Struktur/Konvention, nicht dessen Cowork-Scheduled-Task-Ingest-Mechanismus.

**`projekte/` ist Meta-only:** Es liegen dort ausschliesslich Förderer, eingesetzte Methoden und Learnings. Keine vertraulichen Projektinhalte — die liegen separat in AnythingLLM/lokalen Workspaces.

Leere Bereiche enthalten eine `.gitkeep`-Datei, da Git leere Ordner nicht trackt.

## Konventionen

- **Status:** `entwurf`, `zu-pruefen`, `geprueft`, `freigegeben`, `ueberholt`. Nur Thomas Heim vergibt `geprueft` und `freigegeben` — `schreibe_wiki_seite` lehnt diese Status automatisiert ab.
- **Widersprüche/Weiterentwicklung:** Bei inhaltlichen Widersprüchen zu einer bestehenden Aussage die exakte Formulierung verwenden:
  `"Stand [Datum]: X. Update [Datum]: Y — Widerspruch/Weiterentwicklung."`

## Bestand

| Seite | Datei |
| --- | --- |
| Entscheidung: Roharchiv plus Wiki statt nur Chat-Suche | `wiki/entscheidungen/roharchiv-plus-wiki.md` |
| Lektion: Wissensarchitekturen in Digital Construction | `wiki/lehre/wissensarchitekturen-digital-construction.md` |
| Forschungsfall: Qualität, Auffindbarkeit und Wartbarkeit von Wissen | `wiki/forschung/qualitaet-auffindbarkeit-wissenslab.md` |
| Demo 2026-08-15: Chat, Dateisuche, Wiki | `wiki/forschung/demo-2026-08-15-drei-schichten.md` |
| Knowledge Architecture Sprint | `wiki/dienstleistungen/knowledge-architecture-sprint.md` |

Status der bestehenden Seiten: `freigegeben`.

## Tools

- `such_cctp_wiki(query: string)` — durchsucht alle sieben Bereiche und gibt pro Treffer Titel, Bereich, Status, Rohquelle-Pfad und den relevanten Textausschnitt zurück.
- `liste_cctp_wiki_seiten(bereich?: string)` — gibt die Tabelle aller Seiten mit Titel, Bereich, Datei und Status zurück, optional auf einen Bereich gefiltert.
- `schreibe_wiki_seite(bereich, dateiname, inhalt, ueberschreiben?)` — schreibt eine neue Seite unter `wiki/<bereich>/<dateiname>.md`. `bereich` muss einer der sieben oben genannten sein; `inhalt` ist der vollständige Markdown-Text inkl. `# Titel` und Metadaten-Liste. Status `geprueft`/`freigegeben` wird abgelehnt. Bestehende Dateien werden nur mit `ueberschreiben: true` überschrieben.

## Lokal starten

Voraussetzungen: Node.js 20 oder neuer.

```bash
npm install
npm test    # Tests für alle drei Tools, inkl. Schreiben-dann-Finden-Rundlauf
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

# CCTP Wiki-Suche

MCP-Server ([`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk)) für das CCTP-Wiki, in zwei Betriebsarten:

- **stdio, lokal** — läuft als Subprozess auf einem Rechner, nur für die Person, die ihn startet. Ursprüngliche Betriebsart, unverändert.
- **HTTP, gehostet (Railway)** — läuft dauerhaft als Container, erreichbar für bis zu ~10 Kolleg:innen ohne lokale Installation, mit Pro-Person-Token. Für HSLU-Arbeitsrechner ohne Admin-Rechte gedacht.

Der Server liest die Markdown-Seiten unter `wiki/` von der Platte, durchsucht sie und liefert nur Rohtreffer — Seitentitel, Bereich, Status, Rohquelle-Pfad und Textausschnitt. Das Formulieren der Antwort übernimmt der MCP-Client (z. B. Claude Desktop oder Claude Code), nicht dieses Repo.

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
  - **Im HTTP-Modus** wird der Autor serverseitig aus dem Bearer-Token bestimmt und als `- Autor: <Klarname>` in die Seite eingesetzt; eine selbst mitgelieferte Autor-Zeile wird verworfen. Anschliessend committet und pusht der Server automatisch (siehe unten). **Im stdio-Modus** passiert das nicht — kein Autor-Feld, kein automatischer Commit/Push, wie bisher.

## Lokal starten (stdio)

Voraussetzungen: Node.js 20 oder neuer.

```bash
npm install
npm test    # Tests für alle Tools, inkl. Schreiben-dann-Finden-Rundlauf und Git-Commit/Push-Logik
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

## Gehosteten Server nutzen (HTTP, für Kolleg:innen)

Kein lokaler Node-Prozess nötig. Voraussetzung: ein Token von Thomas Heim.

In der Client-Konfiguration (Claude Desktop, Claude Code, oder ein anderer MCP-Client mit HTTP/Streamable-HTTP-Unterstützung) einen Remote-Server mit URL und Bearer-Token eintragen, z. B. in `.mcp.json`:

```json
{
  "mcpServers": {
    "cctp-wiki-suche": {
      "type": "http",
      "url": "https://<railway-domain>/mcp",
      "headers": {
        "Authorization": "Bearer <dein-token>"
      }
    }
  }
}
```

`<railway-domain>` und `<dein-token>` von Thomas erfragen. `git config user.name` spielt für die Server-Nutzung **keine Rolle mehr** — die Autorschaft von geschriebenen Seiten kommt ausschliesslich aus dem Token-Mapping auf dem Server, nicht aus lokalen Git-Einstellungen.

Ohne gültiges Token weist der Server jede Anfrage mit HTTP 401 zurück.

## Für Thomas: Token verwalten

Tokens leben ausschliesslich in der Railway-Umgebungsvariable `WIKI_TOKENS` (JSON), nie im Code oder Repo:

```json
{
  "<beliebiger-langer-zufallstoken-A>": { "name": "Vorname Nachname", "email": "vorname.nachname@hslu.ch" },
  "<beliebiger-langer-zufallstoken-B>": { "name": "Andere Person", "email": "andere.person@hslu.ch" }
}
```

Token ergänzen/entziehen: `WIKI_TOKENS` in Railway unter **Variables** bearbeiten, dann redeployen (Railway macht das bei einer Variablenänderung in der Regel automatisch; falls nicht, manuell **Deploy** klicken). Kein Code-Änderung nötig. Ein brauchbarer Zufallstoken lässt sich z. B. so erzeugen: `openssl rand -hex 24`.

## Deployment auf Railway

1. Neues Railway-Projekt aus diesem GitHub-Repo anlegen (Railway erkennt das `Dockerfile` im Repo-Root automatisch; falls nicht, unter **Settings → Build** den Dockerfile-Build explizit wählen).
2. Unter **Variables** setzen:

   | Variable | Pflicht | Zweck |
   | --- | --- | --- |
   | `WIKI_TOKENS` | ja | Token → Klarname/E-Mail-Mapping (siehe oben) |
   | `WIKI_GIT_TOKEN` | empfohlen | GitHub-PAT mit Schreibrecht auf dieses Repo, für den Push. Ohne diese Variable versucht der Server `git push origin`, was im Container ohne hinterlegte Credentials fehlschlägt |
   | `WIKI_GIT_BRANCH` | nur falls nötig | Fallback-Branch, falls der Checkout im Container jemals mit detached HEAD startet (bekannter Fallstrick — der Server ermittelt den Branch sonst immer explizit selbst) |
   | `WIKI_GIT_COMMITTER_NAME` / `WIKI_GIT_COMMITTER_EMAIL` | nein | Überschreibt die Bot-Committer-Identität (Default: "CCTP Wiki Bot"). Der inhaltliche Autor kommt immer aus `WIKI_TOKENS`, unabhängig davon |
   | `PORT` | nein | Setzt Railway automatisch |

3. Domain generieren: **Settings → Networking → Generate Domain**.
4. Nach jeder Änderung von `WIKI_TOKENS` oder `WIKI_GIT_TOKEN`: Redeploy abwarten, bevor die Änderung wirkt.
5. Prüfen: `https://<railway-domain>/` im Browser öffnen — sollte eine kurze Textantwort liefern (Server läuft). Der eigentliche MCP-Endpunkt ist `POST /mcp` und braucht einen MCP-Client, kein Browser-GET.

**Bewusst nicht Vercel** — an 4.5-MB-Body-Limit und 60s-Timeout ist eine frühere Variante dieser Projektlinie bereits gescheitert.

### Architektur: Commit/Push im Container

Der lokale stdio-Modus committet/pusht nichts selbst — das erledigte bisher die begleitende Claude-Code-Session per Bash. Im HTTP-Modus gibt es keine solche Session neben dem MCP-Client der Kolleg:innen, also übernimmt der Server das selbst (`server/git.ts`): nach jedem erfolgreichen `schreibe_wiki_seite`

1. `git pull --rebase origin <branch>` (Branch immer frisch per `git rev-parse --abbrev-ref HEAD` ermittelt, nie hartcodiert),
2. `git add` + `git commit --author "<Klarname> <E-Mail>" ...` (Committer bleibt der Bot),
3. `git push` — mit `WIKI_GIT_TOKEN` direkt in die Remote-URL eingesetzt statt via `credential.helper store` auf Platte persistiert (der lokale Ansatz passte nicht zum Container).

Schreiben zwei Personen gleichzeitig auf demselben Server-Prozess, serialisiert eine einfache In-Process-Warteschlange die Git-Operationen. Wird der Push dennoch zurückgewiesen (z. B. weil parallel jemand direkt auf GitHub gepusht hat), rebast der Server auf den neuen Stand und versucht es erneut — bis zu dreimal. Ausserdem pullt der Server alle fünf Minuten im Hintergrund, damit Lesezugriffe nicht veralten, falls extern (z. B. von Thomas direkt) auf denselben Branch gepusht wurde.

**Bekannte Grenze:** Der Server hält genau eine lokale Arbeitskopie. Bei mehreren gleichzeitigen Railway-Instanzen (Skalierung) müsste jede ihre eigene Arbeitskopie synchron halten — für den aktuellen Massstab (bis ~10 Personen, eine Instanz) nicht relevant.

## Was dieses Repo nicht ist

- Kein Ersatz für CDE oder DMS
- Kein Roharchiv. Originalquellen bleiben unverändert
- Keine Freigabe-Instanz. `geprueft` und `freigegeben` setzt nur Thomas Heim
- Kein Chat und kein Antwortgenerator. Der MCP-Server liefert Rohtreffer, formuliert aber keine Antwort — das macht der anfragende MCP-Client

## Lizenz

MIT. Siehe `LICENSE`.

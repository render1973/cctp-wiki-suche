# CCTP Wiki-Suche

Lokaler MCP-Server (stdio, [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk)) für das CCTP Wiki: die fünf freigegebenen Wiki-Seiten des CCTP Knowledge Lab plus alle Entwurfsseiten, die über `schreibe_wiki_seite` laufend unter `wiki/` entstehen. Der Server liefert nur Rohtreffer aus diesem Bestand — Seitentitel, Status, Rohquelle-Pfad und Textausschnitt. Das Formulieren der Antwort übernimmt der MCP-Client (z. B. Claude Desktop oder Claude Code), nicht dieses Repo.

CDE und DMS bleiben für verbindliche Projekt-, Rechts- und Normunterlagen führend.

## Bestand

| Seite | Datei |
| --- | --- |
| Entscheidung: Roharchiv plus Wiki statt nur Chat-Suche | `server/wiki/entscheidung.md` |
| Lektion: Wissensarchitekturen in Digital Construction | `server/wiki/lektion.md` |
| Forschungsfall: Qualität, Auffindbarkeit und Wartbarkeit von Wissen | `server/wiki/forschungsfall.md` |
| Demo 2026-08-15: Chat, Dateisuche, Wiki | `server/wiki/demo.md` |
| Knowledge Architecture Sprint | `server/wiki/sprint.md` |

Status der fünf festen Seiten: `freigegeben`. Status und fachliche Prüfung setzt allein Thomas Heim.

Der Rohquelle-Pfad, den `such_cctp_wiki` zurückgibt, zeigt bei den fünf festen Seiten auf die unveränderte Originalquelle im Roharchiv (`00-roharchiv/…`) — nicht auf die Wiki-Seite selbst. Das ist die eigentliche Belegstelle; die Wiki-Seite ist nur die daraus verdichtete Fassung. Bei Seiten unter `wiki/` (siehe unten) gibt es keine separate Roharchiv-Quelle — dort zeigt der Rohquelle-Pfad auf die Wiki-Datei selbst, weil sie der primäre Eintrag ist.

## Tools

- `such_cctp_wiki(query: string)` — durchsucht die fünf festen Seiten **und** rekursiv alle Seiten unter `wiki/` (inkl. Unterordnern wie `entscheidungen/`) und gibt pro Treffer Titel, **Status**, Rohquelle-Pfad und den relevanten Textausschnitt zurück. Der Status verrät, was geprüft ist (`freigegeben`) und was nicht (`entwurf` oder was auch immer in der Datei steht).
- `liste_cctp_wiki_seiten()` — gibt die Tabelle aller Seiten mit Titel, Datei und Status zurück: die fünf festen plus alle unter `wiki/`.
- `schreibe_wiki_seite(bereich, titel, inhalt, autor?)` — legt eine neue Wiki-Entwurfsseite unter `wiki/` an oder ergänzt eine bestehende Seite bei Titel-Treffer. Details siehe unten.

### `schreibe_wiki_seite` im Detail

Schreibt in eine neue, wachsende Wiki-Struktur unter `wiki/` im Repo-Root — getrennt vom festen Fünf-Seiten-Bestand in `server/wiki/`, aber von Anfang an Teil von `such_cctp_wiki` und `liste_cctp_wiki_seiten`.

- **Neue Seite:** wird unter `wiki/<bereich>/<titel-als-dateiname>.md` angelegt, mit Titel, Datum, Autor:in und Status `entwurf`. Der Server setzt nie automatisch `geprueft` oder `freigegeben` — das bleibt Menschenarbeit, wie beim übrigen Bestand.
- **Bestehende Seite (exakter Titel-Treffer, irgendwo unter `wiki/`):** wird nicht überschrieben. Stattdessen wird ein datierter Abschnitt `## Update <Datum> (<Autor:in>)` angehängt, der den bisherigen Stand referenziert und den neuen Inhalt explizit als Ergänzung oder Widerspruch kennzeichnet — nach dem Muster „Stand [Datum]: … Update [Datum]: … — Widerspruch/Weiterentwicklung.“
- **Autor:in:** wird, falls nicht angegeben, aus dem lokalen Git-Kontext abgeleitet (`git config user.name`, sonst `user.email`) — nicht erfragt.
- **Nach dem Schreiben:** committet und pusht der Server die Änderung automatisch (nur die betroffene Datei, nicht andere offene Änderungen im Repo). Schlägt der Push fehl (z. B. kein Remote, kein Netz), bleibt der Commit lokal stehen und die Antwort weist darauf hin.
- **Rückgabe:** Pfad der Datei, ob eine neue Seite entstand oder eine bestehende ergänzt wurde, eine kurze Bestätigung, sowie der Git-Status (`committed`, `pushed`, ggf. `hinweis`).
- **Sofort auffindbar:** Eine so angelegte oder ergänzte Seite taucht ab dem nächsten Aufruf von `such_cctp_wiki` bzw. `liste_cctp_wiki_seiten` auf — es gibt keinen separaten Indexierungsschritt, jeder Aufruf liest `wiki/` frisch von der Platte.

#### Wenn der Push zuverlässig fehlschlägt (`pushed: false`)

Der Commit passiert immer lokal und geht nie verloren, auch wenn der Push scheitert. Zeigt `hinweis` wiederholt einen Auth-Fehler (z. B. `could not read Username for 'https://github.com'`), liegt das fast immer daran, dass MCP-Clients (Claude Desktop, aber auch dieses Repo im Test) dem gestarteten Server-Prozess **nicht** die volle Shell-Umgebung mitgeben — aus Sicherheitsgründen wird standardmässig nur eine feste, kleine Auswahl durchgereicht (`HOME`, `LOGNAME`, `PATH`, `SHELL`, `TERM`, `USER`). Alles, was der lokale Git-Zugang zusätzlich braucht (SSH-Agent-Socket, Proxy-Variablen, ein Credential-Helper, der auf weitere Umgebungsvariablen angewiesen ist), fehlt dann — unabhängig davon, wie der Push-Befehl selbst formuliert ist. Das lässt sich nicht im Code dieses Repos beheben, weil der Server-Prozess diese Variablen nie erhält.

Zwei praktikable Abhilfen, je nach Git-Setup:

- **HTTPS mit gespeichertem Zugangsdaten (empfohlen, meist am einfachsten):** `git config credential.helper` prüfen. Ist keiner gesetzt, z. B. `git config --global credential.helper store` (Token landet als Klartext in `~/.git-credentials` — für ein privates Gerät akzeptabel, sonst osxkeychain/manager-core nutzen). Das braucht nur `HOME`, was bereits durchgereicht wird.
- **SSH:** entweder einen Schlüssel ohne Passphrase verwenden (kein Agent nötig), oder in der MCP-Server-Konfiguration den `env`-Block explizit setzen, z. B. `"env": { "SSH_AUTH_SOCK": "/tatsächlicher/pfad" }` (Pfad mit `echo $SSH_AUTH_SOCK` im eigenen Terminal ermitteln).

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

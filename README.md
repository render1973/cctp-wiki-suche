# CCTP Wiki-Suche

Such-Chat über die fünf freigegebenen Wiki-Seiten des [CCTP Knowledge Lab](https://github.com/render1973/cctp-wiki-suche).

Der Chat beantwortet nur, was in diesen Seiten steht. Jede Antwort nennt Seite, Status und Rohquelle. CDE und DMS bleiben für verbindliche Projekt-, Rechts- und Normunterlagen führend.

## Bestand

| Seite | Datei |
| --- | --- |
| Entscheidung: Roharchiv plus Wiki statt nur Chat-Suche | `server/wiki/entscheidung.md` |
| Lektion: Wissensarchitekturen in Digital Construction | `server/wiki/lektion.md` |
| Forschungsfall: Qualität, Auffindbarkeit und Wartbarkeit von Wissen | `server/wiki/forschungsfall.md` |
| Demo 2026-08-15: Chat, Dateisuche, Wiki | `server/wiki/demo.md` |
| Knowledge Architecture Sprint | `server/wiki/sprint.md` |

Status der Seiten: `freigegeben`. Status und fachliche Prüfung setzt allein Thomas Heim.

## Lokal starten

Voraussetzungen: Node.js 20 oder neuer.

```bash
cp .env.example .env
# optional: ANTHROPIC_API_KEY in .env setzen
npm install
npm run dev
```

Die App läuft auf [http://localhost:5000](http://localhost:5000).

Ohne API-Key fällt der Chat auf eine einfache Textsuche in den fünf Seiten zurück. Mit Key antwortet er über Claude Haiku und bleibt an denselben Bestand gebunden.

Produktion:

```bash
npm run build
npm start
```

## Was dieses Repo nicht ist

- Kein Ersatz für CDE oder DMS
- Kein Roharchiv. Originalquellen bleiben unverändert
- Keine Freigabe-Instanz. `geprueft` und `freigegeben` setzt nur Thomas Heim

## Lizenz

MIT. Siehe `LICENSE`.

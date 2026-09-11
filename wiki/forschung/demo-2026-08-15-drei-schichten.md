# Demo 2026-08-15: Chat, Dateisuche, Wiki

- Status: freigegeben
- Typ: forschungsfall
- Projekt oder Programm: CCTP Knowledge Lab
- Fragestellung: Was liefern dieselben fünf Demofragen in Chat, Dateisuche und Wiki?
- Autor:in: Thomas Heim
- Erstellt: 2026-08-15
- Geprueft: Thomas Heim, 2026-08-15
- Freigegeben: Thomas Heim, 2026-08-15
- Tags: forschung, demo, rag, wissensqualitaet

## Kurzfassung

Chat beantwortet alle fünf Fragen flüssig, hat aber keine stabile Adresse und keinen Status. Die Dateisuche findet die richtigen Lab-Dateien, mischt sie aber mit älteren Drive-Dokumenten und liefert keine verdichtete Aussage. Nur das Wiki nennt Stand, Geltungsbereich, Quelle und verwandte Seiten.

## Methode

Durchgeführt am 2026-08-15, 20:05 CEST.

- Chat: Antwort aus dem Arbeitsgespräch ohne festes Wiki-Objekt
- Dateisuche: Google-Drive-Volltext und Dateisuche über den gesamten Drive
- Wiki: gezieltes Lesen der Startseiten und Konventionen

Grenzen: kleiner Bestand, eine Person, Dateien erst seit Minuten im Drive, Indexierung der Markdown-Dateien noch nicht abgeschlossen.

## Frage 1 — Wiederfinden

Welche bisherigen CCTP-Erkenntnisse gibt es zu Wissensarchitekturen, Digital Construction und generativer KI?

| Schicht | Was kommt zurück | Stabil? | Quelle? |
| --- | --- | --- | --- |
| Chat | Synthese: vier Schichten, lokaler Demonstrator zuerst, Dreifachnutzen Lehre/Forschung/Dienstleistung | Nein, nur in diesem Gespräch | Keine prüfbare Adresse |
| Dateisuche | Lab-Dateien plus fremde Drive-Treffer: `260602 Architektur und KI morgen_v3.pptx`, `HSLU_DFAB_DCCP_Innosuisse_proposal_2024.03.docx`, `Innolink Text Value Creation…docx`, `1-01 Julien Soula.pdf` | Dateiname ja, Aussage nein | Dateiliste, nicht bewertet |
| Wiki | [roharchiv-plus-wiki.md](../entscheidungen/roharchiv-plus-wiki.md), Status `zu-pruefen` | Ja | Chat-Quelle 2026-08-15 |

## Frage 2 — Verdichten

Was ist der konsolidierte Stand zu Roharchiv, Wiki, RAG und CDE?

| Schicht | Was kommt zurück | Stabil? | Quelle? |
| --- | --- | --- | --- |
| Chat | Schichtenmodell und Begründung, vermischt mit allgemeinen Toolhinweisen | Nein | Kein Status |
| Dateisuche | 10 Dateien mit den Wörtern Roharchiv und Wiki, inkl. beider README-Dateien | Nein, Liste statt Stand | Keine Rangfolge Wiki vs. Rohquelle |
| Wiki | Vier Schichten, explizit nicht gewählt: reines Chat-Archiv, Wiki ohne Quellen, frühe Serverlösung. CDE bleibt führend für verbindliche Unterlagen. | Ja | Entscheidung plus `konventionen.md` |

## Frage 3 — Transfer

Wie wird aus demselben Wissen Lektion, Forschungsfall und Dienstleistung?

| Schicht | Was kommt zurück | Stabil? | Quelle? |
| --- | --- | --- | --- |
| Chat | Idee des Dreifachnutzens, ohne fertige Module | Nein | — |
| Dateisuche | Trifft Sprint, Index, Entscheidung und Lektion als getrennte Dateien | Teilweise | Keine Transferlogik |
| Wiki | Drei Seiten aus einer Quelle: [Lektion](../lehre/wissensarchitekturen-digital-construction.md), [Forschungsfall](qualitaet-auffindbarkeit-wissenslab.md), [Sprint](../dienstleistungen/knowledge-architecture-sprint.md) | Ja | dieselbe Chat-Quelle |

## Frage 4 — Abgrenzung

Wann ist ein LLM-Wiki gegenüber Chat-Search oder RAG überlegen?

| Schicht | Was kommt zurück | Stabil? | Quelle? |
| --- | --- | --- | --- |
| Chat | Wiki dort, wo Status, Geltung und Wiederverwendung nötig sind; RAG für grosse Bestände; Chat für Exploration | Unscharf | Allgemeinwissen plus Gespräch |
| Dateisuche | 3 Dateien mit dem Wort `LLM-Wiki` | Nein | Keine Abgrenzungsregel |
| Wiki | Überlegen, wenn eine prüfbare Adresse, Status und Quelle nötig sind. Nicht überlegen als Ersatz für CDE oder als Vollindex. | Ja, aber `zu-pruefen` | Forschungsfall |

## Frage 5 — Governance

Was bleibt im CDE oder DMS führend, und welche Regeln gelten für Status, Quelle und Freigabe?

| Schicht | Was kommt zurück | Stabil? | Quelle? |
| --- | --- | --- | --- |
| Chat | CDE bleibt massgebend; Wiki braucht Status und Quelle | Nein | — |
| Dateisuche | 6 Dateien mit `zu-pruefen` und `CDE` | Nein | Regeln liegen in einer Datei, werden aber nicht als Regeln ausgewiesen |
| Wiki | CDE/DMS bleibt für Projekt-, Rechts-, Norm- und Behördenunterlagen führend. Statuswerte: `entwurf`, `zu-pruefen`, `geprueft`, `freigegeben`, `ueberholt`. | Ja | [konventionen.md](../../99-admin/konventionen.md) |

## Befunde

1. Chat kann alle fünf Fragen beantworten, erzeugt aber kein wiederauffindbares Objekt.
2. Dateisuche findet Material, unterscheidet aber nicht zwischen Lab-Wiki, Rohquelle und älteren Drive-Dateien ausserhalb des Labs.
3. Die Standardsuche markierte die neuen Markdown-Dateien als `is_indexed: false`. Auffinden per API-Volltext funktionierte trotzdem.
4. Nur das Wiki macht Transfer sichtbar: drei Seiten, eine Quelle, klarer Status.
5. Noch nicht belegt sind konkrete CCTP-Projekte, Module oder Kundeneinsätze.

## Offene Fragen

- Sollen die vier fachfremden Drive-Treffer als externe Rohquellen ins Lab, oder bleiben sie bewusst draussen?
- Ab wann braucht die Dateisuche eine Begrenzung auf den Ordner `cctp-knowledge-lab`?

## Verwandte Seiten

- [Demofragen](../../99-admin/demofragen.md)
- [Qualität und Auffindbarkeit](qualitaet-auffindbarkeit-wissenslab.md)
- [Roharchiv plus Wiki](../entscheidungen/roharchiv-plus-wiki.md)

## Quellen

- `00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md` — 2026-08-15 — Chat — Ausgangsentscheid
- Google-Drive-Dateisuche und Volltext, fünf Queries — 2026-08-15 — Suche — Trefferlisten inkl. fachfremder Dateien
- Wiki-Startseiten und `99-admin/konventionen.md` — 2026-08-15 — Wiki

# Roharchiv plus Wiki statt nur Chat-Suche

- Status: freigegeben
- Typ: entscheidung
- Geltungsbereich: CCTP intern, Pilot Knowledge Lab
- Thema: Grundarchitektur des Wissenssystems
- Autor:in: Thomas Heim
- Erstellt: 2026-08-15
- Geprueft: Thomas Heim, 2026-08-15
- Freigegeben: Thomas Heim, 2026-08-15
- Tags: wissensarchitektur, governance, digital-construction

## Kurzfassung

CCTP sichert Originalquellen unverändert in einem Roharchiv und verdichtet daraus ein prüfbares Markdown-Wiki. Chat-Suche und RAG bleiben Arbeitsmittel, ersetzen aber weder die führende Ablage noch das kuratierte Wissen. Verbindliche Projekt-, Rechts- und Normunterlagen bleiben im CDE oder DMS massgebend.

## Entscheidung

Gewählt wird eine Vier-Schichten-Architektur:

1. Roharchiv für unveränderte Originale
2. Markdown-Wiki für quellengebundene Erkenntnisse
3. LLM-Arbeitsräume für Analyse und Synthese
4. Governance mit Status, Quellenpflicht und Geltungsbereich

Nicht gewählt wird ein reines Chat-Archiv, ein Wiki ohne Quellen und eine frühzeitige Server- oder M365-Einführung vor dem Drive-Piloten.

Status und fachliche Prüfung setzt allein Thomas Heim. Computer darf Seiten entwerfen und auf `entwurf` oder `zu-pruefen` setzen, nicht selbst freigeben.

## Begründung

Chat-Sammlungen sind schnell, aber schlecht wartbar: Aussagen haben keinen Status, keine klare Geltung und keine stabile Adresse. Ein Wiki ohne Roharchiv erzeugt ungeprüfte Kopien. Ein CDE ohne Wissensschicht macht Erfahrungswissen nicht wiederverwendbar.

Der Pilot läuft in Google Drive im Ordner `cctp-knowledge-lab`. Zuerst gelten Struktur, Templates und eine geschlossene Demo-Schleife. SharePoint, Copilot Search oder eine institutionelle HSLU-Lösung sind Folgeentscheide, nicht der aktuelle Standort.

## Geltungsbereich und Grenzen

- Gilt für: CCTP Knowledge Lab, Google-Drive-Pilot, erste Lehr-, Forschungs- und Dienstleistungsseiten
- Gilt nicht für: verbindliche Projektakten, Bewilligungsdossiers, Normtexte als Führungsdokument
- Abhängigkeiten: Konventionen in `99-admin/konventionen.md`; langfristig HSLU-Ablage und Datenschutzregeln

## Offene Fragen

- Welche Inhalte dürfen in Google Drive liegen, welche nur in der HSLU-Umgebung?
- Ab wann braucht der Pilot eine zweite Person für Inhalt — nicht für Status und Freigabe?

## Verwandte Seiten

- [Wissensarchitekturen in Digital Construction](../lehre/wissensarchitekturen-digital-construction.md)
- [Qualität und Auffindbarkeit im Knowledge Lab](../forschung/qualitaet-auffindbarkeit-wissenslab.md)
- [Knowledge Architecture Sprint](../dienstleistungen/knowledge-architecture-sprint.md)
- [Demofragen](../../99-admin/demofragen.md)

## Quellen

- `00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md` — 2026-08-15 — Chat — Einrichtungsgespräch und Architekturentscheid
- Vergleich Wissens- und Projektdaten-Management-Tools — 2026-08-15 — Recherche — Toolschichten CDE, Wiki, Suche, Swiss Hosting

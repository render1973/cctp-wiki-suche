export type WikiPage = {
  id: string;
  title: string;
  shortTitle: string;
  type: string;
  area: string;
  status: string;
  author: string;
  reviewed: string;
  released: string;
  created: string;
  driveId: string;
  path: string;
  sources: string[];
  body: string;
};

export const PAGES: WikiPage[] = [
  {
    "id": "entscheidung",
    "title": "Roharchiv plus Wiki statt nur Chat-Suche",
    "shortTitle": "Entscheidung",
    "type": "entscheidung",
    "area": "Entscheidungen",
    "status": "freigegeben",
    "author": "Thomas Heim",
    "reviewed": "Thomas Heim, 2026-08-15",
    "released": "Thomas Heim, 2026-08-15",
    "created": "2026-08-15",
    "driveId": "1O3mytNdvfcstk9SohTom6z02v_Ib7cGa",
    "path": "10-wiki/entscheidungen/roharchiv-plus-wiki.md",
    "sources": [
      "00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md — 2026-08-15 — Chat",
      "Vergleich Wissens- und Projektdaten-Management-Tools — 2026-08-15 — Recherche"
    ],
    "body": "# Roharchiv plus Wiki statt nur Chat-Suche\n\n- Status: freigegeben\n- Typ: entscheidung\n- Geltungsbereich: CCTP intern, Pilot Knowledge Lab\n- Thema: Grundarchitektur des Wissenssystems\n- Autor:in: Thomas Heim\n- Erstellt: 2026-08-15\n- Geprueft: Thomas Heim, 2026-08-15\n- Freigegeben: Thomas Heim, 2026-08-15\n- Tags: wissensarchitektur, governance, digital-construction\n\n## Kurzfassung\n\nCCTP sichert Originalquellen unverändert in einem Roharchiv und verdichtet daraus ein prüfbares Markdown-Wiki. Chat-Suche und RAG bleiben Arbeitsmittel, ersetzen aber weder die führende Ablage noch das kuratierte Wissen. Verbindliche Projekt-, Rechts- und Normunterlagen bleiben im CDE oder DMS massgebend.\n\n## Entscheidung\n\nGewählt wird eine Vier-Schichten-Architektur:\n\n1. Roharchiv für unveränderte Originale\n2. Markdown-Wiki für quellengebundene Erkenntnisse\n3. LLM-Arbeitsräume für Analyse und Synthese\n4. Governance mit Status, Quellenpflicht und Geltungsbereich\n\nNicht gewählt wird ein reines Chat-Archiv, ein Wiki ohne Quellen und eine frühzeitige Server- oder M365-Einführung vor dem Drive-Piloten.\n\nStatus und fachliche Prüfung setzt allein Thomas Heim. Computer darf Seiten entwerfen und auf `entwurf` oder `zu-pruefen` setzen, nicht selbst freigeben.\n\n## Begründung\n\nChat-Sammlungen sind schnell, aber schlecht wartbar: Aussagen haben keinen Status, keine klare Geltung und keine stabile Adresse. Ein Wiki ohne Roharchiv erzeugt ungeprüfte Kopien. Ein CDE ohne Wissensschicht macht Erfahrungswissen nicht wiederverwendbar.\n\nDer Pilot läuft in Google Drive im Ordner `cctp-knowledge-lab`. Zuerst gelten Struktur, Templates und eine geschlossene Demo-Schleife. SharePoint, Copilot Search oder eine institutionelle HSLU-Lösung sind Folgeentscheide, nicht der aktuelle Standort.\n\n## Geltungsbereich und Grenzen\n\n- Gilt für: CCTP Knowledge Lab, Google-Drive-Pilot, erste Lehr-, Forschungs- und Dienstleistungsseiten\n- Gilt nicht für: verbindliche Projektakten, Bewilligungsdossiers, Normtexte als Führungsdokument\n- Abhängigkeiten: Konventionen in `99-admin/konventionen.md`; langfristig HSLU-Ablage und Datenschutzregeln\n\n## Offene Fragen\n\n- Welche Inhalte dürfen in Google Drive liegen, welche nur in der HSLU-Umgebung?\n- Ab wann braucht der Pilot eine zweite Person für Inhalt — nicht für Status und Freigabe?\n\n## Verwandte Seiten\n\n- [Wissensarchitekturen in Digital Construction](../lehre/wissensarchitekturen-digital-construction.md)\n- [Qualität und Auffindbarkeit im Knowledge Lab](../forschung/qualitaet-auffindbarkeit-wissenslab.md)\n- [Knowledge Architecture Sprint](../dienstleistungen/knowledge-architecture-sprint.md)\n- [Demofragen](../../99-admin/demofragen.md)\n\n## Quellen\n\n- `00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md` — 2026-08-15 — Chat — Einrichtungsgespräch und Architekturentscheid\n- Vergleich Wissens- und Projektdaten-Management-Tools — 2026-08-15 — Recherche — Toolschichten CDE, Wiki, Suche, Swiss Hosting\n"
  },
  {
    "id": "lektion",
    "title": "Wissensarchitekturen in Digital Construction",
    "shortTitle": "Lektion",
    "type": "unterrichtslektion",
    "area": "Lehre",
    "status": "freigegeben",
    "author": "Thomas Heim",
    "reviewed": "Thomas Heim, 2026-08-15",
    "released": "Thomas Heim, 2026-08-15",
    "created": "2026-08-15",
    "driveId": "1744Vk6l-PpTcR8dqMCK6jrCSuYmWToq9",
    "path": "10-wiki/lehre/wissensarchitekturen-digital-construction.md",
    "sources": [
      "00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md — 2026-08-15 — Chat",
      "HSLU Digital Construction — Programmlogik Lebenszyklus — externe Einordnung"
    ],
    "body": "# DC — Wissensarchitekturen in Digital Construction\n\n- Status: freigegeben\n- Typ: unterrichtslektion\n- Modul: Digital Construction / Methodenkompetenz, Weiterbildung\n- Semester: offen\n- Zielgruppe: Fach- und Führungskräfte in Planung, Bau und Betrieb\n- Autor:in: Thomas Heim\n- Erstellt: 2026-08-15\n- Geprueft: Thomas Heim, 2026-08-15\n- Freigegeben: Thomas Heim, 2026-08-15\n- Tags: lehre, wissensarchitektur, rag, digital-construction\n\n## Lernziele\n\nNach der Lektion können die Teilnehmenden:\n\n1. Roharchiv, Wiki, RAG/Suche und CDE/DMS voneinander unterscheiden\n2. Für eine Praxisfrage entscheiden, welche Schicht führend ist\n3. Eine Minimalarchitektur mit Status, Quelle und Verantwortung skizzieren\n\n## Kurzfassung\n\nDigital Construction ist nicht die Digitalisierung von Dateien, sondern ein verlässlicher Informationsfluss über den Lebenszyklus. Die Lektion macht das an einem greifbaren Fall: dieselben Unterlagen einmal als Chat, einmal als RAG und einmal als Wiki. Live-Beispiel ist der Drive-Pilot `cctp-knowledge-lab`. Ablauf, Materialien und Prüfungsbezug sind Entwurf, noch nicht beschlossen und noch nicht unterrichtet.\n\n## Ablauf (Entwurf)\n\n| Phase | Dauer | Inhalt | Methode |\n| --- | --- | --- | --- |\n| Einstieg | 10 min | Was geht verloren, wenn Wissen nur in Chats und Köpfen liegt? | Impuls / Gespräch |\n| Vertiefung | 30 min | Vier Schichten: CDE, Roharchiv, Wiki, RAG. Status- und Quellenpflicht. | Input + Live-Demo |\n| Transfer | 35 min | Gruppen entwerfen eine Minimalarchitektur für ein fiktives Büro oder Projekt. | Gruppenarbeit |\n| Abschluss | 15 min | Sicherung: Was ist verbindliche Quelle, Arbeitswissen, KI-Synthese? | Plenum |\n\n## Materialien\n\n- Folien (Entwurf): Schichtenmodell und Statuswerte\n- Aufgabe / Brief (Entwurf): Minimalarchitektur für ein 5–20-Personen-Büro\n- Pflichtlektüre: diese Seite plus `99-admin/konventionen.md`\n- Weiterführend: Toolvergleich vom 2026-08-15\n\n## Prüfungs- oder Abgabebezug\n\nVorschlag, nicht beschlossen: Weiterbildungsaufgabe, in der Fach- und Führungskräfte für ein Büro oder ein Projekt eine Informationsarchitektur mit führender Ablage, Wiki-Regeln und drei Demofragen entwerfen.\n\n## Erfahrungen und Anpassungen\n\n- Was hat funktioniert: noch nicht unterrichtet\n- Was anpassen: Demo nur mit geprüften oder klar als Entwurf markierten Seiten\n- Offene didaktische Fragen: 90 Minuten oder als Studio-Halbtag?\n\n## Verwandte Seiten\n\n- [Roharchiv plus Wiki](../entscheidungen/roharchiv-plus-wiki.md)\n- [Qualität und Auffindbarkeit im Knowledge Lab](../forschung/qualitaet-auffindbarkeit-wissenslab.md)\n- [Knowledge Architecture Sprint](../dienstleistungen/knowledge-architecture-sprint.md)\n\n## Quellen\n\n- `00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md` — 2026-08-15 — Chat — Lehr-Use-Case und Schichtenmodell\n- HSLU Digital Construction — Programmlogik Lebenszyklus, Prozesse, Kollaboration — externe Einordnung, vor Ort zu prüfen\n"
  },
  {
    "id": "forschungsfall",
    "title": "Qualität, Auffindbarkeit und Wartbarkeit von Wissen",
    "shortTitle": "Forschungsfall",
    "type": "forschungsfall",
    "area": "Forschung",
    "status": "freigegeben",
    "author": "Thomas Heim",
    "reviewed": "Thomas Heim, 2026-08-15",
    "released": "Thomas Heim, 2026-08-15",
    "created": "2026-08-15",
    "driveId": "1mRuSgMOgYz73RvUfOXVVPHtMhKZH1IXY",
    "path": "10-wiki/forschung/qualitaet-auffindbarkeit-wissenslab.md",
    "sources": [
      "00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md — 2026-08-15 — Chat",
      "Vergleich Wissens- und Projektdaten-Management-Tools — 2026-08-15 — Recherche"
    ],
    "body": "# Qualität, Auffindbarkeit und Wartbarkeit von Wissen\n\n- Status: freigegeben\n- Typ: forschungsfall\n- Projekt oder Programm: CCTP Knowledge Lab\n- Fragestellung: Wann ist ein LLM-Wiki gegenüber Chat-Search oder RAG im Planungs- und Baukontext überlegen?\n- Autor:in: Thomas Heim\n- Erstellt: 2026-08-15\n- Geprueft: Thomas Heim, 2026-08-15\n- Freigegeben: Thomas Heim, 2026-08-15\n- Tags: forschung, wissensqualitaet, rag, reallabor\n\n## Kurzfassung\n\nDas Knowledge Lab ist selbst der erste Forschungsfall: ein beobachtbarer Aufbau einer Wissensarchitektur im CCTP. Untersucht werden Auffindbarkeit, Wiederverwendung, Quellenqualität und Vertrauenswürdigkeit — nicht die Überlegenheit eines einzelnen Tools.\n\n## Fragestellung\n\nLeitfrage: Wann ist ein LLM-Wiki gegenüber Chat-Search oder RAG im Planungs- und Baukontext überlegen?\n\nUnterfragen:\n\n- Welche Rolle spielen Quellenpflicht, Versionierung und Status für vertrauenswürdige KI-Nutzung?\n- Wie verändert sich die Wiederverwendung zwischen Forschung, Lehre und Dienstleistung?\n- Welche Qualitätsmängel treten bei KI-kompiliertem Projektwissen auf?\n\n## Methode\n\n- Zugang: Reallabor / Design-Science, begleitete Fallstudie\n- Datengrundlage: Roharchiv, Wiki-Seiten, Demofragen, spätere Nutzungsspuren\n- Vorgehen: Drive-Pilot aufbauen, drei Use Cases füllen, dieselben Fragen an Chat, Dateisuche und Wiki stellen, Differenzen protokollieren\n- Grenzen der Methode: bisher ein Arbeitsplatz, kleine Datenmenge, keine unabhängige Prüfung\n\n## Befunde\n\n- Chat beantwortet alle fünf Demofragen, erzeugt aber keine stabile, prüfbare Wissensadresse.\n- Dateisuche findet die Lab-Dateien, mischt sie aber mit älteren Drive-Dokumenten ausserhalb des Labs und liefert keine verdichtete Aussage.\n- Ein leeres Wiki überzeugt nicht; überzeugend ist erst die Schleife Quelle → verdichtete Seite → beantwortbare Frage.\n- Toolvergleiche allein ersetzen keine Governance: ohne Status und Quelle bleibt KI-Output Arbeitsnotiz.\n\nErste Messung: [Demo 2026-08-15](demo-2026-08-15-drei-schichten.md). Befunde vorläufig, eine Person, kleiner Bestand.\n\n## Übertragbarkeit\n\n- Für Weiterbildung nutzbar als: Vergleichsübung CDE / RAG / Wiki / Chat\n- Für Dienstleistung später denkbar als: Assessment-Raster für Büros; nicht beschlossen\n- Nicht übertragbar, weil: noch keine Teamnutzung, keine HSLU-Rechte- und Datenklassenprüfung\n\n## Offene Fragen\n\n- Welche Messgrössen lassen sich im Alltag wirklich erheben: Suchzeit, Dubletten, Quellenabdeckung, Vertrauen?\n- Ab welcher Bestandsgrösse braucht es RAG zusätzlich zum Wiki?\n- Welche Datenklassen dürfen den Drive-Piloten nicht verlassen?\n\n## Verwandte Seiten\n\n- [Roharchiv plus Wiki](../entscheidungen/roharchiv-plus-wiki.md)\n- [Wissensarchitekturen in Digital Construction](../lehre/wissensarchitekturen-digital-construction.md)\n- [Demofragen](../../99-admin/demofragen.md)\n\n## Quellen\n\n- `00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md` — 2026-08-15 — Chat — Forschungsfragen und Evaluationsgrössen\n- Vergleich Wissens- und Projektdaten-Management-Tools — 2026-08-15 — Recherche — Such-, OCR- und Residenzunterschiede der geprüften Tools\n"
  },
  {
    "id": "demo",
    "title": "Demo 2026-08-15: Chat, Dateisuche, Wiki",
    "shortTitle": "Demo",
    "type": "forschungsfall",
    "area": "Forschung",
    "status": "freigegeben",
    "author": "Thomas Heim",
    "reviewed": "Thomas Heim, 2026-08-15",
    "released": "Thomas Heim, 2026-08-15",
    "created": "2026-08-15",
    "driveId": "1H5z9lcX7-ROE0HA5ZttuxJPmmpsa8poz",
    "path": "10-wiki/forschung/demo-2026-08-15-drei-schichten.md",
    "sources": [
      "00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md — 2026-08-15 — Chat",
      "Google-Drive-Dateisuche und Volltext — 2026-08-15 — Suche",
      "Wiki-Startseiten und 99-admin/konventionen.md — 2026-08-15 — Wiki"
    ],
    "body": "# Demo 2026-08-15: Chat, Dateisuche, Wiki\n\n- Status: freigegeben\n- Typ: forschungsfall\n- Projekt oder Programm: CCTP Knowledge Lab\n- Fragestellung: Was liefern dieselben fünf Demofragen in Chat, Dateisuche und Wiki?\n- Autor:in: Thomas Heim\n- Erstellt: 2026-08-15\n- Geprueft: Thomas Heim, 2026-08-15\n- Freigegeben: Thomas Heim, 2026-08-15\n- Tags: forschung, demo, rag, wissensqualitaet\n\n## Kurzfassung\n\nChat beantwortet alle fünf Fragen flüssig, hat aber keine stabile Adresse und keinen Status. Die Dateisuche findet die richtigen Lab-Dateien, mischt sie aber mit älteren Drive-Dokumenten und liefert keine verdichtete Aussage. Nur das Wiki nennt Stand, Geltungsbereich, Quelle und verwandte Seiten.\n\n## Methode\n\nDurchgeführt am 2026-08-15, 20:05 CEST.\n\n- Chat: Antwort aus dem Arbeitsgespräch ohne festes Wiki-Objekt\n- Dateisuche: Google-Drive-Volltext und Dateisuche über den gesamten Drive\n- Wiki: gezieltes Lesen der Startseiten und Konventionen\n\nGrenzen: kleiner Bestand, eine Person, Dateien erst seit Minuten im Drive, Indexierung der Markdown-Dateien noch nicht abgeschlossen.\n\n## Frage 1 — Wiederfinden\n\nWelche bisherigen CCTP-Erkenntnisse gibt es zu Wissensarchitekturen, Digital Construction und generativer KI?\n\n| Schicht | Was kommt zurück | Stabil? | Quelle? |\n| --- | --- | --- | --- |\n| Chat | Synthese: vier Schichten, lokaler Demonstrator zuerst, Dreifachnutzen Lehre/Forschung/Dienstleistung | Nein, nur in diesem Gespräch | Keine prüfbare Adresse |\n| Dateisuche | Lab-Dateien plus fremde Drive-Treffer: `260602 Architektur und KI morgen_v3.pptx`, `HSLU_DFAB_DCCP_Innosuisse_proposal_2024.03.docx`, `Innolink Text Value Creation…docx`, `1-01 Julien Soula.pdf` | Dateiname ja, Aussage nein | Dateiliste, nicht bewertet |\n| Wiki | [roharchiv-plus-wiki.md](../entscheidungen/roharchiv-plus-wiki.md), Status `zu-pruefen` | Ja | Chat-Quelle 2026-08-15 |\n\n## Frage 2 — Verdichten\n\nWas ist der konsolidierte Stand zu Roharchiv, Wiki, RAG und CDE?\n\n| Schicht | Was kommt zurück | Stabil? | Quelle? |\n| --- | --- | --- | --- |\n| Chat | Schichtenmodell und Begründung, vermischt mit allgemeinen Toolhinweisen | Nein | Kein Status |\n| Dateisuche | 10 Dateien mit den Wörtern Roharchiv und Wiki, inkl. beider README-Dateien | Nein, Liste statt Stand | Keine Rangfolge Wiki vs. Rohquelle |\n| Wiki | Vier Schichten, explizit nicht gewählt: reines Chat-Archiv, Wiki ohne Quellen, frühe Serverlösung. CDE bleibt führend für verbindliche Unterlagen. | Ja | Entscheidung plus `konventionen.md` |\n\n## Frage 3 — Transfer\n\nWie wird aus demselben Wissen Lektion, Forschungsfall und Dienstleistung?\n\n| Schicht | Was kommt zurück | Stabil? | Quelle? |\n| --- | --- | --- | --- |\n| Chat | Idee des Dreifachnutzens, ohne fertige Module | Nein | — |\n| Dateisuche | Trifft Sprint, Index, Entscheidung und Lektion als getrennte Dateien | Teilweise | Keine Transferlogik |\n| Wiki | Drei Seiten aus einer Quelle: [Lektion](../lehre/wissensarchitekturen-digital-construction.md), [Forschungsfall](qualitaet-auffindbarkeit-wissenslab.md), [Sprint](../dienstleistungen/knowledge-architecture-sprint.md) | Ja | dieselbe Chat-Quelle |\n\n## Frage 4 — Abgrenzung\n\nWann ist ein LLM-Wiki gegenüber Chat-Search oder RAG überlegen?\n\n| Schicht | Was kommt zurück | Stabil? | Quelle? |\n| --- | --- | --- | --- |\n| Chat | Wiki dort, wo Status, Geltung und Wiederverwendung nötig sind; RAG für grosse Bestände; Chat für Exploration | Unscharf | Allgemeinwissen plus Gespräch |\n| Dateisuche | 3 Dateien mit dem Wort `LLM-Wiki` | Nein | Keine Abgrenzungsregel |\n| Wiki | Überlegen, wenn eine prüfbare Adresse, Status und Quelle nötig sind. Nicht überlegen als Ersatz für CDE oder als Vollindex. | Ja, aber `zu-pruefen` | Forschungsfall |\n\n## Frage 5 — Governance\n\nWas bleibt im CDE oder DMS führend, und welche Regeln gelten für Status, Quelle und Freigabe?\n\n| Schicht | Was kommt zurück | Stabil? | Quelle? |\n| --- | --- | --- | --- |\n| Chat | CDE bleibt massgebend; Wiki braucht Status und Quelle | Nein | — |\n| Dateisuche | 6 Dateien mit `zu-pruefen` und `CDE` | Nein | Regeln liegen in einer Datei, werden aber nicht als Regeln ausgewiesen |\n| Wiki | CDE/DMS bleibt für Projekt-, Rechts-, Norm- und Behördenunterlagen führend. Statuswerte: `entwurf`, `zu-pruefen`, `geprueft`, `freigegeben`, `ueberholt`. | Ja | [konventionen.md](../../99-admin/konventionen.md) |\n\n## Befunde\n\n1. Chat kann alle fünf Fragen beantworten, erzeugt aber kein wiederauffindbares Objekt.\n2. Dateisuche findet Material, unterscheidet aber nicht zwischen Lab-Wiki, Rohquelle und älteren Drive-Dateien ausserhalb des Labs.\n3. Die Standardsuche markierte die neuen Markdown-Dateien als `is_indexed: false`. Auffinden per API-Volltext funktionierte trotzdem.\n4. Nur das Wiki macht Transfer sichtbar: drei Seiten, eine Quelle, klarer Status.\n5. Noch nicht belegt sind konkrete CCTP-Projekte, Module oder Kundeneinsätze.\n\n## Offene Fragen\n\n- Sollen die vier fachfremden Drive-Treffer als externe Rohquellen ins Lab, oder bleiben sie bewusst draussen?\n- Ab wann braucht die Dateisuche eine Begrenzung auf den Ordner `cctp-knowledge-lab`?\n\n## Verwandte Seiten\n\n- [Demofragen](../../99-admin/demofragen.md)\n- [Qualität und Auffindbarkeit](qualitaet-auffindbarkeit-wissenslab.md)\n- [Roharchiv plus Wiki](../entscheidungen/roharchiv-plus-wiki.md)\n\n## Quellen\n\n- `00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md` — 2026-08-15 — Chat — Ausgangsentscheid\n- Google-Drive-Dateisuche und Volltext, fünf Queries — 2026-08-15 — Suche — Trefferlisten inkl. fachfremder Dateien\n- Wiki-Startseiten und `99-admin/konventionen.md` — 2026-08-15 — Wiki\n"
  },
  {
    "id": "sprint",
    "title": "Knowledge Architecture Sprint",
    "shortTitle": "Sprint",
    "type": "dienstleistungsmodul",
    "area": "Dienstleistungen",
    "status": "freigegeben",
    "author": "Thomas Heim",
    "reviewed": "Thomas Heim, 2026-08-15",
    "released": "Thomas Heim, 2026-08-15",
    "created": "2026-08-15",
    "driveId": "12fucy4EL9T564IKL9newRu6ourohRyAu",
    "path": "10-wiki/dienstleistungen/knowledge-architecture-sprint.md",
    "sources": [
      "00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md — 2026-08-15 — Chat",
      "Vergleich Wissens- und Projektdaten-Management-Tools — 2026-08-15 — Recherche"
    ],
    "body": "# Knowledge Architecture Sprint\n\n- Status: freigegeben\n- Typ: dienstleistungsmodul\n- Angebot: Weiterbildung jetzt, Dienstleistung später\n- Zielgruppe: Fach- und Führungskräfte in Weiterbildung; Büros und Kommunen erst später\n- Autor:in: Thomas Heim\n- Erstellt: 2026-08-15\n- Geprueft: Thomas Heim, 2026-08-15\n- Freigegeben: Thomas Heim, 2026-08-15\n- Tags: dienstleistung, wissensarchitektur, workshop\n\n## Kurzfassung\n\nEin kompakter Sprint macht sichtbar, welches Wissen wo liegen muss: verbindliche Originale im CDE oder DMS, verdichtete Erkenntnisse im Wiki, Suche nur als Schicht darüber. Gilt momentan für Weiterbildung. Eine Dienstleistung für Büros oder Kommunen ist möglich, aber nicht beschlossen. Ergebnis ist keine Softwareeinführung, sondern eine prüfbare Minimalarchitektur plus drei priorisierte Wissensfälle.\n\n## Leistungsumfang\n\n- Enthalten: Ist-Aufnahme der Ablage, Schichtenmodell, drei Use Cases, Status- und Quellenregeln, Demo anhand eines begrenzten Bestands\n- Nicht enthalten: CDE-Migration, Vollindexierung von Altarchiven, Toolkauf, laufender Betrieb\n- Typische Dauer oder Intensität (Entwurf): 2 halbe Tage plus kurze Vor- und Nachbereitung\n- Beteiligte Rollen: Auftraggeber:in, eine Person mit Projektkenntnis, optional IT/Datenschutz\n\n## Vorgehen\n\n1. Klärung: Welche Fragen sollen in 90 Tagen schneller und verlässlicher beantwortbar sein?\n2. Schnitt: Was bleibt führendes Original, was wird Wiki-Seite, was bleibt Chat-Arbeitsraum?\n3. Rückspiegelung: eine sichtbare Demo mit Quelle, verdichteter Seite und Transfer in Lehre oder Angebot\n\n## Methoden und Werkzeuge\n\n- Schichtenmodell CDE / Roharchiv / Wiki / RAG\n- Templates für Wiki-Seite, Lektion, Forschungsfall und Leistungsmodul\n- Kleiner, kuratierter Dokumentenbestand statt Vollmigration\n- Assessment zu Datenresidenz, OCR und Verantwortlichkeiten\n\n## Risiken und Voraussetzungen\n\n- Voraussetzungen: ein abgegrenzter Pilotordner, eine echte Wiederholungsfrage, Freigabe der Beispielinhalte\n- Typische Risiken: Tooldebatte vor Inhaltsklärung; ungeprüfte KI-Zusammenfassungen als Führungsdokument\n- Was intern geklärt sein muss: Datenklassen, Hosting, wer Seiten freigibt\n\n## Übertragbare Erkenntnisse\n\n- Zuerst lokale oder begrenzte Demo, dann Plattformentscheid\n- b'Files, CDE und Wiki lösen verschiedene Probleme; sie ersetzen einander nicht\n- Ein Sprint ist nur glaubwürdig, wenn jede Aussage auf eine Quelle zeigt\n\n## Verwandte Seiten\n\n- [Roharchiv plus Wiki](../entscheidungen/roharchiv-plus-wiki.md)\n- [Wissensarchitekturen in Digital Construction](../lehre/wissensarchitekturen-digital-construction.md)\n- [Qualität und Auffindbarkeit im Knowledge Lab](../forschung/qualitaet-auffindbarkeit-wissenslab.md)\n\n## Quellen\n\n- `00-roharchiv/chats/2026-08-15-cctp-knowledge-lab-setup.md` — 2026-08-15 — Chat — Dienstleistungs-Use-Case und Sprintlogik\n- Vergleich Wissens- und Projektdaten-Management-Tools — 2026-08-15 — Recherche — Minimalkombination Ablage, Wiki, Suche, CDE\n"
  }
] as WikiPage[];

export const PROMPTS = [
  { id: "wiederfinden", label: "Wiederfinden", text: "Welche bisherigen CCTP-Erkenntnisse gibt es zu Wissensarchitekturen, Digital Construction und generativer KI?" },
  { id: "verdichten", label: "Verdichten", text: "Was ist der konsolidierte Stand zu Roharchiv, Wiki, RAG und CDE?" },
  { id: "transfer", label: "Transfer", text: "Wie wird aus demselben Wissen Lektion, Forschungsfall und Dienstleistung?" },
  { id: "abgrenzung", label: "Abgrenzung", text: "Wann ist ein LLM-Wiki gegenüber Chat-Search oder RAG überlegen?" },
  { id: "governance", label: "Governance", text: "Was bleibt im CDE oder DMS führend, und welche Regeln gelten für Status, Quelle und Freigabe?" },
] as const;

# Praxisbeispiel: OSM-Kontext-Abruf direkt in Rhino

- Status: entwurf
- Autor: Thomas Heim
- Typ: praxisbeispiel
- Themencluster: KI-Agenten, Computational Design, Standortanalyse, GIS
- Quelle: LinkedIn-Post Abhinav Bhardwaj, ca. 2026-09 (urn:li:activity:7503061212629282817)
- Erfasst: 2026-09-14
- Tags: rhino, openstreetmap, osm, automatisierung, standortanalyse, kontext

---

## Kurzübersicht

Abhinav Bhardwaj zeigt, wie OpenStreetMap-Daten per Koordinateneingabe automatisiert direkt in Rhino geladen werden — ohne manuellen GIS-Export-Import-Umweg.

---

## Was passiert technisch

| Komponente | Beschreibung |
|---|---|
| **Input** | Koordinaten (Standort) |
| **Quelle** | OpenStreetMap (OSM) |
| **Umgebung** | Rhino 3D |
| **Output** | Kontextgeometrie direkt im Modell (Strassen, Gebäudegrundrisse, Freiflächen) |

---

## Einordnung

Löst einen klassischen Medienbruch im frühen Entwurfsprozess: bisher manueller Export aus QGIS/OSM-Tools → Import in Rhino. Hier direkter API-Abruf aus Rhino heraus.

**Relevanz:** Vorstufe zu agentischen Workflows — der Kontext ist maschinenlesbar im Modell, bevor die eigentliche Planung beginnt. Vgl. [[praxisbeispiel-rhino-agent-automated-zoning]], wo genau dieser Kontext als Grundlage dient.

---

## ⚠ Ausbauhinweis

Seite basiert nur auf dem Radar-Eintrag. Kein Video analysiert. Bei Gelegenheit mit Original-Post anreichern.

---

## Quelle

- LinkedIn-Post: [Abhinav Bhardwaj](https://www.linkedin.com/feed/update/urn:li:activity:7503061212629282817)
- Radar-Snapshot: [[radar-linkedin-2026-09]]

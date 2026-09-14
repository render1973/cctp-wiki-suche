# Praxisbeispiel: Cartesian by FORMAS.AI — Anything to 3D

- Status: entwurf
- Autor: Thomas Heim
- Typ: praxisbeispiel
- Themencluster: KI-Agenten, Computational Design, 3D-Modellierung, BIM, Entwurf
- Quelle: LinkedIn-Post Carlos Bañón (FORMAS.AI), 2026-09-14, Screen-Recording
- Erfasst: 2026-09-14
- Tags: cartesian, formas-ai, 3d-generierung, rhino, ifc, sketchup, openai, entwurf, spatial-intelligence

## Was wird gezeigt

Carlos Bañón (Associate Professor SUTD, Co-Founder FORMAS.AI, lehrte am MIT) kündigt auf LinkedIn den Preview-Launch von **Cartesian by FORMAS.AI** an — ein KI-gestütztes Tool, das beliebige Eingaben in strukturierte, editierbare 3D-Geometrie überführt.

Website: [cartesianbyformas.com](https://www.cartesianbyformas.com)
Waitlist: [lnkd.in/g7Mw-ekM](https://lnkd.in/g7Mw-ekM)

## Funktionsprinzip

| Komponente | Beschreibung |
|---|---|
| **Input** | Foto, Skizze, Zeichnung, Bestandsmodell, Stadtort, Typologie |
| **KI-Basis** | OpenAI Astra (räumliches Verstehen) + FORMAS.AI-Expertise in Architektur und Digital Fabrication |
| **Verarbeitung** | KI interpretiert räumliche Beziehungen (Fenster↔Wand, Öffnung↔Raumfolge) und erzeugt semantisch strukturierte 3D-Geometrie |
| **Interaktion** | Intention sprachlich eingeben, Modell skizzieren, iterieren — Edit-History bleibt erhalten |
| **Output** | Strukturierte, editierbare 3D-Geometrie; visuell navigierbar (Look Around / Go Inside) |
| **Export** | Rhino, SketchUp, DWG, IFC (geplant) |

## Demo-Sequenzen im Preview-Video

| Label | Inhalt |
|---|---|
| **LOOK AROUND** | 360°-Navigation in einem Innenraum (Lobby/Atrium) — immersive Visualisierung aus dem Modell heraus |
| **GO INSIDE** | Übergang von städtebaulichem Aussenkontext ins Gebäudeinnere |
| **DRAFT ANGLE** | 3D-Produktmodell (Mütze), farbcodiert nach Neigungswinkel — zeigt Potenzial für Fertigungsplanung/DfM |

## Relevanz für CCTP

- **Rhino-Export und IFC** direkt adressiert → Anschluss an BIM-Workflows der Baubranche
- Schliesst den Kreis zu den agentischen Rhino-Workflows (→ [[praxisbeispiel-rhino-agent-automated-zoning]]): dort Python-Agenten in Rhino, hier KI als Eingangsschicht vor Rhino
- Für Lehre (CAS Digital Construction) interessant als Beispiel für den Einstiegspunkt "Anything"-Ansatz: kein CAD-Vorwissen als Voraussetzung für 3D-Modell
- Bereich Digital Fabrication / 3D-Druck explizit erwähnt — relevant für Robotik-/Fertigungsthemen am CCTP
- Spatial Intelligence als Begriff und Konzept (OpenAI Astra) — neue Kategorie neben Text- und Bildgenerierung

## Einordnung

Cartesian steht in einer Reihe von Tools (neben Spline, Vizcom, Higgsfield 3D), die den Übergang von 2D-Inputs zu editierbarer 3D-Geometrie anstreben. Der Unterschied: FORMAS.AI kommt aus der Architektur- und Fertigungspraxis (nicht aus Gaming/VFX) und adressiert explizit professionelle AEC-Workflows (IFC, Rhino). Noch in der Preview-Phase; Waitlist offen (Stand 14.9.2026).

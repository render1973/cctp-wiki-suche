# Nachbau-Analyse: Cartesian by FORMAS.AI — Anything to 3D

- Status: entwurf
- Autor: Thomas Heim
- Typ: nachbau-analyse
- Themencluster: KI-Agenten, Computational Design, 3D-Generierung, Spatial Intelligence
- Quelle: LinkedIn-Post Carlos Bañón (FORMAS.AI), 2026-09-14, Screen-Recording
- Erfasst: 2026-09-14
- Verwendung: intern / RaumBilder.ai
- Tags: cartesian, formas-ai, 3d-generierung, openai-astra, nachbau, spatial-intelligence, rhino, ifc

## Was das Tool macht (Beobachtung aus Demo)

**Cartesian by FORMAS.AI** überführt beliebige Eingaben (Foto, Skizze, Zeichnung, Bestandsmodell, Adresse) in strukturierte, editierbare 3D-Geometrie — mit räumlichem Verständnis für architektonische Beziehungen (Fenster↔Wand, Öffnung↔Raumfolge).

Demo-Sequenzen:
- **LOOK AROUND** — 360°-Navigation in generiertem Innenraum
- **GO INSIDE** — Transition Aussenkontext → Innenraum
- **DRAFT ANGLE** — 3D-Produktmodell mit Fertigungsanalyse (Neigungswinkel farbcodiert)

Export: Rhino, SketchUp, DWG, IFC (geplant laut Post)

## Vermutete Architektur (Reverse Engineering)

| Schicht | Wahrscheinliche Technologie |
|---|---|
| **Räumliches Verstehen** | OpenAI Astra (explizit erwähnt) — multimodales Modell mit 3D-Spatial-Reasoning |
| **3D-Rekonstruktion** | NeRF / Gaussian Splatting oder strukturiertes Mesh aus Tiefenschätzung |
| **Semantische Struktur** | LLM-gesteuerte Bauteil-Klassifikation (Wand, Öffnung, Decke…) |
| **Geometrie-Engine** | Wahrscheinlich Three.js / WebGL für Browser-Viewer + proprietärer Mesh-Builder |
| **360°-Navigation** | Equirectangular Rendering oder Cubemap aus dem 3D-Modell |
| **Export** | Open3D / Rhino-API / IFC-Bibliothek (ifcopenshell o.ä.) |

## Machbare Vereinfachung (Nachbau-Scope)

Statt Full-Stack: fokussierter Nachbau auf den AEC-Kernfall.

**Input:** Grundriss-Foto oder einfache Skizze
**Pipeline:**
1. GPT-4o Vision → Raumstruktur extrahieren (Wände, Öffnungen, Raumtypen) als JSON
2. JSON → parametrisches 3D-Modell (Rhino/Grasshopper via API oder Three.js im Browser)
3. Ausgabe: IFC oder DXF zum Weiterarbeiten

**Differenzierung für RaumBilder.ai:**
- Schweizer Baurecht / Normen als Constraints einbauen
- Fokus auf Bestandsaufnahme (Foto → Grundriss → Modell) statt Neubau-Entwurf

## Offene Fragen / nächste Schritte

- [ ] OpenAI Astra API-Verfügbarkeit prüfen (noch nicht öffentlich, Stand 9.2026)
- [ ] Alternativer Einstieg: GPT-4o + strukturierter Prompt für Raumextraktion testen
- [ ] Three.js vs. Rhino.compute für Geometrie-Output abwägen
- [ ] Waitlist Cartesian beitreten → Zugang für technische Tiefenanalyse: lnkd.in/g7Mw-ekM
